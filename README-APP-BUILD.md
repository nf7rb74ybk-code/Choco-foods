# CHOCO SHIP — App Build

## Stack
- Capacitor 7
- iOS + Android targets
- Existing Supabase backend
- Existing web UI will be copied into `www/` in a later step

## App ID
`com.chocoship.app`

## Roles
- Customer
- Shipper
- Admin

## Safety
This branch is isolated from `main`. Do not modify production push workers from this branch.

## Local setup
```bash
npm install
npx cap add ios
npx cap add android
npm run sync
```

Then open the native project with Xcode or Android Studio.
