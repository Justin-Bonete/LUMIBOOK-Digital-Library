<?php
namespace App\Services;

use App\Models\DownloadEvent;
use App\Models\Entitlement;
use App\Models\Plan;
use App\Models\Title;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Single source of truth for "what may this user access, and how much is left". */
class EntitlementService
{
    /** @return array{0: Plan, 1: ?Entitlement} highest active plan, or Free when none. */
    public function current(User $user): array
    {
        $ent = $user->entitlements()->where('status', 'active')
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()))
            ->with('plan')->get()
            ->sortByDesc(fn ($e) => $e->plan->tier)->first();

        return [$ent?->plan ?? Plan::where('code', 'free')->firstOrFail(), $ent];
    }

    /** Published + rights-cleared titles the plan includes (curated via plan_titles). */
    public function titlesFor(Plan $plan)
    {
        $q = Title::where('visibility', 'published')->where('rights_status', 'cleared');
        if ($plan->ebook_limit === null) {
            return $q; // All-Access: every eligible title
        }
        return $q->whereIn('id', fn ($s) => $s->select('title_id')->from('plan_titles')->where('plan_id', $plan->id));
    }

    public function usage(User $user, Plan $plan): array
    {
        $q = DownloadEvent::where('user_id', $user->id)->whereIn('status', ['reserved', 'completed']);
        if ($plan->download_period === 'month') {
            $q->where('created_at', '>=', now()->startOfMonth());
        }
        $used = $q->count();
        $limit = $plan->download_limit;
        return [
            'used' => $used,
            'limit' => $limit,
            'remaining' => $limit === null ? null : max(0, $limit - $used),
            'period' => $plan->download_period,
        ];
    }

    /** Atomically reserve one download. Row-locks the user so parallel requests can't overspend. */
    public function reserve(User $user, Title $title): DownloadEvent
    {
        return DB::transaction(function () use ($user, $title) {
            User::whereKey($user->id)->lockForUpdate()->first();
            [$plan, $ent] = $this->current($user);

            abort_unless($title->visibility === 'published' && $title->rights_status === 'cleared', 404);
            abort_unless($this->titlesFor($plan)->whereKey($title->id)->exists(), 403, 'Your plan does not include this title.');
            abort_if($this->usage($user, $plan)['remaining'] === 0, 429, 'Download limit reached for your plan.');

            return DownloadEvent::create([
                'user_id' => $user->id,
                'title_id' => $title->id,
                'entitlement_id' => $ent?->id,
                'request_id' => (string) Str::uuid(),
                'status' => 'reserved',
            ]);
        });
    }

    /** Summary used by both the member "My plan" card and the admin user table. */
    public function summary(User $user): array
    {
        [$plan] = $this->current($user);
        return [
            'plan' => ['code' => $plan->code, 'name' => $plan->name, 'tier' => $plan->tier],
            'usage' => $this->usage($user, $plan),
            'titles_unlocked' => $this->titlesFor($plan)->count(),
        ];
    }
}
