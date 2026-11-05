# Smith & Gift Voucher (Dhanapal)

Back-office web app with two modules, chosen on the login screen:

- **Smith**: cash and gold-weight ledger per smith, smith users, orders.
- **Gift Voucher (GV)**: issue vouchers (with tag printing), receipt, introducers, report.

Next.js (App Router, static export to `out/`), MUI, Tailwind, React Query.
Runtime settings (API base URL, company) are read from `public/config.json`.

## Scripts

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export to out/
```

## Project structure

The layout follows the Saving Scheme frontend. `@/` points at the repo root,
so imports read `@/src/module/smith/...`, `@/lib/api/client`, `@/hooks/...`.

```
app/                      routes only (thin pages)
  layout.tsx              providers + app shell
  login/                  /login
  (app)/                  signed-in screens (route group, no URL segment)
    page.tsx              /                 Smith dashboard
    smiths/create/        /smiths/create    Smith users
    smiths/order/         /smiths/order     Smith orders
    gift-voucher/         /gift-voucher     Gift Voucher
lib/api/client.ts         shared axios instance (base URL from config.json)
hooks/                    app-wide hooks
src/
  components/
    app-shell/            header, footer, shell, protected route
    ui/                   table, editable cell
    print/                print table
  features/auth/          login form, auth context, login api
  module/<name>/          one folder per business module
    api/                  REST calls
    component/            screens and forms
    context/              module state providers
    hook/                 React Query / data hooks
    type/                 TypeScript types
    lib/                  module helpers
    index.ts              public exports
  providers/              config, query, navigation, toast
  theme/                  theme context, colors, spacing, font sizes
  utils/format/           number, date and words formatting
```

Modules: `smith`, `smith-order`, `user`, `gift-voucher`.
