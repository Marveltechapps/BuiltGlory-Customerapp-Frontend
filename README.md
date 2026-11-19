# BuiltGlory Customer App

React Native (CLI) + TypeScript app for BuiltGlory customers. It uses the BuiltGlory API for property search, buying, selling, profile, and settings.

```sh
npm install
npm start
```

Requires Node >= 20. Android also needs the Android SDK and JDK. iOS needs Xcode and CocoaPods.

Android: `npm run android`.

iOS: `bundle install`, then `cd ios && bundle exec pod install`, return to the project directory, and run `npm run ios`.

The API base URL is set in `src/api/config.ts`. Debug builds use the local service (`http://10.0.2.2:5001/api/v1` on Android, `http://localhost:5001/api/v1` on iOS). Release builds use `https://api.builtglory.com/api/v1`. Set `API_BASE_URL` or `EXPO_PUBLIC_API_BASE_URL` to your computer’s LAN IP when testing on a physical device.

Display name: **BuiltGlory**. Android application ID: `com.mineralbridge`. Configure signing before device deployment.

Screens live in `src/screens/` (`auth`, `buy`, `home`, `profile`, `sell`, `settings`). Navigation, components, context, theme, API, services, types, and interfaces follow the same folder layout. Components use `.tsx`; helpers use `.ts`. Native projects are in `android/` and `ios/`.

Run `npm run typecheck` to check TypeScript. Install dependencies in this repository before running the app.
