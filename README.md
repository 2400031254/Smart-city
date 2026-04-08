# Smart City Dashboard — Backend API

Node.js + Express REST API with MySQL database.

## Live API
🔗 https://smartcity-2-production.up.railway.app

## Frontend
🌐 https://smartcity01.netlify.app

## Tech Stack
- Node.js + Express
- MySQL2
- JWT Authentication
- bcryptjs for password hashing
- CORS enabled
- Deployed on Railway

## API Endpoints

### Auth
- `POST /api/register` — Register user
- `POST /api/login` — Login (user/admin)

### Issues
- `GET /api/issues` — Get issues
- `POST /api/issues` — Report issue
- `PUT /api/issues/:id` — Update issue
- `DELETE /api/issues/:id` — Delete issue

### Tourist Places
- `GET /api/places` — Get all places
- `POST /api/places` — Add place (admin)
- `PUT /api/places/:id` — Update place (admin)
- `DELETE /api/places/:id` — Delete place (admin)

### Emergency, Buses, Alerts, Users
- Full CRUD for each (admin protected)

## Environment Variables
```
MYSQLHOST=
MYSQLPORT=
MYSQLUSER=
MYSQLPASSWORD=
MYSQLDATABASE=
JWT_SECRET=
NODE_ENV=production
PORT=8080
```

## Run Locally
```bash
npm install
node server.js
```
