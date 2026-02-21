# Frontend Documentation

## Overview
The frontend is a React + Vite single-page application that generates a personalized 10-week fitness and diet plan, authenticates users, and lets them track workouts, meals, and progress. It uses a shared user context to calculate plans locally and to call backend APIs for persistence and analytics.

## Tech Stack
- React 18
- Vite
- React Router v6
- Chart.js via react-chartjs-2
- Zod for form validation
- Lucide icons

## Entry Points
- App bootstrap: [Frontend/src/main.jsx](Frontend/src/main.jsx)
- Route layout and providers: [Frontend/src/App.jsx](Frontend/src/App.jsx)

## Project Structure
- Pages: [Frontend/src/pages](Frontend/src/pages)
- UI components: [Frontend/src/components](Frontend/src/components)
- User context and API client: [Frontend/src/context](Frontend/src/context)
- Static datasets: [Frontend/src/data](Frontend/src/data)
- Global styles: [Frontend/src/index.css](Frontend/src/index.css)

## File-by-File Explanation
- App bootstrap and router setup: [Frontend/src/main.jsx](Frontend/src/main.jsx)
  - Mounts the React app and wraps it with `BrowserRouter` for client-side routing.
- Application shell and routes: [Frontend/src/App.jsx](Frontend/src/App.jsx)
  - Defines public and protected routes, adds layout shell, navbar/footer, and the wellbeing widget.
- Global styles and theme tokens: [Frontend/src/index.css](Frontend/src/index.css)
  - Defines design tokens, light/dark themes, layout utilities, and all shared component styles.

### Context and Hooks
- Shared state and API actions: [Frontend/src/context/UserContext.jsx](Frontend/src/context/UserContext.jsx)
  - Generates workout/diet plans, computes BMI/BMR, manages auth state, and calls backend APIs.
- Context container: [Frontend/src/context/userContextBase.js](Frontend/src/context/userContextBase.js)
  - Exports the React context object used across the app.
- Typed access helper: [Frontend/src/context/useUser.js](Frontend/src/context/useUser.js)
  - Ensures `UserProvider` is present and exposes the context values.

### Pages
- Landing: [Frontend/src/pages/Landing.jsx](Frontend/src/pages/Landing.jsx)
  - Intro screen with a CTA, used before login.
- Register: [Frontend/src/pages/Register.jsx](Frontend/src/pages/Register.jsx)
  - Multi-step form, Zod validation, gathers profile data, triggers plan generation and registration.
- Login: [Frontend/src/pages/Login.jsx](Frontend/src/pages/Login.jsx)
  - Collects credentials and calls the login flow.
- Dashboard: [Frontend/src/pages/Dashboard.jsx](Frontend/src/pages/Dashboard.jsx)
  - Shows quick stats, BMI status, today workout/diet, and goal progress.
- Plan overview: [Frontend/src/pages/PlanOverview.jsx](Frontend/src/pages/PlanOverview.jsx)
  - Summarizes 10-week plan, phases, and navigation to weekly details.
- Workout day: [Frontend/src/pages/WorkoutDay.jsx](Frontend/src/pages/WorkoutDay.jsx)
  - Renders daily workout plan, exercise details, and logs workout metrics.
- Diet week: [Frontend/src/pages/DietWeek.jsx](Frontend/src/pages/DietWeek.jsx)
  - Displays daily meals, tracks eaten status, syncs logs with backend.
- Progress: [Frontend/src/pages/Progress.jsx](Frontend/src/pages/Progress.jsx)
  - Charts for weight, BMI, calories, workouts, and mood feedback.
- Profile: [Frontend/src/pages/Profile.jsx](Frontend/src/pages/Profile.jsx)
  - Edits profile data, uploads photos, and updates BMI-related metrics.

### Components
- Navbar and theme toggle: [Frontend/src/components/SiteNavbar.jsx](Frontend/src/components/SiteNavbar.jsx)
  - Navigation, auth actions, and theme switching.
- Footer: [Frontend/src/components/SiteFooter.jsx](Frontend/src/components/SiteFooter.jsx)
  - Secondary navigation and copyright.
- Wellbeing widget: [Frontend/src/components/MentalHealthWidget.jsx](Frontend/src/components/MentalHealthWidget.jsx)
  - Lightweight support chat with preset replies and optional speech input.

### Data Assets
- Workout templates and schedules: [Frontend/src/data/workouts.json](Frontend/src/data/workouts.json)
  - Drives workout structure, progression, and substitutions.
- Diet templates: [Frontend/src/data/diets.json](Frontend/src/data/diets.json)
  - Base meals by cuisine and nutrition info.
- Rules and goals: [Frontend/src/data/rules.json](Frontend/src/data/rules.json)
  - Calorie multipliers, weekly progression, and program rules.
