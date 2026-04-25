# Codebase Structure

**Analysis Date:** 2026-04-24

## Directory Layout

```
project_plant/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/           # Tab navigator screens
│   ├── _layout.tsx        # Root layout
│   └── _layout.tsx       # Tab layout
├── components/           # Reusable UI components
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── lib/                   # Business logic & integrations
├── services/              # Service layer abstractions
├── types/                 # TypeScript type definitions
├── assets/                # Images, fonts, icons
├── android/               # Android native project
├── .expo/                 # Expo dev server cache
├── .planning/             # GSD planning docs
├── node_modules/          # Dependencies
└── [config files]        # package.json, app.json, tsconfig.json, etc.
```

## Directory Purposes

**`app/`:**
- Purpose: File-based routing pages
- Contains: `_layout.tsx`, `(auth)/`, `(tabs)/`
- Key files: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`

**`app/(auth)/`:**
- Purpose: Authentication flow screens
- Contains: `login.tsx`, `register.tsx`

**`app/(tabs)/`:**
- Purpose: Main app screens with bottom navigation
- Contains: `index.tsx` (home), `explore.tsx`, `camera.tsx`, `garden.tsx`, `profile.tsx`

**`components/`:**
- Purpose: Reusable UI primitives
- Contains: `InputText.tsx`, `Toast.tsx`, `PlantProfileInput.tsx`
- Pattern: Generic components used across screens

**`context/`:**
- Purpose: Global React state
- Contains: `AuthContext.tsx` (authentication state)

**`hooks/`:**
- Purpose: Custom reactive logic
- Contains: `useCamera.ts`, `useGoogleAuth.ts`

**`lib/`:**
- Purpose: External integrations and business logic
- Contains: `firebase.ts`, `supabase.ts`, `auth.ts`, `plantService.ts`, `plants.ts`

**`services/`:**
- Purpose: Service layer abstractions
- Contains: `cameraService.ts`, `permissionService.ts`

## Key File Locations

**Entry Points:**
- `app/_layout.tsx` - Root layout with auth provider
- `app/(tabs)/_layout.tsx` - Tab navigator

**Configuration:**
- `package.json` - Dependencies and scripts
- `app.json` - Expo configuration
- `tsconfig.json` - TypeScript with `@/*` path alias

**Core Logic:**
- `lib/firebase.ts` - Firebase initialization
- `lib/supabase.ts` - Supabase client and upload function
- `lib/auth.ts` - Auth operations (register, login, logout)
- `lib/plants.ts` - Plant CRUD operations

**Authentication:**
- `context/AuthContext.tsx` - Auth state management
- `hooks/useGoogleAuth.ts` - Google OAuth hook

**Camera:**
- `hooks/useCamera.ts` - Camera state hook
- `services/cameraService.ts` - Camera operations
- `services/permissionService.ts` - Permission handling
- `app/(tabs)/camera.tsx` - Camera screen

**Garden (Plant Collection):**
- `app/(tabs)/garden.tsx` - Plant list with CRUD modals
- `lib/plants.ts` - Firestore plant operations

## Naming Conventions

**Files:**
- PascalCase for components: `InputText.tsx`, `PlantProfileInput.tsx`
- camelCase for hooks: `useCamera.ts`, `useGoogleAuth.ts`
- camelCase for services: `cameraService.ts`, `permissionService.ts`
- camelCase for lib: `plantService.ts`, `auth.ts`
- kebab-case for route directories: `(auth)/`, `(tabs)/`

**Directories:**
- lowercase for feature directories: `lib/`, `hooks/`, `services/`
- kebab-case for route groups: `(tabs)/`, `(auth)/`

## Where to Add New Code

**New Feature Screen:**
- Primary code: `app/(tabs)/[name].tsx`
- Add tab entry in `app/(tabs)/_layout.tsx`

**New API Integration:**
- Implementation: `lib/[name]Service.ts`
- Types: `types/[name].ts`

**New Hook:**
- Location: `hooks/use[name].ts`

**New Component:**
- Location: `components/[Name].tsx`

**New Service Utility:**
- Location: `services/[name]Service.ts`

## Special Directories

**`android/`:**
- Purpose: Native Android project (generated)
- Generated: Yes (via `expo prebuild`)
- Committed: Yes (to enable custom native code)

**`.expo/`:**
- Purpose: Expo dev server cache
- Generated: Yes
- Committed: Yes (for web build assets)

**`.planning/`:**
- Purpose: GSD planning documentation
- Generated: No
- Committed: No (gitignored)

---

*Structure analysis: 2026-04-24*