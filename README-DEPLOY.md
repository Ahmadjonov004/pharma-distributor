
# Deploying to Vercel (Client-Only)

This repo is a monorepo with `client/` (Vite + React) and `server/` (Express). Vercel is great for static front-ends.
For speed and reliability, deploy **only the `client`** to Vercel, and host the server on a separate host (Railway, Render, VPS, etc.).

## Quick steps

1. Set your backend URL as an environment variable in Vercel Project Settings:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-domain.example.com`

2. Ensure your front-end uses `import.meta.env.VITE_API_URL` for all API calls.

3. The included `vercel.json` config uses `@vercel/static-build` to build the Vite app and serve `dist/`.

4. Build command: `npm run build` (inside `client/`), output directory: `dist`.

## Fix for "Permission denied" on Linux servers

If your filesystem is mounted with `noexec`, binaries in `node_modules/.bin` cannot be executed directly, causing errors like:

```
sh: line 1: .../node_modules/.bin/vite: Permission denied
sh: line 1: .../node_modules/.bin/nodemon: Permission denied
```

This repo's `package.json` scripts were patched to call the Node JS entry files directly, e.g.:
- `node ./node_modules/vite/bin/vite.js`
- `node ./node_modules/nodemon/bin/nodemon.js index.js`

This bypasses the `noexec` limitation.

## Local development

```bash
npm run setup      # installs deps in client/ and server/
npm run dev        # runs client and server concurrently
```

