# CHOCO SHIP native build

## Current native structure
- `www/` — isolated app web bundle
- `capacitor.config.ts` — app id `com.chocoship.app`
- `package.json` — Capacitor core, iOS, Android and Push Notifications
- `www/push-native.js` — native push bridge
- `www/native-push-register.js` — saves device tokens to Supabase

## Generate native projects
Run from `app-build/` on a computer with Node.js:

```bash
npm install
npx cap add ios
npx cap add android
npx cap sync
```

Then:

```bash
npx cap open ios
npx cap open android
```

## iOS
In Xcode, enable **Push Notifications** for the `com.chocoship.app` target and configure the Apple signing/team. APNs credentials are kept in Supabase Secrets, never in GitHub.

## Android
Configure the Android application with the Firebase/FCM project used for push delivery, then sync Capacitor.

## Important
Do not copy Web Push/VAPID/OneSignal service-worker files from the web app into this native build. Native push is intentionally isolated in `app-build`.
