# SentryPortal

SentryPortal is a simulated school portal integrated with a Machine Learning-based Intrusion Detection System (IDS) to monitor, analyze, and flag suspicious user activities in real time.

> **Note:** This project is an academic simulation and educational proof-of-concept. It is **not** intended for production security environments.

## Project Structure

- **frontend/**: Vite + React + TypeScript web application styled with Tailwind CSS.
- **backend/**: FastAPI REST service with SQLAlchemy ORM and SQLite storage.
- **ml/**: Offline Machine Learning pipeline for preprocessing activity logs, training detection models, and evaluating performance.
- **docs/**: Documentation and design specifications.

## Running the portal locally

Start the backend and frontend in separate terminals:

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm run dev
```

The Vite development server proxies `/api` requests to the backend, so the portal
can also be opened through a LAN hostname or IP without the browser trying to
contact its own `localhost`. The backend must be running for sign-in and
onboarding to work.

For a separately hosted frontend, set `VITE_API_URL` to the backend API base URL
(including `/api`) when building the frontend, and set the backend's
`SENTRYPORTAL_CORS_ORIGINS` environment variable to a comma-separated list of
allowed frontend origins.
