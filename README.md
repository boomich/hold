# Hold

Hold is a local-first Expo (React Native + TypeScript) app that guides a 30‑day seb derm + antifungal routine with a minimal, calm flow. The app keeps focus on today, blocks analysis until day 21, and gently nudges you toward the next wash day.

## Stack
- Expo SDK 54
- Expo Router navigation
- SQLite via `expo-sqlite` (localStorage fallback on web)
- Nativewind styling + design tokens
- Expo Notifications (native only)

## Running locally (Native)
```bash
pnpm install
pnpm start
```

## Running locally (Web)
```bash
pnpm install
pnpm dev:web
```
This starts the Expo development server for web at `http://localhost:8081`.

## Building for production (Web)
```bash
pnpm build:web
```
This produces a static export in the `dist/` directory containing:
- `dist/index.html`
- `dist/assets/*`

## Deploying to Vercel

### Option 1: Using vercel.json (recommended)
The repo includes a `vercel.json` that configures Vercel for static deployment:
1. Import the repo in Vercel
2. Vercel will auto-detect the `vercel.json` configuration
3. Deploy

### Option 2: Manual configuration
1. Import the repo in Vercel
2. Set **Framework Preset** to `Other`
3. Set **Build Command** to `pnpm build:web`
4. Set **Output Directory** to `dist`
5. Deploy

## App behavior
- Onboarding sets the plan: start date, 3 wash days, reminder times, and optional terbinafine.
- During days 1–21, only reminder times + terbinafine toggle can be adjusted.
- Progress charts unlock on day 21.
- Home shows only today's tasks and the next wash day.
- History lists the last 30 days with completion + check‑in indicators.
- Diagnostics screen shows the last 200 log entries with export.
- Backup is manual export/import (native: share sheet, web: file download/upload).

## Web notes
- Notifications are disabled on web (native-only feature).
- Data is stored in localStorage on web (SQLite on native).
- Date/time pickers use native HTML inputs on web.

## Tests
```bash
pnpm test
```
