# Google Play production upload (v1.3.0 / versionCode 16)

Package: `com.storiesofislam.app`  
First Play upload should stay on the **internal testing** track as a **draft**, matching `mobile/eas.json` submit.production.android. Promote to production after Console identity verification and review.

## Listing copy

Use [store-metadata.md](store-metadata.md).

- App name: Stories of Islam
- Short description: Explore reviewed stories of the Prophets, Seerah, Companions, and early Muslim history in English and Arabic, with synchronized listening and a family-friendly Kids Mode.
- Full description: see store-metadata.md
- Category: Education
- Tags / keywords: Islamic stories, Seerah, Prophets, Sahabah, hadith, Arabic, Muslim learning, audio stories
- Content rating: general audience. Do **not** select a child-directed / Designed for Families category.
- Privacy policy URL: `https://afroclovers.com.ng/privacy.html` (or the live production origin + `/privacy.html`)
- Terms: `/terms.html`
- Support: `/support.html`
- Account deletion: `/account-deletion.html` and in-app Library → Delete account

## Data Safety (Play Console)

| Question | Answer |
| --- | --- |
| Collect personal data? | Optional. Only if the user signs in: email / account id, bookmarks, listening progress. |
| Sold? | No |
| Shared with third parties for ads? | No |
| Encryption in transit? | Yes (HTTPS) |
| Users can request deletion? | Yes — Library → Delete account |
| Location, contacts, photos, microphone, camera? | Not used |
| Photos / files | Not collected |
| App activity | On-device library and reading position; synced only after sign-in |
| Background audio | User-initiated Names / story playback only |

Permissions in the bundle: INTERNET, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK, WAKE_LOCK.

## Screenshots

Capture phone (and tablet if possible): Home, Explore, Reader, The Names, Library. Store under `/opt/cursor/artifacts/screenshots/play-*`.

## Credentials this agent does not have

- `EXPO_TOKEN` (EAS project link, cloud builds, `eas submit`)
- Play Console developer account
- Play service-account JSON for API upload
- Production upload keystore (do not use a debug key for Play)

When those exist:

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init   # writes extra.eas.projectId
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest submit --platform android --profile production
```

A locally assembled AAB is at `stories-of-islam-1.3.0-16.aab` (versionName 1.3.0, versionCode 16). It is currently **debug-signed** (`androiddebugkey`). Play Console will reject it until you rebuild with a release upload key via EAS or a keystore you retain. Do not upload the debug-signed bundle as the production app.

## Review notes (for the Console form)

- Educational general-audience app; Kids Mode is a presentation theme, not a child-directed product.
- Accounts are optional. Public catalog reads without sign-in.
- Listening for stories is marked incoming; The Names streams published Muslim Central episodes.
- No ads, no in-app purchases in this release.
