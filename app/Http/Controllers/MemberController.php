<?php
namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\DownloadEvent;
use App\Models\Title;
use App\Services\EntitlementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class MemberController extends Controller
{
    public function __construct(private EntitlementService $svc) {}

    public function me(Request $r)
    {
        return ['user' => $r->user()->only('id', 'name', 'email', 'role')] + $this->svc->summary($r->user());
    }

    /** Whole published catalogue, each title flagged unlocked/locked for THIS member's plan. */
    public function library(Request $r)
    {
        [$plan] = $this->svc->current($r->user());
        $open = $this->svc->titlesFor($plan)->pluck('id')->all();
        return Title::where('visibility', 'published')->where('rights_status', 'cleared')
            ->orderBy('title')->get()
            ->map(fn ($t) => $t->toArray() + ['unlocked' => in_array($t->id, $open)]);
    }

    public function history(Request $r)
    {
        return $r->user()->downloads()->with('title:id,title,author')->latest()->paginate(20);
    }

    /** Checks plan + quota, reserves one download, returns a 5-minute signed link. */
    public function download(Request $r, Title $title)
    {
        $event = $this->svc->reserve($r->user(), $title);
        return ['url' => URL::temporarySignedRoute('download.file', now()->addMinutes(5), ['event' => $event->id])];
    }

    /** Signed route (no bearer token needed): streams the private PDF. */
    public function file(DownloadEvent $event)
    {
        abort_unless($event->status === 'reserved', 410, 'Link already used.');
        $key = $event->title->private_file_key;
        if (! Storage::disk('local')->exists($key)) {
            $event->update(['status' => 'failed']); // failed downloads do not consume quota
            abort(404);
        }
        $event->update(['status' => 'completed', 'completed_at' => now()]);
        AuditLog::create(['actor_user_id' => $event->user_id, 'action' => 'download.completed',
            'entity_type' => 'Title', 'entity_id' => $event->title_id]);
        return Storage::disk('local')->download($key, $event->title->slug . '.pdf');
    }
}
