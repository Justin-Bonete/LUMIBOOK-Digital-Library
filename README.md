# LUMIBOOK backend (Laravel 11 + PostgreSQL + Sanctum)

Drop these files into a fresh Laravel 11 project (they overwrite `app/Models/User.php`).

## Setup
```bash
composer create-project laravel/laravel lumibook && cd lumibook
php artisan install:api                 # installs Sanctum + routes/api.php
# copy this folder's contents over the project, then:
# .env -> DB_CONNECTION=pgsql ..., ADMIN_EMAIL=you@domain.com, ADMIN_PASSWORD=<strong password>
```
Register the middleware alias in `bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias(['role' => \App\Http\Middleware\EnsureRole::class]);
})
```
```bash
php artisan migrate
php artisan db:seed --class=LumibookSeeder
php artisan serve
```
PDFs are stored on the private `local` disk (`storage/app/private`), never in `public/`.

## Roles
| Role | Can do |
| --- | --- |
| `admin` (owner) | Everything under `/api/admin/*`: all users, plan trace, assign plans, suspend, titles, collections, audit log |
| `member` | `/api/me`, `/api/library`, `/api/history`, `/api/titles/{id}/download` — limited to their plan |

## Access rules (EntitlementService)
Free: 5 titles, 3 downloads/month (proposed) · Premium: up to 20, 10 lifetime · Premium Plus: up to 58, 30 lifetime · All Access: all eligible, unlimited (throttled).
A download needs: signed-in + active account → title published and rights-cleared → title in plan collection → quota remaining (row-locked reservation) → 5-minute signed link. Failed downloads don't consume quota.
