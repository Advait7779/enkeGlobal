# ENKEglobal

React/Vite storefront with a separate Express/PostgreSQL CMS API and enquiry lead tracker.

## Project structure

```text
ENKEglobal/
├── frontend/                 React, Vite, Nginx and public website assets
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── .env.example
├── backend/                  Express API, CMS, uploads and PostgreSQL scripts
│   ├── data/Products.json
│   ├── migrations/
│   ├── public/Images/        Existing catalogue images (unchanged)
│   ├── routes/
│   ├── uploads/              New CMS/Excel uploads; ignored by Git
│   ├── Dockerfile
│   └── .env.example
└── package.json              Convenience commands for local development
```

The frontend and backend are independent applications. In production, the frontend reads `VITE_API_BASE_URL` and calls the backend directly. Existing catalogue images are served by the backend from `/Images`; new CMS and Excel-import images are served from persistent storage at `/uploads`.

## Local setup

1. Install both applications:

   ```powershell
   npm.cmd run install:all
   ```

2. Copy `backend/.env.example` to `backend/.env` and configure PostgreSQL, JWT and admin credentials.
3. For local development, set `UPLOAD_DIR=uploads`. `VITE_API_BASE_URL` can remain unset because Vite proxies API and image requests to port 5009.
4. Prepare the database:

   ```powershell
   npm.cmd run migrate
   npm.cmd run seed
   ```

5. Run these commands in separate terminals:

   ```powershell
   npm.cmd run dev:backend
   npm.cmd run dev:frontend
   ```

Frontend: `http://localhost:5174`

Backend health: `http://localhost:5009/api/health`

## Coolify deployment

Create one PostgreSQL database and two applications from the same GitHub repository.

### 1. Backend application

- Base directory: `/backend`
- Build pack: `Dockerfile`
- Dockerfile: `/Dockerfile`
- Exposed port: `5009`
- Health check path: `/api/health`
- Pre-deployment command: `npm run migrate`
- Domain example: `https://api.example.com`
- Persistent storage destination: `/app/uploads`

Backend environment:

```env
NODE_ENV=production
PORT=5009
DATABASE_URL=<Coolify PostgreSQL internal URL>
DB_SSL=false
JWT_SECRET=<at least 32 random characters>
ADMIN_EMAIL=<admin email>
ADMIN_PASSWORD=<strong unique password>
CLIENT_ORIGIN=https://www.example.com
UPLOAD_DIR=/app/uploads
EXCEL_IMPORT_TMP_DIR=/tmp/enkeglobal-excel-imports
WEB3FORMS_ACCESS_KEY=
ENQUIRY_TO_EMAIL=
```

After the first backend deployment, open its Coolify terminal and run `npm run seed` once. Do not run the seed repeatedly unless the database is empty; existing product IDs are skipped.

### 2. Frontend application

- Base directory: `/frontend`
- Build pack: `Dockerfile`
- Dockerfile: `/Dockerfile`
- Exposed port: `80`
- Health check path: `/healthz`
- Domain example: `https://www.example.com`

Frontend build variable:

```env
VITE_API_BASE_URL=https://api.example.com
```

Mark `VITE_API_BASE_URL` as a build-time variable in Coolify. It must contain the backend origin without a trailing slash and without an `/api` suffix. Redeploy the frontend whenever this value changes.

Set `CLIENT_ORIGIN` on the backend to the exact frontend origin. Multiple allowed origins can be comma-separated.

## Deployment order

1. Deploy PostgreSQL.
2. Deploy the backend and confirm `/api/health` reports `database: connected`.
3. Run the one-time backend seed.
4. Deploy the frontend with the backend URL as `VITE_API_BASE_URL`.
5. Test admin login, product add/edit/delete, image upload, Excel import, public product images, enquiry submission and WhatsApp redirection.

## Product image persistence

Never mount persistent storage over `backend/public/Images`; those are the existing version-controlled catalogue images. Mount storage only at `/app/uploads`. Back up both PostgreSQL and the uploads volume.

## Excel product import

Administrators can import `.xlsx` workbooks into a selected category. The application accepts files up to 1 GB, 10,000 products, 10 MB per embedded image and 900 MB of embedded images. ExcelJS reads the workbook in memory, so a 1 GB workbook is not guaranteed to complete on an 8 GB server. Use one import at a time and load-test representative large workbooks.

Coolify's proxy request timeout must also be increased for uploads that can take longer than its default limit. The temporary import directory needs enough free disk space for the workbook and extraction overhead.

## Verification commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd test
```
