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

## Choosing a dropdown

| Need | Component |
|---|---|
| Short fixed list where one value is always picked (Yes / No, Active / Inactive) | `NativeSelect` (`src/components/ui/native-select.tsx`), with `YES_NO_OPTIONS` / `ACTIVE_OPTIONS` |
| Longer or loaded list, type to search in the field | `ComboBox` (`src/components/ui/combo-box.tsx`) |
| Same, but the field only shows the value and the search box sits on top of the list | `ComboBox` with `searchInModal` |
| Let the user create a missing entry | `ComboBox` with `addNew` and `onAddNew(searchText)`; the typed text is passed so the add form can start with it |
| Several values | `MultiComboBox` |

All of them follow the app's Enter navigation: Enter picks and moves to the next field.
