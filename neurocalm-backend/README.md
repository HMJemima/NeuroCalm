# NeuroCalm Backend

## Local setup

This backend runs against PostgreSQL and can start without a trained ML model.
If the model paths are left empty, the analysis flow stays in simulation mode.

## Recommended Python version

Use Python 3.12 on this machine.
Python 3.14 is installed here too, but it is not a good fit for the optional TensorFlow dependency.

## Windows step by step

1. Create a virtual environment with Python 3.12:

```powershell
py -3.12 -m venv .venv
```

2. Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

3. Upgrade pip:

```powershell
python -m pip install --upgrade pip
```

4. Install the base backend dependencies:

```powershell
pip install -r requirements.txt
```

5. Copy the environment template:

```powershell
Copy-Item .env.example .env
```

6. Edit `.env` and set your PostgreSQL values:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=neurocalm
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
SECRET_KEY=put-a-long-random-secret-here
```

7. Make sure the database exists. Example with `psql`:

```powershell
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE neurocalm;"
```

Skip that command if your `neurocalm` database already exists.
If `psql` is not on your PATH, create the database from pgAdmin or the PostgreSQL SQL Shell instead.

8. Seed the database with demo users:

```powershell
python seed.py
```

9. Start the API:

```powershell
uvicorn app.main:app --reload
```

10. Open:

- API root: `http://127.0.0.1:8000/`
- Health check: `http://127.0.0.1:8000/health`
- Swagger docs: `http://127.0.0.1:8000/docs`

## Demo users after seeding

- `admin@neurocalm.com` / `admin123`
- `user@neurocalm.com` / `user123`

## Optional: enable Google, GitHub, and Microsoft login

The backend can issue the same JWT tokens through OAuth login too.

1. Fill the provider secrets in `.env`:

```env
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common
```

2. Register these backend callback URLs in the provider dashboards:

- `http://localhost:8000/api/v1/auth/oauth/google/callback`
- `http://localhost:8000/api/v1/auth/oauth/github/callback`
- `http://localhost:8000/api/v1/auth/oauth/microsoft/callback`

3. Keep the frontend callback route at:

- `http://localhost:5173/oauth/callback`

4. Restart the backend after editing `.env`.

## Optional: enable real ML inference

This repo already includes deployable artifacts in the workspace `model` folder.
The sample `.env` points at those files using relative paths from `neurocalm-backend`.

1. Install the ML dependency:

```powershell
pip install -r requirements-ml.txt
```

2. Fill these values in `.env`:

```env
MODEL_PATH=model/SALIENT_model.h5
MODEL_TYPE=SALIENT
SCALER_PATH=model/SALIENT_scaler.pkl
MODEL_METADATA_PATH=model/deploy_metadata.json
```

## Model-compatible preprocessing

The deployed SALIENT model natively expects a CSV that already contains these 8 columns:

```text
AB_I_O, AB_PHI_O, AB_I_DO, AB_PHI_DO,
CD_I_O, CD_PHI_O, CD_I_DO, CD_PHI_DO
```

If you already have a continuous CSV with those columns, convert it into the
windowed model format like this:

```powershell
python preprocess_model_input.py path\to\your-file.csv
```

That writes a chunked CSV under `preprocessed\...` and also produces a JSON
report.

If you want to inspect the raw workspace dataset first:

```powershell
python preprocess_model_input.py ..\TestData --report-only
```

The backend now also includes an experimental assumption-based converter for:

- raw `.nir`
- raw `.oxy`
- fnirSoft `hbo` / `hbr` / `oxy` / `raw` block exports

That converter:

- assumes optodes `1..8` map to `AB`
- assumes optodes `9..16` map to `CD`
- uses hemoglobin aggregates for intensity-like oxy/deoxy features
- uses subgroup differences and light dynamics as phase-like proxies
- resamples to the model cadence and windows into `150`-step chunks

Use it like this:

```powershell
python preprocess_model_input.py ..\TestData\Subject 01
```

Important: this raw-data path is shape-compatible and runnable, but it is still
an experimental approximation of the original Tufts preprocessing, not a
verified reproduction of their hidden upstream feature-generation recipe.

## Notes

- The app currently creates tables automatically on startup and during `seed.py`.
- Alembic is present, but there are no migration files yet.
