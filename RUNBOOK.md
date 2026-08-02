# RUNBOOK — Operations & Deployment Procedures

Step-by-step operational guide for running local development, generating native EAS builds, publishing OTA updates safely, and performing emergency rollbacks.

---

## 1. Local Development Setup

### Prerequisites
- Node.js >= 18.x
- Expo CLI (`npx expo`)
- iOS Simulator (macOS / Xcode) or Android Emulator / Device with Expo Go / Dev Client

### Start Development Server
```bash
# Start Expo Metro bundler
npx expo start

# Start directly on iOS simulator
npx expo start --ios

# Start directly on Android emulator
npx expo start --android
```

---

## 2. Generating Native EAS Builds

EAS builds compile native iOS binaries (`.ipa`) and Android App Bundles (`.aab`) or APKs.

### Production Builds
```bash
# Build iOS binary for App Store / TestFlight
npx eas-cli build --profile production --platform ios

# Build Android App Bundle (.aab) for Google Play
npx eas-cli build --profile production --platform android

# Build both platforms simultaneously
npx eas-cli build --profile production --platform all
```

---

## 3. Publishing OTA Updates (Crucial Release Protocol)

> [!CAUTION]
> **CRITICAL MANDATE:** You MUST include `--environment production` when publishing production OTA updates.
> Without this flag, Metro will fall back to local `.env` variables, stripping production keys (such as `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`).

### Pre-release Checklist
1. Ensure all changes are committed to git on the `dev` or `main` branch.
2. Confirm app version in `app.config.js` matches target runtime (`1.0.2`).
3. Ensure no local `.env` overrides exist that could corrupt local bundle exports.

### OTA Publish Command
```bash
npx eas-cli update \
  --branch production \
  --environment production \
  --platform all \
  --message "Description of fix or feature"
```

### Post-Publish Verification (Mandatory)
Run this command against the generated bundle export in `dist/`:
```bash
grep -ac "pk_live_" dist/_expo/static/js/ios/*.hbc
```
- **Expected Output:** `1` (Confirms production Stripe key is embedded).
- **If Output is `0`:** **ABORT & RE-EXPORT** — the bundle was exported without the production environment!

---

## 4. Emergency OTA Rollback Procedure

If an OTA update causes critical issues on live customer devices, roll back immediately to the native embedded bundle shipped with the binary:

```bash
npx eas-cli update:roll-back-to-embedded \
  --branch production \
  --runtime-version 1.0.2 \
  --platform all
```

---

## 5. Store Submissions (EAS Submit)

### Submit to Apple App Store / TestFlight
```bash
npx eas-cli submit --profile production --platform ios
```

### Submit to Google Play Store
```bash
npx eas-cli submit --profile production --platform android
```
