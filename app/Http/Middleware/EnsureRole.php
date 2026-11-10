<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/** Usage: role:admin  |  role:any (any signed-in, non-suspended user) */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();
        abort_unless($user, 401);
        abort_if($user->status !== 'active', 403, 'This account is suspended.');
        abort_unless(in_array('any', $roles) || in_array($user->role, $roles), 403, 'Not allowed.');
        return $next($request);
    }
}
