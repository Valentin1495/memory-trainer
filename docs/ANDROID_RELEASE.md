# Android Release Guide

## 1. Create Upload Keystore

Run this once on your machine:

```bash
keytool -genkeypair -v \
  -keystore android/release.keystore \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Keep this file and its passwords safe. Do not commit it.

## 2. Add `keystore.properties`

Create `android/keystore.properties` from [`android/keystore.properties.example`](/Users/eunho_xiv/Documents/Memory Challenge/android/keystore.properties.example):

```properties
storeFile=../release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=upload
keyPassword=YOUR_KEY_PASSWORD
```

`storeFile` is read from the app module, so `../release.keystore` points to `android/release.keystore`.

## 3. Sync Web Assets

```bash
npm run cap:sync
```

For Android only:

```bash
npx cap sync android
```

## 4. Build Release AAB

Open Android Studio:

```bash
npm run cap:android
```

Then:

1. Wait for Gradle sync to finish.
2. Select `Build > Generate Signed Bundle / APK`.
3. Choose `Android App Bundle`.
4. Select `android/release.keystore`.
5. Build the `release` variant.

Output is typically generated under:

- `android/app/release/`
- or Android Studio's generated bundle output path

## 5. Play Console Upload

In Play Console:

1. Create app
2. Complete store listing
3. Complete App content
4. Complete Data safety
5. Complete content rating
6. Create Internal testing release first
7. Upload the generated `.aab`

## 6. Recommended First Release Flow

1. Internal testing
2. Closed testing
3. Production

## 7. Before Every Release

1. Increase `versionCode` in [`android/app/build.gradle`](/Users/eunho_xiv/Documents/Memory Challenge/android/app/build.gradle)
2. Update `versionName` if needed
3. Run `npm run build`
4. Run `npm run lint`
5. Run `npx cap sync android`

## 8. Notes

- Google Play requires unique `versionCode` for every upload.
- Keep the keystore backed up securely. Losing it will complicate future updates.
- This project now reads signing credentials from `android/keystore.properties` if the file exists.
