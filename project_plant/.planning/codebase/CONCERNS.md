# Codebase Concerns

**Analysis Date:** 2026-04-24

## Tech Debt

**Heavy Inline Animations in Auth Screens:**
- Issue: Authentication screens (`app/(auth)/login.tsx`, `app/(auth)/register.tsx`) contain ~400 lines each of inline animation code that should be extracted to custom hooks or separate animation utilities
- Files: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`
- Impact: Large file sizes make maintenance difficult; same animation patterns duplicated across files
- Fix approach: Create `hooks/useFormAnimations.ts` or similar to extract `FloatingLeaf`, `PulsingLogo`, `AnimatedButton` components

**Mixed Import Patterns:**
- Issue: Path aliases (`@/services/*`) used inconsistently - some files use relative imports, others use `@/` imports
- Files: `hooks/useCamera.ts`, `services/cameraService.ts`
- Impact: Confusion about what import style to use; potential for broken imports when moving files
- Fix approach: Standardize on path aliases for all internal modules; update tsconfig.json to include all source directories

**Console Logging in Production:**
- Issue: Multiple `console.log` and `console.error` statements in library code that expose internal operations to browser console
- Files: `lib/supabase.ts`, `lib/plantService.ts`, `app/(tabs)/camera.tsx`
- Impact: Information leakage in production; cluttered console output
- Fix approach: Replace with proper logging service or remove debug statements

**Inconsistent Error Handling:**
- Issue: Some places use `console.error(e)` with raw error objects; others have custom error message functions
- Files: `app/(tabs)/camera.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`
- Impact: Inconsistent user-facing error messages; potential for exposing internal errors
- Fix approach: Centralize error message formatting in `lib/errors.ts`

**Implicit Any Types:**
- Issue: Some function parameters and variables use implicit or explicit `any` type
- Files: `app/(auth)/login.tsx` (line 330), `app/(auth)/register.tsx` (line 380)
- Impact: TypeScript's strict mode benefits are negated
- Fix approach: Add proper type annotations

**Hardcoded Fallback API URL:**
- Issue: `lib/plantService.ts` uses `http://localhost:3000` as fallback when env var is missing
- Files: `lib/plantService.ts`
- Impact: App will fail silently in production if API_URL is not set
- Fix approach: Throw error if required environment variables are missing

## Known Bugs

**No known bugs detected.** Code appears functional but lacks comprehensive testing.

## Security Considerations

**Environment Variable Validation Missing:**
- Risk: App uses empty string fallbacks for all environment variables (`process.env.EXPO_PUBLIC_* || ""`)
- Files: `lib/supabase.ts`, `lib/firebase.ts`, `lib/plantService.ts`
- Current mitigation: None - empty credentials will cause runtime failures
- Recommendations: Add startup validation that throws if critical env vars are missing

**No Error Boundaries:**
- Risk: React error boundaries not implemented anywhere - any uncaught error will crash the entire app
- Files: All screen components
- Current mitigation: None
- Recommendations: Add error boundary around critical flows (auth, camera)

**Image URL Storage (Potential):**
- Risk: `imageUri` stored as plain string in Firestore document - no validation that URL is valid
- Files: `lib/plants.ts`, `app/(tabs)/garden.tsx`
- Current mitigation: User is expected to only save their own images
- Recommendations: Validate URL format before saving

## Performance Bottlenecks

**No Image Optimization Caching:**
- Problem: Plant images are loaded at full resolution from Supabase every time
- Files: `app/(tabs)/garden.tsx`, `app/(tabs)/camera.tsx`
- Cause: No thumbnail generation or caching layer
- Improvement path: Generate thumbnails on upload; use Image component with caching

**Large FlatList with Inline Animations:**
- Problem: `garden.tsx` renders animation for each list item inline
- Files: `app/(tabs)/garden.tsx` (PlantCard component)
- Cause: Each card triggers its own animation on mount
- Improvement path: Use `FlatList` with `getItemLayout` or virtualization

**Missing Loading Optimizations:**
- No code splitting implemented - all screens loaded at once
- No image lazy loading
- No request deduplication

## Fragile Areas

**Authentication Flow:**
- Files: `context/AuthContext.tsx`, `app/_layout.tsx`
- Why fragile: Routing based on auth state happens with side effects; race conditions possible between auth check and navigation
- Safe modification: Use expo-router's built-in auth guards instead of manual router.replace
- Test coverage: None exists

**Camera Permissions:**
- Files: `hooks/useCamera.ts`, `services/cameraService.ts`
- Why fragile: Complex permission state management with multiple async calls; state can become inconsistent
- Safe modification: Isolate permission logic to single service
- Test coverage: None exists

**Dual Database Pattern:**
- Files: `lib/plants.ts`, `lib/supabase.ts`
- Why fragile: Using both Firebase (user data, plants collection) AND Supabase (image storage); increased complexity for data integrity
- Safe migration: Document the data flow clearly; consider consolidating to single backend

## Scaling Limits

**Firebase/Firestore:**
- Current capacity: ~1M documents (Firestore free tier)
- Limit: No horizontal scaling without configuration; Firestore pricing can escalate
- Scaling path: Implement pagination; consider offline-first with sync

**Images via Supabase:**
- Current capacity: Storage based on plan
- Limit: Bandwidth and storage costs
- Scaling path: Add CDN layer; implement image compression before upload

## Dependencies at Risk

**Zod v4 (4.3.6):**
- Risk: Major version upgrade from Zod 3.x - potential breaking changes in validation behavior
- Impact: Form validation schemas may need updates
- Migration plan: Test thoroughly before upgrading; Zod 4 has different import paths

**Expo SDK 54:**
- Risk: Newer SDK - less community troubleshooting available
- Impact: Native module compatibility issues
- Migration plan: Monitor expo GitHub issues; test thoroughly before production

**React 19.1.0:**
- Risk: Very new version - potential compatibility issues with older packages
- Impact: Hook behavior changes; concurrent features
- Migration plan: Review React 19 migration guide; test all hooks thoroughly

## Missing Critical Features

**No Test Suite:**
- Problem: Zero test files exist in project
- Blocks: Safe refactoring; regression detection; confidence in changes
- Priority: HIGH

**No Offline Support:**
- Problem: App requires network for all operations
- Blocks: Use in areas with poor connectivity; reliable operation
- Priority: MEDIUM

**No Analytics:**
- Problem: No user behavior tracking
- Blocks: Understanding usage patterns; improving UX
- Priority: LOW

**No Automated CI/CD:**
- Problem: No GitHub Actions or similar for lint/test/build checks
- Blocks: Catching issues before deployment; consistent builds
- Priority: MEDIUM

## Test Coverage Gaps

**Untested Areas:**
- All authentication flows (login, register, Google auth)
- Camera and image capture
- Plant save/update/delete operations
- Permission handling
- Form validation with Zod schemas

**What's Not Tested:**
- `lib/auth.ts` - authentication functions
- `lib/plants.ts` - CRUD operations
- `hooks/useCamera.ts` - camera hooks
- Service layer functions in `services/`

**Risk:** Any breaking change in Firebase, Supabase, or plant identification API will not be caught until runtime in production

**Priority:** HIGH

---

*Concerns audit: 2026-04-24*