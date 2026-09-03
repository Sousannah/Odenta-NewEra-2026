# Mock data (temporary)

Everything in this folder is throwaway scaffolding for the UI. It is **not**
imported anywhere in the app except by `src/services/*`.

## How to remove it when the real backend lands

1. Re-implement each function in `src/services/*.js` with a real HTTP call
   (the exported function names and return shapes are the contract).
2. Delete this whole `src/mock/` folder.
3. Delete `src/services/http.mock.js`.

No screen, component or hook imports `@/mock` directly — grep for it to confirm.
