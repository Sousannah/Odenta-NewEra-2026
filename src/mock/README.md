# Mock backend (temporary)

An in-memory stand-in for the API. It is stateful within a session, so flows
such as transferring money, taking a payment or advancing a lab case really
change the data behind them.

## Layout

- `router.js` — the route table. Handlers are registered against path patterns
  with `:param` segments, exactly the way the real server routes.
- `db/*.js` — fixtures. Appointments and recalls are generated relative to
  *today* so the calendar is never empty.
- `index.js` — aggregates the fixtures for the router.

## Rules

- Only `src/api/client.js` reaches into this folder, and only when
  `VITE_API_MODE` is `mock`. No component, hook or service imports it.
- Handlers throw the same `ApiError` shapes the live driver produces, so
  validation paths (insufficient funds, unknown id, forbidden) can be exercised
  before the backend exists.

## Removing it

1. Set `VITE_API_MODE=live` and `VITE_API_BASE_URL` in `.env`.
2. Reconcile `src/api/endpoints.js` with the real paths.
3. Delete this folder.

Verify nothing else depends on it:

```bash
grep -rn "@/mock" src --include=*.jsx --include=*.js
```

Only `src/api/client.js` should appear.
