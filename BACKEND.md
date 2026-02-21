# Backend Documentation

## Overview
The backend is an Express server with a MySQL database. It handles authentication, stores generated plans, logs workouts and meals, tracks progress, and serves exercise metadata for the frontend.

## Tech Stack
- Node.js + Express
- MySQL with mysql2/promise
- JWT for authentication
- bcrypt for password hashing

## Entry Points
- Server startup: [Backend/server.js](Backend/server.js)
- Database pool: [Backend/db.js](Backend/db.js)

## Environment Configuration
See [Backend/.env.example](Backend/.env.example) for required variables:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

## Project Structure
- Routes: [Backend/routes](Backend/routes)
- SQL schema: [Backend/schema.sql](Backend/schema.sql)
- Migrations: [Backend/migrations](Backend/migrations)
- Static exercise data: [exercises](exercises)

## File-by-File Explanation
- Server bootstrap: [Backend/server.js](Backend/server.js)
  - Creates the Express app, applies middleware, serves static exercises, and mounts API routes.
- Database pool: [Backend/db.js](Backend/db.js)
  - Initializes MySQL connection pooling and verifies connectivity.
- Auth routes: [Backend/routes/auth.js](Backend/routes/auth.js)
  - Registration and login, password hashing, JWT issuance, and plan persistence.
- User routes: [Backend/routes/user.js](Backend/routes/user.js)
  - Protected endpoints for profiles, progress, meal/workout logging, predictions, and recommendations.
- Exercise lookup: [Backend/routes/exercises.js](Backend/routes/exercises.js)
  - Loads JSON exercise data and provides fuzzy lookup with image URLs.
- Database schema: [Backend/schema.sql](Backend/schema.sql)
  - Defines all tables and relationships for users, plans, logs, and photos.
- Migrations: [Backend/migrations](Backend/migrations)
  - Incremental SQL updates for new tables/columns.
- Environment template: [Backend/.env.example](Backend/.env.example)
  - Documents required variables for DB connection and JWT signing.
- Backend dependencies: [Backend/package.json](Backend/package.json)
  - Scripts and Node dependencies for server runtime.

## Server Setup
[Backend/server.js](Backend/server.js) registers middleware and routes:
- `cors` and JSON body parsing.
- Static files under `/exercises` (exercise images).
- API routes:
  - `/api/auth` for authentication.
  - `/api/user` for profile, progress, and tracking.
  - `/api/exercises` for lookup.

## Authentication
JWT is issued on login/registration and passed via a `token` header. Protected routes verify the token with `JWT_SECRET`.

## Routes
### Auth routes
Located in [Backend/routes/auth.js](Backend/routes/auth.js)
- `POST /api/auth/register`
  - Creates user credentials, profile, and generated plan in a transaction.
  - Expects user data plus `generatedPlan` payload from the frontend.
- `POST /api/auth/login`
  - Validates credentials and returns a JWT.

### User routes
Located in [Backend/routes/user.js](Backend/routes/user.js)
- `GET /api/user/dashboard`
  - Returns user profile and active generated plan.
- `PUT /api/user/profile`
  - Updates profile fields and optional photos.
  - Also logs BMI when weight or height changes.
- `GET /api/user/profile`
  - Returns profile + stored photos.
- `POST /api/user/log-activity`
  - Logs workout completion and performance metrics.
- `POST /api/user/diet/log`
  - Saves meal log for a day and meal slot.
- `GET /api/user/diet/logs?week=1`
  - Returns meal logs for a given week.
- `POST /api/user/progress`
  - Logs weight, workout metrics, and optional notes.
- `GET /api/user/progress/summary`
  - Aggregates progress history and workout completion.
- `POST /api/user/feedback`
  - Stores mood feedback and simple sentiment analysis results.
- `GET /api/user/recommendations`
  - Returns safety guidance based on BMI, blood pressure, and diabetes status.
- `GET /api/user/predictions`
  - Predicts target date based on weight trend.

### Exercise lookup
Located in [Backend/routes/exercises.js](Backend/routes/exercises.js)
- `GET /api/exercises/lookup?name=...`
  - Searches local JSON files in [exercises](exercises).
  - Returns the best match plus image URLs served from `/exercises`.

## Database Schema
Defined in [Backend/schema.sql](Backend/schema.sql) with tables:
- `users`
- `user_profiles`
- `generated_plans`
- `daily_activity`
- `user_progress`
- `user_feedback`
- `user_photos`
- `meal_logs`

Migrations:
- [Backend/migrations/001_add_meal_logs.sql](Backend/migrations/001_add_meal_logs.sql)
- [Backend/migrations/002_add_profile_fields.sql](Backend/migrations/002_add_profile_fields.sql)

## Scripts
From [Backend/package.json](Backend/package.json):
- `npm run start` runs the server with nodemon.

## Notes and Assumptions
- The server listens on `process.env.PORT` or 5000 by default.
- Exercise images are served from the `exercises` folder at `/exercises`.
- All protected endpoints require a valid JWT in the `token` header.
