# Technology Stack

**Analysis Date:** 2026-04-24

## Languages

**Primary:**
- TypeScript 5.9.2 - Core language for all application code

**Platform:**
- JSX/TSX - React Native UI components

## Runtime

**Environment:**
- React Native 0.81.5 (via Expo)
- React 19.1.0
- Node.js (for development/build)

**Package Manager:**
- npm 10.x (package-lock.json present)
- Expo SDK 54.0.33

## Frameworks

**Core:**
- Expo SDK 54 - Cross-platform mobile framework
- expo-router 6.0.23 - File-based routing
- React Native 0.81.5 - Underlying native layer

**Navigation:**
- @react-navigation/native 7.1.8
- @react-navigation/bottom-tabs 7.4.0

**Animation:**
- React Native Animated API (built-in)
- react-native-reanimated 4.1.1
- expo-linear-gradient 15.0.8
- expo-blur 15.0.8

**Forms:**
- react-hook-form 7.72.0
- @hookform/resolvers 5.2.2
- zod 4.3.6 (validation)

## Key Dependencies

**Camera & Media:**
- expo-camera 17.0.10
- expo-image-picker 17.0.10
- expo-image-manipulator 14.0.8
- expo-media-library 18.2.1

**Authentication & Backend:**
- firebase 12.11.0 (Auth, Firestore, Storage)
- @supabase/supabase-js 2.100.0 (Storage)

**UI Components:**
- @expo/vector-icons 15.0.3
- expo-image 3.0.11
- expo-haptics 15.0.8

**Platform:**
- react-native-safe-area-context 5.6.0
- react-native-screens 4.16.0
- react-native-gesture-handler 2.28.0
- expo-status-bar 3.0.9

**Storage:**
- @react-native-async-storage/async-storage 2.2.0

## Configuration

**Environment:**
- `EXPO_PUBLIC_*` prefix convention for env vars
- `.env` file with `EXPO_PUBLIC_SUPABASE_*`, `EXPO_PUBLIC_FIREBASE_*`, `EXPO_PUBLIC_GOOGLE_*`

**Build:**
- `app.json` - Expo configuration
- `tsconfig.json` - TypeScript with strict mode, path alias `@/*`
- `eslint.config.js` - ESLint 9.25 with expo config

**Platform Targets:**
- iOS bundle: `com.plant.app`
- Android package: `com.plant.app`
- Web: static output

## Platform Requirements

**Development:**
- Expo CLI / EAS CLI
- Node.js 18+
- Android Studio / Xcode (for native builds)

**Production:**
- EAS Build/Submit for iOS/Android
- Firebase project
- Supabase project

---

*Stack analysis: 2026-04-24*