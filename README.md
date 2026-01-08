# Hold

Hold is a 30-day, no‑tinkering routine tracker for seb derm care and hand/foot antifungal treatment. It focuses on Today only, locks analysis until day 21, and keeps the plan deliberately small.

## Run

```bash
pnpm install
pnpm start
```

Other commands:

```bash
pnpm run android
pnpm run ios
pnpm run web
pnpm test
```

Notes:
- Notifications require a device or development build (Expo Go has limitations).
- Data is stored locally in SQLite.

## App behavior

- Onboarding locks wash days for the first 21 days.
- Home shows only today’s tasks and the next wash day.
- Progress stays locked until day 21.
- Logs screen keeps the last 200 entries and supports export.
- Optional cloud export saves a JSON snapshot to Files (iCloud Drive).

## Architecture

```
src/
  design/        # tokens + fonts
  features/      # domain, storage, ui by feature
  providers/     # app state + initialization
  shared/        # reusable UI
  storage/       # SQLite setup
```

## Testing

Unit tests cover task scheduling and plan locking:

```bash
pnpm test
```
