# Coding Conventions

**Analysis Date:** 2026-04-24

## Naming Patterns

**Files:**
- PascalCase for components and types: `InputText.tsx`, `Toast.tsx`, `AuthContext.tsx`
- camelCase for services and hooks: `cameraService.ts`, `permissionService.ts`, `useCamera.ts`, `useGoogleAuth.ts`
- camelCase for libraries/utils: `auth.ts`, `plants.ts`, `supabase.ts`, `firebase.ts`, `plantService.ts`

**Functions:**
- camelCase: `takePhoto`, `saveToGallery`, `requestPermissions`, `identificarPlanta`
- Verb-noun pattern for actions: `takePhoto`, `savePlant`, `deletePlant`, `uploadPlantImage`

**Variables:**
- camelCase: `cameraRef`, `lastPhoto`, `facing`, `flashMode`, `isPermissionGranted`
- Boolean prefixes: `isLoadingPermissions`, `isGranted`, `isPermissionGranted`

**Types:**
- PascalCase for interfaces and types: `PhotoResult`, `CaptureOptions`, `AppPermissions`, `PermissionStatus`, `PlantInfo`, `SavedPlant`, `UseCameraReturn`, `UseCameraOptions`, `AuthContextType`
- Descriptive suffixes: `Options`, `Return`, `Result`, `Status`, `Props`, `Type`

## Code Style

**Formatting:**
- Tool: Expo built-in ESLint with `eslint-config-expo`
- Config file: `eslint.config.js` (flat config format)
- Extends: `expo/tsconfig.base`
- Strict mode: enabled in `tsconfig.json`

**Linting:**
- Primary tool: ESLint 9.x with `eslint-config-expo` 10.x
- Ignores: `dist/*`
- No custom rules detected (uses Expo defaults)

**TypeScript:**
- Strict mode: enabled
- Path aliases: `@/*` maps to project root
- Included: All `.ts` and `.tsx` files

**Indentation:**
- Based on Expo defaults (2 spaces typical for React Native)

**Quotes:**
- Double quotes for strings in code (observed in `lib/auth.ts`, `hooks/useGoogleAuth.ts`)

## Import Organization

**Order:**
1. External libraries (React, Expo, Firebase, etc.)
2. Internal services (@Service)
3. Internal hooks (@/hooks)
4. Internal lib/utils (@/lib)
5. Types/interfaces

**Path Aliases:**
- `@/*` - Project root (e.g., `@/services/cameraService`, `@/hooks/useCamera`)
- Relative imports for same-level files

**Examples:**
```typescript
// External first
import { CameraType, CameraView, FlashMode } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";

// Then path alias
import CameraService, { CaptureOptions, PhotoResult } from "@/services/cameraService";
import PermissionService, { AppPermissions } from "@/services/permissionService";

// Then internal lib
import { auth, db } from "../lib/firebase";
```

## Error Handling

**Patterns:**
- Throws Error with descriptive Spanish messages: `throw new Error("La cámara no está disponible")`
- Try-catch blocks with error state management:
```typescript
try {
  const result = await PermissionService.requestAllPermissions();
  setPermissions(result);
} catch {
  setError("Error al solicitar permisos");
} finally {
  setIsLoadingPermissions(false);
}
```
- Error identity check: `err instanceof Error ? err.message : "Default message"`
- Console.error for logging: `console.error("BFF error:", err)`

**Error Types:**
- Service errors: Descriptive Spanish messages
- Form validation: react-hook-form handles automatically
- API errors: HTTP status + message

## Logging

**Framework:** Console only

**Patterns:**
- console.error for errors: `console.error("BFF error:", err)`
- console.log for info: `console.log("Subiendo imagen a Supabase...", filename)`
- console.log for success: `console.log("Imagen subida:", data)`

**When to Log:**
- API request/response boundaries
- Error conditions
- External service calls (Supabase uploads)

## Comments

**When to Comment:**
- Sparse comments in code
- Inline comment for context: `// Crear perfil en Firestore si es la primera vez`
- Configuration explanations: `// Your web app's Firebase configuration`

**JSDoc/TSDoc:**
- Not observed in codebase

**TODO/FIXME:**
- Not detected

## Function Design

**Size:** Varies - services are focused, hooks are comprehensive

**Parameters:**
- Options object pattern for optional params:
```typescript
async takePhoto(cameraRef: RefObject<CameraView>, options: CaptureOptions = {})
```
- Typed interfaces for complex parameters

**Return Values:**
- Promise<T> for async operations
- Direct values for synchronous utilities
- null on error conditions (with error state set separately)

## Module Design

**Exports:**
- Default export: `export default CameraService`
- Named exports: `export { InputText }; export default InputText`
- Re-exports: `export { uploadPlantImage };`

**Barrel Files:**
- Not observed (no index.ts barrel files)

**Service Pattern:**
- Singleton object with methods: `const CameraService = { async takePhoto() {...} }`
- Export default at end of file

**Hook Pattern:**
- Named export: `export function useCamera(options) {...}`
- Returns object with all state and functions

**Context Pattern:**
- createContext with default value
- Provider component with named export
- useContext hook as named export: `export const useAuth = () => useContext(AuthContext)`

---

*Convention analysis: 2026-04-24*