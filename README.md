# JobSafe — Frontend + Backend starter

This repository contains the existing JobSafe website frontend and a separate Node.js/Express backend API.

## Project structure

```text
JobSafe-full/
├── frontend/
│   └── index.html          # Existing JobSafe interface
├── backend/
│   ├── src/
│   │   ├── server.js       # REST API routes
│   │   ├── db.js           # SQLite tables
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── scanner.js      # Transparent starter risk rules
│   ├── .env.example
│   └── package.json
└── README.md
```

## Run the backend (Mac)

1. Install Node.js 20 or newer.
2. Open Terminal and enter the backend folder:

   ```bash
   cd JobSafe-full/backend
   npm install
   cp .env.example .env
   ```

3. Open `backend/.env` and replace `JWT_SECRET` with a long random secret (at least 32 characters). Keep this secret private.
4. Start the API:

   ```bash
   npm run dev
   ```

5. Test `http://localhost:5000/api/health`; it should return `{"status":"ok","service":"JobSafe API"}`.

## Run the frontend

Open `frontend/index.html` in a browser, or serve it locally:

```bash
cd JobSafe-full/frontend
python3 -m http.server 5500
```

Then visit `http://localhost:5500`.

## API endpoints

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/health` | API health check | No |
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Sign in | No |
| POST | `/api/scans` | Analyze and save a posting | Yes |
| GET | `/api/scans` | Get current user's scan history | Yes |
| POST | `/api/reports` | Submit a community report | Yes |
| GET | `/api/reports` | Get current user's reports | Yes |

For protected routes, send `Authorization: Bearer <token>`.

## Important integration note

The frontend is the current visual prototype and still uses its built-in demo interactions. The backend API is included as a separate working starter, but the frontend forms have **not yet been connected** to these API endpoints. The demo sign-in shown in the page is not real authentication. The next development step is wiring the frontend forms to `/api/auth`, `/api/scans`, and `/api/reports`.

The scanner is a small explainable keyword-rule prototype, not a trained machine-learning model. It cannot establish that a company or job is genuine. Community reports are unverified. Before public deployment, add admin moderation, email verification, stronger validation, privacy/retention controls, HTTPS, secure deployment secrets, automated tests and abuse protection.
