# NeuroCalm Frontend

## Run locally

1. Install dependencies:

```powershell
npm install
```

2. Start the dev server:

```powershell
npm run dev
```

3. Open:

- `http://localhost:5173`

## API base URL

The frontend reads the backend URL from `.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Mock vs live data toggle

Use this file to switch the whole frontend between local mock data and the real backend:

- `src/config/appConfig.js`

Set:

```js
useMockDataEnabled: true
```

for mock mode, or:

```js
useMockDataEnabled: false
```

for live backend mode.

When live mode is on, the dashboard, history, reports, login, and upload flow all use the backend API.

## Live backend notes

- Backend should run at `http://localhost:8000`
- The backend API base should be `/api/v1`
- Login uses the seeded users from the backend
- Report downloads use the backend `/reports/:id/json` and `/reports/:id/pdf` routes

## Upload notes

The UI allows `.mat`, `.edf`, `.csv`, `.nir`, and `.oxy` files so it can cover both mock/demo use and the workspace test files.
For the currently deployed real SALIENT model path, the reliable production input is still the model-ready CSV format expected by the backend.
