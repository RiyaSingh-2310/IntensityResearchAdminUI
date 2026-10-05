# Intensity Research Admin

Internal admin console for [Intensity Research](https://intensityresearch.com/) — panelists, survey assignments, reward requests and payout settings.

Contact: info@intensityresearch.com

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Radix), TanStack Query, React Router, Recharts, Sonner.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5176/admin/login
```

| Script            | Purpose                         |
| ----------------- | ------------------------------- |
| `npm run dev`     | Dev server (port 5176)          |
| `npm run build`   | Type-check and production build |
| `npm run preview` | Serve the build (port 4176)     |
| `npm run lint`    | ESLint                          |

The app is served under `/admin/`. SPA fallbacks for static hosts are included (`public/_redirects`, `public/staticwebapp.config.json`, `public/web.config`, `vercel.json`, and a generated `404.html`).

## API

- Base URL: `https://intensityresearch.com/intensityapi` (`VITE_API_BASE_URL`)
- Swagger (source of truth): https://intensityresearch.com/intensityapi/docs/

Admins sign in with `POST /admin/login`; the returned bearer token is kept in `sessionStorage` (or `localStorage` when "Remember me" is checked) and cleared on any `401`. Authorization is enforced by the API on every `/admin/*` route — the UI never grants privileges on its own.

### Endpoints used

| Area               | Endpoints                                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| Auth               | `POST /admin/login`                                                         |
| Panelists          | `GET /admin/panelists`, `GET/PUT /admin/panelists/{id}`                     |
| Manual credit      | `POST /admin/rewards/credit`                                                |
| Survey assignments | `GET/POST /admin/surveys`, `GET/PUT/DELETE /admin/surveys/{id}`             |
| Reward requests    | `GET /admin/reward-requests`, `PUT /admin/reward-requests/{id}`             |
| Settings           | `GET/PUT /admin/settings`, `POST /admin/test-email`                         |
| Public lookups     | `GET /settings` (payout methods)                                            |

Dashboard and Analytics figures are calculated in the browser from these endpoints; there is no dedicated stats endpoint. Demographic charts and gender/age filters read onboarding answers from each panelist's detail record, so they cover at most the 500 newest panelists and say so in the UI when that limit applies.

### Not available in the Intensity API

These features from the baseline admin UI have no Intensity endpoint, so they are intentionally not built (no mock data):

- Admin change password, forgot/reset password, profile edit, profile photo, logout endpoint
- RFQ management, partner management
- Language / country / configuration CRUD
- Roles and permissions management, audit logs
- Onboarding question CRUD
- Rewards catalog CRUD (payout methods come from `GET /settings` and are read-only; Amazon/Flipkart/PayPal can be toggled in Settings)

`POST /auth/forgot-password` exists but is for panelists only; it is not used for admins.
