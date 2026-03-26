# Smart City Dashboard - Backend Setup

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

Server runs on: `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Issues
- `GET /api/issues` - Get all issues (user: own issues, admin: all)
- `POST /api/issues` - Report new issue
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue

### Tourist Places
- `GET /api/places` - Get all places
- `POST /api/places` - Add place (admin only)
- `DELETE /api/places/:id` - Delete place (admin only)

### Emergency Numbers
- `GET /api/emergency` - Get emergency numbers
- `POST /api/emergency` - Add emergency number (admin only)

### Buses
- `GET /api/buses` - Get bus routes
- `POST /api/buses` - Add bus route (admin only)

### Alerts
- `GET /api/alerts` - Get recent alerts
- `POST /api/alerts` - Add alert (admin only)

### Users
- `GET /api/users` - Get all users (admin only)

## Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**User:**
- Username: `user`
- Password: `user123`

## Database

SQLite database file: `smartcity.db` (auto-created)

## Tech Stack

- Node.js + Express
- SQLite3
- JWT Authentication
- bcrypt for password hashing
- CORS enabled
