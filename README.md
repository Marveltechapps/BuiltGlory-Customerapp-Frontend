# mineral-bridge-mobile-app

React Native CLI + TypeScript starter following the structure of `Selorg-CustomerApp-V2.0` in the Selorg Application reference. Includes a small sample feature demonstrating file and folder conventions.

```sh
npm install
npm start
```

Requires Node >=20, Android SDK/JDK for Android, or Xcode and CocoaPods for iOS.

Android: `npm run android`.

iOS: `bundle install`, then `cd ios && bundle exec pod install`, return to the project directory and run `npm run ios`.

API configuration lives in `src/api/config.ts`; use your computer’s LAN IP for a physical device. No environment loader is configured for mobile. Android application ID: `com.mineralbridge`; iOS bundle identifier: `com.mineralbridge`; configure signing before device deployment.

Screens go in `src/screens/<feature>/`; navigation, components, context, theme, API, services, types, and interfaces use the reference folder conventions. Components use `.tsx`; helpers use `.ts`. Native projects are in `android/` and `ios/`.

Run `npm run typecheck` to check TypeScript. Dependencies must be installed in this repository first.

## Sample files

The sample feature reads `GET /api/samples` from the service. Start the service before using the sample screens. Tap **View sample items**; API host settings are in `src/api/config.ts`. The route switch is a minimal example; add React Navigation for full app navigation.