- Media: [Frontend/src/data](Frontend/src/data)
  - Video assets used in landing and dashboard.

### Tooling
- Build config: [Frontend/vite.config.js](Frontend/vite.config.js)
  - Vite settings for React build and dev server.
- Dependencies and scripts: [Frontend/package.json](Frontend/package.json)
  - Defines frontend dependencies and `dev/build/preview` scripts.

## Context and Data Flow
- `UserProvider` in [Frontend/src/context/UserContext.jsx](Frontend/src/context/UserContext.jsx) holds user, fitness plan, progress summaries, recommendations, and predictions.
- Local plan generation uses datasets in [Frontend/src/data/rules.json](Frontend/src/data/rules.json), [Frontend/src/data/workouts.json](Frontend/src/data/workouts.json), and [Frontend/src/data/diets.json](Frontend/src/data/diets.json).
- Authentication token is stored in `localStorage` and sent to the backend via the `token` header.

## Core Pages
- Landing page: [Frontend/src/pages/Landing.jsx](Frontend/src/pages/Landing.jsx)
  - Marketing entry point with a video hero and CTA.
- Registration: [Frontend/src/pages/Register.jsx](Frontend/src/pages/Register.jsx)
  - Multi-step form with Zod validation and conditional pregnancy status.
  - Generates a fitness plan client-side and submits it with the user profile.
- Login: [Frontend/src/pages/Login.jsx](Frontend/src/pages/Login.jsx)
  - Authenticates and loads the dashboard data.
- Dashboard: [Frontend/src/pages/Dashboard.jsx](Frontend/src/pages/Dashboard.jsx)
  - Summary widgets, BMI status, today workout and diet highlights.
- Plan overview: [Frontend/src/pages/PlanOverview.jsx](Frontend/src/pages/PlanOverview.jsx)
  - 10-week timeline and phase breakdown.
- Workout day: [Frontend/src/pages/WorkoutDay.jsx](Frontend/src/pages/WorkoutDay.jsx)
  - Renders warmup, main, cooldown blocks.
  - Calls `GET /api/exercises/lookup` to enrich exercise details.
  - Logs workout completion and performance to the backend.
- Diet week: [Frontend/src/pages/DietWeek.jsx](Frontend/src/pages/DietWeek.jsx)
  - Daily meal cards with eaten tracking.
  - Syncs meal logs to the backend and keeps local cache.
- Progress: [Frontend/src/pages/Progress.jsx](Frontend/src/pages/Progress.jsx)
  - Charts for weight, BMI, calories, and performance.
  - Sends mood feedback to the backend for sentiment analysis.
- Profile: [Frontend/src/pages/Profile.jsx](Frontend/src/pages/Profile.jsx)
  - Updates personal and health details.
  - Uploads progress photos (base64) and updates BMI metrics.

## Shared Components
- Navbar with theme toggle: [Frontend/src/components/SiteNavbar.jsx](Frontend/src/components/SiteNavbar.jsx)
- Footer: [Frontend/src/components/SiteFooter.jsx](Frontend/src/components/SiteFooter.jsx)
- Wellness chat widget: [Frontend/src/components/MentalHealthWidget.jsx](Frontend/src/components/MentalHealthWidget.jsx)
  - Local response logic, optional microphone input, and basic safety copy.

## Frontend to Backend API Usage
All API calls are made from `UserContext` and page components using `fetch`.

- Authentication
  - `POST /api/auth/register` from `registerUser` to store account + generated plan.
  - `POST /api/auth/login` from `loginUser` to receive JWT.
- User data
  - `GET /api/user/dashboard` to hydrate profile and plan state.
  - `PUT /api/user/profile` to update profile fields and photos.
- Tracking
  - `POST /api/user/log-activity` workout completion and metrics.
  - `POST /api/user/diet/log` and `GET /api/user/diet/logs` for meal tracking.
  - `POST /api/user/progress` weight and performance metrics.
- Analytics
  - `GET /api/user/progress/summary` summary for progress charts.
  - `GET /api/user/recommendations` health recommendations.
  - `GET /api/user/predictions` weight trend predictions.
  - `POST /api/user/feedback` mood logging and sentiment.
- Exercise lookup
  - `GET /api/exercises/lookup?name=...` for exercise details and images.

## Scripts
From [Frontend/package.json](Frontend/package.json):
- `npm run dev` to start the Vite dev server.
- `npm run build` to create a production build.
- `npm run preview` to preview the build locally.

## Notes and Assumptions
- The backend is assumed to run on `http://localhost:5000`.
- The `token` header is required for protected routes.
- Static exercise images are served from the backend `/exercises` path.
