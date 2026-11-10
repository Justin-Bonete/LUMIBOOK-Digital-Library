<?php
namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\DownloadEvent;
use App\Models\Entitlement;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Title;
use App\Models\User;
use App\Services\EntitlementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function __construct(private EntitlementService $svc) {}

    public function stats()
    {
        $members = User::where('role', 'member')->get();
        $byPlan = [];
        $atLimit = 0;
        foreach ($members as $m) {
            $s = $this->svc->summary($m);
            $byPlan[$s['plan']['code']] = ($byPlan[$s['plan']['code']] ?? 0) + 1;
            $atLimit += $s['usage']['remaining'] === 0 ? 1 : 0;
        }
        return [
            'members' => $members->count(),
            'suspended' => $members->where('status', 'suspended')->count(),
            'by_plan' => $byPlan,
            'at_limit' => $atLimit,
            'downloads_30d' => DownloadEvent::where('status', 'completed')->where('created_at', '>=', now()->subDays(30))->count(),
        ];
    }

    /** All users with the plan each one is on and how much of it they've used. */
    public function users(Request $r)
    {
        $q = User::query()->when($r->q, fn ($b, $s) => $b->where(fn ($w) => $w
            ->where('name', 'ilike', "%$s%")->orWhere('email', 'ilike', "%$s%")))->latest();
        $page = $q->paginate(25);
        $page->getCollection()->transform(fn (User $u) => $u->only('id', 'name', 'email', 'role', 'status', 'created_at')
            + $this->svc->summary($u)
            + ['last_download_at' => $u->downloads()->latest()->value('created_at')]);
        return $r->plan ? $page->setCollection($page->getCollection()->where('plan.code', $r->plan)->values()) : $page;
    }

    /** Full trace for one user: plan history, orders, downloads, audit trail. */
    public function user(User $user)
    {
        return [
            'user' => $user->only('id', 'name', 'email', 'role', 'status', 'created_at'),
            'summary' => $this->svc->summary($user),
            'entitlements' => $user->entitlements()->with('plan:id,code,name', 'grantedBy:id,name')->latest()->get(),
            'orders' => $user->orders()->with('plan:id,name', 'payments')->latest()->get(),
            'downloads' => $user->downloads()->with('title:id,title')->latest()->limit(100)->get(),
            'audit' => AuditLog::where(fn ($q) => $q->where('entity_type', 'User')->where('entity_id', $user->id)
                ->orWhere('actor_user_id', $user->id))->latest('created_at')->limit(100)->get(),
        ];
    }

    /** Manually grant / change a member's plan (e.g. after verifying an off-platform payment). */
    public function setPlan(Request $r, User $user)
    {
        $data = $r->validate(['plan_code' => 'required|exists:plans,code', 'note' => 'nullable|string|max:300']);
        $plan = Plan::where('code', $data['plan_code'])->firstOrFail();

        DB::transaction(function () use ($user, $plan, $data) {
            $user->entitlements()->where('status', 'active')->update(['status' => 'replaced', 'ends_at' => now()]);
            $order = Order::create(['user_id' => $user->id, 'plan_id' => $plan->id,
                'order_number' => 'LB-' . strtoupper(Str::random(8)), 'amount' => $plan->price ?? 0,
                'status' => 'paid', 'paid_at' => now()]);
            $order->payments()->create(['provider' => 'manual', 'status' => 'verified', 'verified_at' => now()]);
            Entitlement::create(['user_id' => $user->id, 'plan_id' => $plan->id, 'order_id' => $order->id,
                'granted_by' => auth()->id(), 'status' => 'active']);
            AuditLog::record('plan.assigned', $user, ['plan' => $plan->code, 'note' => $data['note'] ?? null]);
        });
        return $this->user($user);
    }

    public function setStatus(Request $r, User $user)
    {
        $data = $r->validate(['status' => 'required|in:active,suspended']);
        abort_if($user->isAdmin(), 422, 'The owner account cannot be suspended.');
        $user->update($data);
        $user->tokens()->when($data['status'] === 'suspended')->delete();
        AuditLog::record('user.' . $data['status'], $user);
        return $this->user($user);
    }

    public function titles() { return Title::withCount('plans')->latest()->paginate(50); }

    public function storeTitle(Request $r)
    {
        $d = $r->validate(['title' => 'required|max:200', 'author' => 'required|max:150', 'category' => 'required|max:80',
            'description' => 'nullable|string', 'file' => 'required|file|mimes:pdf|max:102400']);
        // TODO: virus-scan the upload (e.g. ClamAV) before it is allowed to publish.
        $key = $r->file('file')->store('pdfs', 'local'); // private disk, outside the web root
        $t = Title::create(['slug' => Str::slug($d['title']) . '-' . Str::lower(Str::random(4)), 'title' => $d['title'],
            'author' => $d['author'], 'category' => $d['category'], 'description' => $d['description'] ?? null,
            'private_file_key' => $key, 'rights_status' => 'pending', 'visibility' => 'draft']);
        AuditLog::record('title.created', $t);
        return response()->json($t, 201);
    }

    /** Publishing requires rights_status=cleared, so nothing unlicensed can go live. */
    public function updateTitle(Request $r, Title $title)
    {
        $d = $r->validate(['title' => 'sometimes|max:200', 'author' => 'sometimes|max:150', 'category' => 'sometimes|max:80',
            'rights_status' => 'sometimes|in:pending,cleared,blocked', 'visibility' => 'sometimes|in:draft,published']);
        $title->fill($d);
        abort_if($title->visibility === 'published' && $title->rights_status !== 'cleared', 422, 'Clear the rights before publishing.');
        $title->save();
        AuditLog::record('title.updated', $title, $d);
        return $title;
    }

    public function plans() { return Plan::withCount('titles')->orderBy('tier')->get(); }

    /** Curated collection for a plan; cannot exceed its e-book limit. */
    public function syncPlanTitles(Request $r, Plan $plan)
    {
        $ids = $r->validate(['title_ids' => 'array', 'title_ids.*' => 'exists:titles,id'])['title_ids'] ?? [];
        abort_if($plan->ebook_limit !== null && count($ids) > $plan->ebook_limit, 422, "Limit is {$plan->ebook_limit} titles.");
        $plan->titles()->sync($ids);
        AuditLog::record('plan.titles_synced', $plan, ['count' => count($ids)]);
        return $plan->loadCount('titles');
    }

    public function audit() { return AuditLog::with('actor:id,name')->latest('created_at')->paginate(50); }
}
