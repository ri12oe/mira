# Mira

Mira is a mobile app that helps a caregiver set up daily support for someone they look after. It is built with [Expo](https://expo.dev) and React Native, and runs on iOS, Android, and the web.

## Features

- Onboarding flow that asks who is using Mira (caregiver or the person being cared for)
- Three-step caregiver setup (`caregiverSetup1`–`caregiverSetup3`)
- Connection confirmation screen
- Caregiver home screen with a custom tab bar
- Taker selection shared across Home, History, People, and Settings; adding a taker selects them automatically
- Per-taker check-in method, time window, extra alert time, and pause settings (kept for the current app session)

## Tech stack

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) with [Expo Router](https://docs.expo.dev/router/introduction) (file-based routing, typed routes)
- React 19, React Native 0.86, React Compiler enabled
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) and Gesture Handler for animation and gestures
- `react-native-svg` for custom icons
- Figtree and Bricolage Grotesque fonts via `@expo-google-fonts`
- TypeScript

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS)
- An iOS simulator, Android emulator, or the [Expo Go](https://expo.dev/go) app on a device

### Install and run

```bash
npm install
npx expo start
```

From the dev server output you can open the app in a [development build](https://docs.expo.dev/develop/development-builds/introduction/), [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/), [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/), or Expo Go.

### Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm start`       | Start the Expo dev server         |
| `npm run android` | Start and open on Android         |
| `npm run ios`     | Start and open on iOS             |
| `npm run web`     | Start and open in the browser     |
| `npm run lint`    | Lint with ESLint (`expo lint`)    |

Type-check with `npx tsc --noEmit`.

## Project structure

```
src/
  app/          Routes (Expo Router); each file is a screen
  components/   Shared UI components and SVG icons
  constants/    Fonts and other constants
  context/      React context (caregiver setup state)
  hooks/        Custom hooks (theme, color scheme, screen scale)
  utils/        Helpers (time formatting)
assets/         Images and app icons
```

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction)

## License

See [LICENSE](LICENSE).
