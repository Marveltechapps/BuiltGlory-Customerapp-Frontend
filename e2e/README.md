# Customer App UI testing

## Configuration (OBS-10 / previously blocked)

Point the debug build at the isolated QA API:

```bash
# Android emulator → host loopback mapped as 10.0.2.2
set EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5101/api/v1
```

`src/api/config.ts` reads `EXPO_PUBLIC_API_BASE_URL` / `API_BASE_URL` before falling back to the platform default.

## Current blocker

- AVD `Pixel_9` exists locally.
- No Detox / Maestro / Appium dependency is installed in this repo.
- No emulator was running during the 19-Nov-2026 fix cycle (`adb devices` was empty).

## Recommended unblock

1. Start the isolated QA stack (`qa-evidence/tools/qa-mongo.mjs` + API on `:5101`).
2. Start the emulator: `emulator -avd Pixel_9`.
3. Install a UI runner (Detox is the intended choice) and add a Jest/Detox config under `e2e/`.
4. Cover: registration, login/OTP, home, listing, details, search/filters, favorites, enquiry, visits, deals, payments, sell requests, profile.

Until that harness exists, customer flows are covered at the API contract level (`BG-Service/src/tests/qa`).
