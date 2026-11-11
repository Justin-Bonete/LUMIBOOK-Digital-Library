# LUMIBOOK frontend (React + TypeScript + Vite)

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api -> http://localhost:8000)
npm run build      # type-check + production build
```
Start the Laravel API first (`php artisan serve`). For a separate API host set `VITE_API_URL=https://api.example.com/api`.

Sign in with the owner account from the seeder (ADMIN_EMAIL / ADMIN_PASSWORD), or in local seed data: `free@lumibook.test`, `premium@lumibook.test`, `plus@lumibook.test`, `all@lumibook.test` (password `password`).

Notes: the Sanctum token is kept in localStorage (simple SPA setup; keep the app free of XSS and consider cookie-based Sanctum SPA auth for production). Role checks in the UI are cosmetic; the API enforces them.
