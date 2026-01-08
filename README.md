# Hold

Hold is a local-first Expo (React Native + TypeScript) app that guides a 30‑day seb derm + antifungal routine with a minimal, calm flow. The app keeps focus on today, blocks analysis until day 21, and gently nudges you toward the next wash day.

## Stack
- Expo SDK 54
- Expo Router navigation
- SQLite via `expo-sqlite`
- Nativewind styling + design tokens
- Expo Notifications

## Running locally
```bash
pnpm install
pnpm start
```

## App behavior
- Onboarding sets the plan: start date, 3 wash days, reminder times, and optional terbinafine.
- During days 1–21, only reminder times + terbinafine toggle can be adjusted.
- Progress charts unlock on day 21.
- Home shows only today’s tasks and the next wash day.
- History lists the last 30 days with completion + check‑in indicators.
- Diagnostics screen shows the last 200 log entries with export.
- iCloud backup is manual export/import via the iOS share sheet.

## Tests
```bash
pnpm test
```
