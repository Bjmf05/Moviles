# Architecture

**Analysis Date:** 2026-04-24

## Pattern Overview

**Overall:** React Native with Expo Router (file-based routing)

**Key Characteristics:**
- File-based routing via `app/` directory structure
- React Context for global state (AuthContext)
- Custom hooks for reusable logic (`useCamera`, `useGoogleAuth`)
- Service layer for external integrations
- Component library with controlled inputs

## Layers

**UI Layer (`app/`):**
- Purpose: Screen components and routing
- Location: `app/` directory with `(tabs)/` and `(auth)/` groups
- Contains: Page components, layouts
- Depends on: Hooks, components, services
- Pattern: One file per route with `_layout.tsx` for nested layouts

**State Layer (`context/`):**
- Purpose: Global authentication state
- Location: `context/AuthContext.tsx`
- Implementation: React Context + Firebase auth listener
- Provides: `user`, `loading` state, `useAuth` hook

**Service Layer (`services/`, `lib/`):**
- Purpose: External integrations and business logic
- Location: `lib/firebase.ts`, `lib/supabase.ts`, `lib/auth.ts`, `lib/plantService.ts`, `lib/plants.ts`
- Services: Camera permissions, camera operations
- Libraries: Firebase auth/Firestore/Storage, Supabase storage, plant API, user/plants CRUD

**Hooks Layer (`hooks/`):**
- Purpose: Reusable reactive logic
- Location: `hooks/useCamera.ts`, `hooks/useGoogleAuth.ts`
- Pattern: Custom hooks wrapping service calls with React state

**Components Layer (`components/`):**
- Purpose: Reusable UI primitives
- Location: `components/InputText.tsx`, `components/Toast.tsx`
- InputText: Controlled form input with react-hook-form integration

## Data Flow

**Authentication Flow:**
1. App loads → `AuthContext` initializes
2. Firebase `onAuthStateChanged` listener fires
3. Context updates `user` state
4. `RootLayout` checks `user`/`loading`
5. Router redirects to `/login` or `/(tabs)/`

**Plant Identification Flow:**
1. User opens camera tab
2. `useCamera` requests permissions
3. Photo captured → `ImageManipulator` resizes to base64
4. `identificarPlanta(base64)` POSTs to BFF API
5. Response displayed in modal
6. On save: image uploaded to Supabase, metadata saved to Firestore

**Image Upload Flow:**
1. Camera captures photo
2. Photo URI passed to `uploadPlantImage(uri, userId)`
3. Fetch as ArrayBuffer
4. Upload to Supabase `plant-images` bucket
5. Get public URL and return

## Key Abstractions

**PermissionService:**
- Purpose: Normalize camera and media library permissions
- Location: `services/permissionService.ts`
- Pattern: Async functions returning normalized status

**CameraService:**
- Purpose: Camera operations abstraction
- Location: `services/cameraService.ts`
- Pattern: Object with async methods

**useCamera Hook:**
- Purpose: Camera state management
- Location: `hooks/useCamera.ts`
- Pattern: Encapsulates refs, state, callbacks, service delegation

## Entry Points

**Root Layout:**
- Location: `app/_layout.tsx`
- Triggers: App initialization
- Responsibilities: AuthProvider, SafeAreaProvider, Stack navigator

**Tab Navigator:**
- Location: `app/(tabs)/_layout.tsx`
- Triggers: Post-authentication navigation
- Responsibilities: Bottom tab bar with 5 screens

**Auth Screens:**
- Location: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`
- Triggers: User not authenticated
- Responsibilities: Email/password + Google OAuth

## Error Handling

**Strategy:** Try-catch with localized error messages per Firebase auth code

**Patterns:**
- `try-catch-finally` blocks in async handlers
- Toast notifications for user feedback
- Network error detection via message matching
- Graceful fallback for camera permissions

## Cross-Cutting Concerns

**Logging:** `console.log/console.error` for debugging

**Validation:** Zod schemas with react-hook-form integration

**Authentication:** Firebase with AsyncStorage persistence

---

*Architecture analysis: 2026-04-24*