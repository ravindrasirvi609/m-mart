# Mmart Mobile + Web (Next.js + Capacitor)

Mmart is now configured to run as:
- Progressive Web App (PWA)
- Android app via Capacitor (APK/AAB ready flow)
- iOS app via Capacitor (App Store build flow)

## Stack

- Next.js 16 (App Router)
- Tailwind CSS
- Supabase (Auth + DB + Storage)
- Resend (Email)
- Capacitor 8 (Android + iOS)
- PWA with custom service worker

## Implemented Mobile Conversion

### PWA
- `app/manifest.ts` with standalone + portrait config
- `public/sw.js` custom service worker
- Offline fallback route: `/offline`
- Install prompt support (`beforeinstallprompt`)
- Multi-size app icons in `public/icons/`
- Apple touch icon (`public/apple-touch-icon.png`)

### Capacitor
- `capacitor.config.ts`
- App ID: `com.mmart.store`
- App name: `Mmart`
- Web dir: `.next`
- Native red splash/status bar theme
- Deep-link helpers and universal link placeholders

### Native-ready runtime hooks
- Connectivity checks with Capacitor Network plugin fallback
- No-internet full-screen state
- Native splash hide + status bar styling
- Pull-to-refresh for standalone/native shell
- Push notification listener bootstrap (future-ready)
- Native toast + haptic utility wrappers
- UPI deep-link launcher + QR fallback

### Auth and session for mobile
- Supabase browser client now uses a Capacitor Preferences-backed storage adapter when available
- Deep-link URL handling for app-open auth callbacks
- Universal link files added under `public/.well-known/`

### Store compliance pages
- Privacy Policy: `/privacy-policy`
- Terms & Conditions: `/terms-and-conditions`

## Project Setup

1. Install dependencies

```bash
npm install
```

2. Environment variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_UPI_ID=your-upi-id@bank
NEXT_PUBLIC_DEEP_LINK_SCHEME=mmart
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

3. Start web app

```bash
npm run dev
```

## Capacitor Commands

```bash
npm run build
npx cap sync
npx cap open android
npx cap open ios
```

Convenience scripts:

```bash
npm run cap:sync
npm run cap:android
npm run cap:ios
npm run mobile:android:build
npm run mobile:ios:build
```

## First-time Native Initialization

After installing dependencies, run once:

```bash
npx cap add android
npx cap add ios
```

Then every time after web changes:

```bash
npm run build
npx cap sync
```

## Android Release (Play Store)

1. Open Android Studio:

```bash
npx cap open android
```

2. Set minimum SDK to Android 8+ (API 26+).
3. Configure signing key (Build > Generate Signed Bundle/APK).
4. Generate:
- Signed `APK` (internal testing)
- Signed `AAB` (Play Store submission)
5. Ensure app icon/launch icon, versionCode/versionName are updated.
6. Confirm required permissions in `AndroidManifest.xml`:
- `INTERNET`
- Media/files access only if screenshot upload flow requires runtime picker grants on your target SDK.

## iOS Release (App Store)

1. Open Xcode:

```bash
npx cap open ios
```

2. Set bundle ID: `com.mmart.store`.
3. Set deployment target to iOS 14+.
4. Configure signing/team/profile.
5. Verify ATS allows only HTTPS endpoints.
6. Archive and upload via Xcode Organizer.

## Deep Link / Universal Link Setup

Update placeholders before production:

- `public/.well-known/apple-app-site-association`
  - Replace `TEAM_ID.com.mmart.store` with your Apple Team ID + Bundle ID.
- `public/.well-known/assetlinks.json`
  - Replace `REPLACE_WITH_PLAY_SIGNING_CERT_SHA256` with Play signing cert fingerprint.

## Security Notes

- HTTPS-only remote image configuration
- CSP + security headers in `next.config.ts`
- Avoid committing real secrets; use `.env.local`
- Disable WebView debugging in production Capacitor config

## Store Submission Checklist

- [ ] Signed Android AAB generated
- [ ] Signed iOS archive generated
- [ ] Privacy policy URL configured in Play Console/App Store Connect
- [ ] Terms & Conditions accessible in-app
- [ ] App icons and splash assets verified on device
- [ ] Deep links validated on real Android + iOS devices
- [ ] Push permission flow tested (if enabled)
- [ ] Offline behavior tested (airplane mode)
- [ ] UPI screenshot upload and deep-link flow tested

## Important

Capacitor native folders (`android/`, `ios/`) are generated locally by `npx cap add ...` after dependencies are installed. This repository now contains all required web/runtime/config scaffolding; run the native add/sync/build steps on a machine with Android Studio and Xcode for final store binaries.
