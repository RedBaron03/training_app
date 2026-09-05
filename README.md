# Fitness Tracker (Training App)

A React Native (Expo) app for logging strength and cardio workouts, tracking
weekly training goals, and exporting your workout history.

## What it does

- **Log strength sessions** — build a session from one or more exercises with
  repetitions and weight (kg). Exercises come from a built-in, multilingual
  library of 50+ exercises across 9 categories.
- **Log cardio activities** — record a walk, jog, or run with a duration. On
  Android, the app can pull live heart rate, steps, distance/speed, and calories
  from **Health Connect** while you record.
- **Weekly goals & progress** — set weekly strength and cardio targets and track
  progress on the home screen with goal rings.
- **Workout history** — browse your full history grouped by week, month, or
  year, with a detail view per session.
- **Export your data** — export your workout history as a **CSV** or **PDF**
  file and share it (email, Drive, etc.). Choose a time range: all time, last 7
  days, last 30 days, last 12 months, or a custom date range.
- **Custom exercises** — add your own exercises; names are translated
  automatically into all supported languages via LibreTranslate (with a fallback
  if translation fails).
- **Multilingual** — full UI in English, German, French, Italian, and Spanish.
- **Dark & light theme.**

## Tech

- Expo SDK 54, React Native 0.81, React 19
- Local persistence via AsyncStorage
- Native modules: `react-native-health-connect` (Android Health Connect),
  `expo-print`, `expo-sharing`, `expo-file-system`,
  `@react-native-community/datetimepicker`
- Requires a **development build** (not Expo Go) because of the native modules

## Getting started

Use Node.js 20.18 or newer. Install dependencies:

```bash
npm install
```

### Run on Android (dev client)

```bash
npx expo run:android
```

Or start the bundler and open an already-installed dev build:

```bash
npx expo start --dev-client
```

### Build an installable APK

A release APK (installable on a phone) is built with EAS:

```bash
npx eas-cli build --platform android --profile preview
```

The `preview` profile produces an `.apk` you can install directly on a device.

## Health Connect (Android)

Live cardio metrics require the [Health
Connect](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata)
app and granting the health permissions (heart rate, steps, distance, calories).
Without it, cardio entries are saved with duration only.

## Version

Current version: **1.1.0** — adds CSV/PDF export of workout history.
