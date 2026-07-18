# ENKEglobal

React/Vite storefront with an Express/PostgreSQL CMS and enquiry lead tracker.

## Local setup

1. Install frontend and backend dependencies:

   ```powershell
   npm.cmd ci
   npm.cmd run server:install
   ```

2. Copy `server/.env.example` to `server/.env` and set the database, admin, JWT, and enquiry email values.
3. Create/upgrade the database and seed the product catalogue:

   ```powershell
   npm.cmd run server:migrate
   npm.cmd run server:seed
   ```

4. Run the API with `npm.cmd run server:dev`, then run the frontend with `npm.cmd run dev` in a second terminal.

## Production deployment

Deploy this project as a Node service, not as a static-only site. The Node process serves both the built frontend and `/api`, which keeps CMS and form requests on the same origin.

- Build command: `npm ci && npm run server:install && npm run build`
- Migration command: `npm run server:migrate`
- One-time seed command for an empty database: `npm run server:seed`
- Start command: `npm start`
- Required environment: `NODE_ENV=production`, database settings, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ENQUIRY_TO_EMAIL`
- Health check: `/api/health` must return HTTP 200 and `database: connected`

Product images uploaded from the CMS are stored on disk. On container or cloud hosting, mount a persistent disk and set `UPLOAD_DIR` to that mount. Without persistent storage, newly uploaded images can disappear after a restart or redeploy. Existing images in `public/Images` remain part of the build.

The supplied production setup assumes one Node service. If frontend and backend are deployed separately, frontend API URL handling must also be added and `CLIENT_ORIGIN` must allow the frontend origin.

## Pre-deployment checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

After deployment, verify admin login, product add/edit/delete, image upload, public product visibility, enquiry submission, lead status updates, and email notification delivery. FormSubmit may send a one-time activation message to `ENQUIRY_TO_EMAIL` before notifications begin.

## Excel product import

Administrators can open **Products**, choose **Import from Excel**, select an existing category or add a new one, and upload an `.xlsx` workbook. Every imported row is assigned to the category selected in the popup; workbook category values are intentionally ignored.

- Required column: `Name` or `Product Name`
- Optional columns: `Manufacturer`, `Description`, `In Stock`, `Rating`, `Reviews`, `Image`, `Badge`, `Badge Color`, `Price`, and `Old Price`
- Images: place one embedded image on the same row as its product, or enter an HTTP image URL or existing server image filename in the `Image` column
- Limits: 1 GB per workbook, 10,000 products per import, 10 MB per embedded image, and 900 MB of embedded images per import

Large workbooks are uploaded to temporary disk instead of being buffered fully by the HTTP upload layer. Database writes are batched inside one transaction, invalid rows prevent a partial database import, and temporary workbooks/uploaded images are removed after failure or completion.

For 1 GB uploads, the hosting platform and any reverse proxy must also allow a request body of at least 1 GB and provide sufficient temporary disk, RAM, and request time. For example, an Nginx deployment needs an appropriate `client_max_body_size` and proxy timeout configuration; provider-level limits can still reject the upload before it reaches Node.
