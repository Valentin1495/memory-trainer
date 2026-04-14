# Release Checklist

## 1. Production Config

- [`capacitor.config.ts`](/Users/eunho_xiv/Documents/Memory Challenge/capacitor.config.ts) must not contain a hardcoded dev server URL.
- Use `CAP_SERVER_URL=http://YOUR_IP:5173` only for live reload testing.
- Verify `.env` uses the production Supabase project.
- Confirm `appId` is final: `com.memorychallenge.app`.

## 2. App Metadata

- Finalize app name, subtitle, description, keywords.
- Prepare marketing URL if needed.
- Confirm age rating answers for both stores.
- Fill placeholders in [`STORE_METADATA.md`](/Users/eunho_xiv/Documents/Memory Challenge/STORE_METADATA.md) and [`PRIVACY_POLICY.md`](/Users/eunho_xiv/Documents/Memory Challenge/PRIVACY_POLICY.md).

## 3. Assets

- Verify iOS app icon set in [`ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json`](/Users/eunho_xiv/Documents/Memory Challenge/ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json).
- Verify Android launcher icons under [`android/app/src/main/res`](/Users/eunho_xiv/Documents/Memory Challenge/android/app/src/main/res).
- Capture screenshots for phone sizes required by App Store Connect and Google Play.
- Check splash assets on both platforms.

## 4. Versioning

- Android: update [`android/app/build.gradle`](/Users/eunho_xiv/Documents/Memory Challenge/android/app/build.gradle) `versionCode` and `versionName`.
- iOS: update `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in Xcode.
- Keep store version names aligned across both platforms.

## 5. Functional QA

- Test home, memorize, review, result, leaderboard flows on real devices.
- Test network failure fallback when Supabase is unavailable.
- Test score submission and leaderboard retrieval with production Supabase.
- Test app relaunch, nickname persistence, and first-run state.
- Confirm no dev URLs or localhost references remain in release builds.

## 6. Android Release

- Open Android Studio after:
  ```bash
  npm run cap:android
  ```
- Follow [`ANDROID_RELEASE.md`](/Users/eunho_xiv/Documents/Memory Challenge/ANDROID_RELEASE.md) for keystore and signed bundle setup.
- Create or load a release keystore.
- Generate a signed `AAB`.
- Upload to Play Console internal testing first.
- Complete Data safety, content rating, privacy policy, and store listing.

## 7. iOS Release

- Open Xcode after:
  ```bash
  npm run cap:ios
  ```
- Follow [`IOS_RELEASE.md`](/Users/eunho_xiv/Documents/Memory Challenge/IOS_RELEASE.md) for signing, archive, and App Store Connect upload.
- Set Signing team and bundle identifier.
- Archive a Release build.
- Upload through Xcode Organizer to App Store Connect.
- Fill App Privacy, screenshots, review notes, and submit to TestFlight/App Review.

## 8. Before Submit

- Run:
  ```bash
  npm run build
  npm run lint
  ```
- Re-run `npx cap sync` after any web asset/config change.
- Keep release notes for version `1.0.0`.
