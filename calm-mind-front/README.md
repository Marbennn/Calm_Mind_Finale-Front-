# Calm Mind Frontend Documentation

This README consolidates the frontend system documentation so developers can understand, run, and extend the app quickly. A copy also lives at `docs/FrontendSystemDocumentation.md`.

## Overview
- Stack: React + Vite, React Router, Zustand, Axios, Recharts, Day.js, Lucide icons, custom CSS.
- Entry: `src/App.jsx` defines routes and auth guards; `src/context/ThemeContext.jsx` provides theme state; `src/store/authStore.js` persists auth; `src/api/client.js` handles HTTP and token injection.
- Pages: Signup, Login, GetStarted, Homepage, TaskManagement, Calendar, ChatBot, Analytics, Settings (+ subroutes).
- Data: Tasks and stress logs in `localStorage`; theme and analytics filters also persisted.

## Architecture
- Routing and guards (`src/App.jsx`):
  - Default flow: `/`  `SignupScreen`, `/login`  `LoginScreen`, `/get-started`, `/home`.
  - Protected pages (`/home`, `/tasks`, `/calendar`, `/chatbot`, `/analytics`, `/settings/*`) render only when a `token` exists in `useAuthStore` or `localStorage`.
  - Unauthed users are redirected to `/login`.
- Theming (`src/context/ThemeContext.jsx`):
  - `ThemeProvider` supplies `{ theme, setTheme }` and persists `cm-theme` to `localStorage`.
  - Toggles `html.cm-dark` and sets `data-theme` on `document.documentElement` for CSS hooks.
- Auth state (`src/store/authStore.js`):
  - Holds `user`, `token`, `loading`, `error` and persists via Zustand `persist` (key `auth-store`). Also writes `token` to `localStorage` for Axios.
- HTTP client (`src/api/client.js`):
  - Axios instance reads `VITE_API_BASE_URL` or defaults to `http://127.0.0.1:5000/api`.
  - Request interceptor injects `Authorization: Bearer <token>` when available.
- Utilities (`src/utils`):
  - `analyticsData.js` for storage reads and aggregations.
  - `dateHelpers.js` for period building and date ops.
  - `stressUtils.js` for tag distribution.

## Key Modules & Functions
- `useAuthStore` (Zustand):
  - `signup(name, email, password)`: `POST /users/register`; on success sets `{ user, token }`, writes `token` to `localStorage`, returns `true`; on error sets `error`, returns `false`.
  - `login(email, password)`: `POST /users/login`; same success/error handling; returns `true|false`.
  - `logout()`: clears `token` and resets store.
- Task Management (`src/pages/TaskManagement.jsx`):
  - Persists tasks to `localStorage` key `tasks` and renders Kanban/List/Table views.
  - `deriveStatus(task)`: `'completed'` wins; past `dueDate` becomes `'missing'`; manual `'missing'` is blocked.
  - `addTask()`: validates, generates `id` (`crypto.randomUUID()` fallback), persists.
  - `startEdit(task)`, `saveEdit()`: load/update task fields.
  - `updateTaskStatus(id, status)`: ignores `'missing'` requests; supports other transitions.
  - `completeTask(id)`, `deleteTask(id)`, `deleteAll()`.
- Homepage (`src/pages/Homepage.jsx`):
  - Reads tasks (`tasks` or fallback `cm-tasks`) and stress logs (`cm_stress_logs_v1` or fallback `cm-stress`).
  - Derives live counts and top-3 tasks by due date; renders stress line chart.
- Analytics (`src/pages/Analytics.jsx` + `src/utils`):
  - Persists filters `an_from`, `an_to`, `an_mode` and uses:
    - `readTasksFromStorage()`, `readStressFromStorage()`.
    - `buildPeriods(start, end, mode)`.
    - `deriveStatus(task)`, `taskDateYMD(task)`.
    - `getTaskCounts()`, `getPriorityDistribution()`.
    - `aggregateStressLogs(logs, periods)`.
    - `buildWorkloadVsStress(tasks, stressSeries, periods)`.
  - Renders KPI tiles and charts: `PriorityChart`, `StatusChart`, `StressOverTime`, `WorkloadVsStress`, `StressorPie`, `PredictiveTrend`.
- Calendar (`src/pages/Calendar.jsx`): static October 2025 grid with sample markers.
- Settings (`src/pages/Settings*.jsx`): tabs synced to `/settings`, `/settings/login`, `/settings/about`.
- ChatBot (`src/pages/ChatBot.jsx`): stress logs, selectable time-series views, recent logs with edit/delete UI.

## System Flows
- Auth & Guards
```
User -> SignupScreen/LoginScreen -> useAuthStore -> api -> {user, token}
useAuthStore -> localStorage.token
Router -> token? allow protected routes : redirect /login
```
- Task Lifecycle
```
TaskForm -> addTask/saveEdit -> localStorage('tasks')
TaskManagement -> deriveStatus (auto 'missing' from dueDate)
Views -> Board/List/Table -> update/complete/delete -> localStorage sync
```
- Analytics Pipeline
```
readTasks/readStress -> buildPeriods -> aggregateStressLogs
getTaskCounts/getPriorityDistribution -> charts
workloadVsStress -> correlation series
```
- Theme Toggle
```
ThemeProvider -> setTheme -> localStorage('cm-theme') -> html.cm-dark
```

## Example Use Cases
- Signup/Login: Success stores a token, protected routes render; errors surface via `authStore.error`.
- Create Task: Add due date; after the date, status derives to `'missing'`. Switch between Kanban/List/Table for different views.
- Explore Analytics: Choose `weekly` and a 30-day range; KPI, pie/bar, stress line, workload vs stress, and tag distribution update live.
- Theme Persist: Toggle theme; persists across refresh and routes.

## Error Handling & Edge Cases
- Auth errors: `authStore` captures server errors; functions return `false` on failure.
- Robust storage: All `JSON.parse` wrapped in `try/catch`, defaulting to `[]`.
- Status integrity: `'missing'` is computed from `dueDate` only; manual setting is blocked.
- Route note: `GetStarted` navigates to `/homepage`, but the route is `/home`. Update to `/home` to match routing.

## API Expectations (Frontend)
- Base URL: `VITE_API_BASE_URL` or `http://127.0.0.1:5000/api`.
- Endpoints:
  - `POST /users/register` body `{ name, email, password }` -> expects `{ user, token }`.
  - `POST /users/login` body `{ email, password }` -> expects `{ user, token }`.
- Headers: `Content-Type: application/json`; `Authorization: Bearer <token>` auto-injected.

## Dependencies & Requirements
- Node.js LTS, npm.
- Libraries: `react`, `react-router-dom`, `axios`, `zustand`, `recharts`, `dayjs`, `lucide-react`.
- Environment: `.env` with `VITE_API_BASE_URL`.
- Run:
  - `cd calm-mind-front`
  - `npm install`
  - `npm run dev`

## Development Notes
- Storage keys:
  - Tasks: `tasks` (fallback `cm-tasks`).
  - Stress logs: `cm_stress_logs_v1` (fallback `cm-stress`).
  - Theme: `cm-theme`.
  - Analytics filters: `an_from`, `an_to`, `an_mode`.
- Extendability: Add API modules to `src/api/`, new stores as needed; use `ThemeContext` for theme-aware components; keep status derivation consistent.
