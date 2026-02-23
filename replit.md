# Activity Dashboard (דשבורד פעילויות)

## Overview
A Hebrew-language activity dashboard and scheduling system. It is a fully static web application (HTML, CSS, JavaScript) with no backend or build step required.

## Project Architecture
- **Type**: Static website (no build, no backend)
- **Language**: HTML/CSS/JavaScript (vanilla)
- **Server**: `server.js` — a minimal Node.js static file server on port 5000
- **Data**: JSON files stored in the `data/` directory (admins, instructors, scheduling)

### Key Files
- `index.html` — Main dashboard page with login
- `app.js` — Login logic and data loading
- `dashboard.js` — Dashboard rendering and business logic
- `style.css` — Shared styles
- `scheduling.html` / `schedulingsystem.html` — Scheduling views
- `generator.html` — Data generator tool
- `server.js` — Static file server for Replit (added for hosting)

## Recent Changes
- 2026-02-23: Initial Replit setup; added `server.js` static file server bound to 0.0.0.0:5000
