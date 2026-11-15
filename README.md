# Earth+br — frontend

React + Vite + Tailwind CSS app for **Earth+br**, a decision-support tool that helps small farmers
in Brazil's semi-arid Northeast plan crop rotations with NASA and FAO data.

All data comes from the Earth+br API (backend repository). Nothing is mocked.

## Run locally

```bash
npm install
npm run dev
```

The app calls the API at `http://localhost:8000` by default. To point it elsewhere, create a
`.env.local` file (not committed):

```
VITE_API_URL=https://your-api.example.com
```

## Deploy on Vercel

1. In <https://vercel.com>: *Add New* → *Project* → import this repository. `vercel.json` already
   sets the install command (`npm ci`), the build command and the output folder (`dist`).
2. In *Settings → Environment Variables*, add `VITE_API_URL` with the public **HTTPS** address of
   the API (for example the Render URL). It is read at build time, so redeploy after changing it.
3. Deploy. Routes use the URL hash (`/#/app`), so no rewrite rules are needed.

Notes:

- Install with **npm** (`package-lock.json` is the lockfile in use; `pnpm-lock.yaml` is out of date).
- The API must be served over HTTPS, otherwise the browser blocks the calls from an HTTPS site.
- Maps use OpenStreetMap tiles, loaded from the visitor's browser.
