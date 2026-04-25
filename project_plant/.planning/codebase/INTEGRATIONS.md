# External Integrations

**Analysis Date:** 2026-04-24

## Authentication & Identity

**Firebase Authentication:**
- Email/password registration and login
- Google OAuth via expo-auth-session
- Auth state persistence with AsyncStorage
- Implementation: `lib/firebase.ts`, `lib/auth.ts`
- Hook: `hooks/useGoogleAuth.ts`
- Context: `context/AuthContext.tsx`

## Data Storage

**Firebase Firestore (Primary Database):**
- Collection: `users` - User profiles
- Collection: `plants` - Saved plant records per user
- Client: Firebase SDK v12.11.0
- Connection: Environment variables (`EXPO_PUBLIC_FIREBASE_*`)

**Supabase Storage (Image Storage):**
- Bucket: `plant-images`
- Purpose: Store plant photos with user-specific paths
- Client: `@supabase/supabase-js`
- Connection: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Implementation: `lib/supabase.ts`

## Plant Identification API

**Backend-for-Frontend (BFF):**
- API URL: `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000`)
- Endpoint: `POST /api/identify`
- Input: Base64 image
- Output: Plant identification data
- Implementation: `lib/plantService.ts`

## Monitoring & Observability

**Error Tracking:**
- Console logging (`console.error`)
- No external error tracking service detected

**Logs:**
- In-app logging via `console.log`
- No dedicated logging service

## CI/CD & Deployment

**Build Platform:**
- EAS (Expo Application Services)
- Project ID: `78bcfb9d-18d9-49e7-91b8-08210cbad099`
- Config: `eas.json`

**Platforms:**
- iOS (development + production)
- Android (development + production)
- Web (static output)

## Environment Configuration

**Required env vars:**
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_API_URL=
```

**Secrets location:**
- `.env` file (committed to git via `.gitignore`)
- `.env.example` for reference

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Google OAuth callback (expo-auth-session)
- Firebase auth state changes

---

*Integration audit: 2026-04-24*