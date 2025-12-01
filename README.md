Project: Pharma Distributor

Dev quick-start

- Start the server (development):

```powershell
cd server
npm install
#$env:JWT_SECRET = 'replace_with_secure_value'
npx nodemon index.js
```

- Start the client (development):

```powershell
cd client
npm install
npm run dev
```

Notes
- Default JWT secret is only for development. Set `JWT_SECRET` env var before running server in production.
- Local-first behavior: app works offline using `localStorage`. When you register/login, the client saves a token (`pharma_token`) and will sync local changes to the server using the `/api/sync` endpoint.
- Useful localStorage keys:
	- `pharma_currentUser` — logged-in user object
	- `pharma_token` — JWT token
	- `pharma_data_<user.id>` — per-user data mirror (medicines, pharmacies, distributions)
	- `pharma_sync_queue_<user.id>` — pending changes queued for sync

Testing sync
- Add some medicines/distributions while offline (or before registering).
- Register or login using the Auth page to create an account and token.
- The app will push queued changes to the server automatically when online.

If you'd like, I can add automated tests or a small script to seed demo data.

SQLite migration & production notes
- The server supports an optional SQLite persistence layer using `better-sqlite3`.
- To enable SQLite persistence on your host, set the environment variable `USE_SQLITE=1` before starting the server. Example (PowerShell):

```powershell
cd server
npm install
$env:USE_SQLITE = '1'
$env:JWT_SECRET = 'your_production_jwt_secret'
npx nodemon index.js
```

- To migrate existing `db.json` into SQLite run:

```powershell
cd server
npm run migrate-sqlite
```

- After migration your data will be in `server/db.sqlite`. Note that `better-sqlite3` is a native module and may require a build toolchain on some CI/hosting platforms.

Deploy notes recap
- Frontend: host on Vercel/Netlify. Set `VITE_API_BASE` to your backend URL.
- Backend: host on Render/Railway/Heroku for persistent filesystem, or adapt to a managed DB (Postgres) and host serverless functions on Vercel/Netlify.

