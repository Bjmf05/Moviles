# Mejoras del Proyecto — Priorizadas

## Criticas (Seguridad & Estabilidad)

### 1. Activar `helmet` para cabeceras de seguridad
`helmet` ya esta instalado pero **nunca se importa ni se usa** en `backend_plant/src/index.ts`. Añadir `app.use(helmet())` para habilitar cabeceras HTTP de seguridad (CSP, X-Frame-Options, HSTS, etc.).

### 2. Restringir CORS a origenes especificos
`cors()` se usa sin opciones, permitiendo cualquier origen. Configurar una whitelist de origenes permitidos (la URL de la app Expo y el dominio de produccion).

### 3. Implementar rate limiting
No hay proteccion contra abuso. Endpoints como `/api/identify` (Plant.id) y `/api/auth/login` son vulnerables a fuerza bruta o uso excesivo. Usar `express-rate-limit`.

### 4. Forzar JWT_SECRET fuerte en produccion
El fallback `"plant-app-secret-key-change-in-production"` es inseguro. El backend debe rechazar iniciar en produccion si el secreto es el valor por defecto.

### 5. Manejar errores de Multer
Si Multer rechaza un archivo (tipo/formato invalido), el error no se captura especificamente y llega al handler generico 500. Añadir middleware de error especifico para `MulterError`.

### 6. Sanitizar entrada de usuario en todos los endpoints
No hay sanitizacion de texto en campos como `name`, `email`, `notes` de plantas. Implementar libreria como `express-validator` o al menos escapar/prevenir XSS en datos que se persisten y muestran.

### 7. Validar variables de entorno faltantes al arranque
`backend_plant/src/config/index.ts` valida algunas variables pero omite `JWT_SECRET`, `FIREBASE_CLIENT_EMAIL`, y `FIREBASE_PRIVATE_KEY`. El servidor deberia fallar inmediatamente si faltan.

---

## Altas (Arquitectura & Calidad)

### 8. Añadir tests (unitarios e integracion)
**No hay ningun test** en backend ni frontend. Ni Jest, Vitest, ni React Native Testing Library estan configurados.
- Backend: tests de controladores, servicios, y rutas con Supertest
- Frontend: tests de componentes con React Native Testing Library, tests de hooks

### 9. Completar `.env.example`
`backend_plant/.env.example` solo documenta 4 variables cuando el `config/index.ts` lee ~20. Añadir todas las variables requeridas con descripciones. Lo mismo para `project_plant/.env.example` (faltan `EXPO_PUBLIC_GOOGLE_*`).

### 10. Extraer componentes duplicados del frontend
`FloatingLeaf`, `AnimatedButton`, `PulsingLogo`, modales de confirmacion, y date pickers estan repetidos en 5+ archivos de pantalla. Mover a `components/` compartidos para reducir duplicacion y facilitar mantenimiento.

### 11. Eliminar dependencias no usadas
- `yaml` — instalado pero nunca importado
- `ts-node` / `ts-node-dev` — el proyecto usa `tsx`, no `ts-node`
- `helmet` — debe activarse, no eliminarse

### 12. Consolidar el doble sistema de autenticacion
Existen dos flujos paralelos: JWT del backend (`lib/api.ts` + `AuthContext`) y Firebase directo (`lib/auth.ts`). `garden.tsx` escribe directamente a Firestore saltandose el backend. Unificar a un solo flujo (preferiblemente el JWT del backend).

### 13. Usar logging estructurado
Todo el logging es `console.error` / `console.log`. Implementar `winston` o `pino` con niveles, formato JSON, y posibilidad de enviar a un servicio externo en produccion.

### 14. Añadir request logging (morgan)
No hay registro de requests entrantes. Añadir `morgan` middleware para loguear metodos HTTP, rutas, codigos de estado, y tiempos de respuesta.

### 15. Implementar graceful shutdown
El servidor Express no maneja señales `SIGTERM`/`SIGINT`. Debe cerrar conexiones activas, desconectar Firebase/Supabase, y parar de aceptar nuevas requests antes de terminar el proceso.

### 16. Documentar la API (OpenAPI/Swagger)
No hay documentacion de los endpoints. Usar `swagger-jsdoc` + `swagger-ui-express` para generar documentacion interactiva de `/api/identify`, `/api/plants`, etc.

### 17. Añadir paginacion a endpoints de lista
`GET /api/plants` y `GET /api/calendar` no tienen paginacion. Si un usuario tiene cientos de plantas o eventos de riego, la respuesta sera muy grande y lenta.

### 18. Añadir indices a consultas de Firestore
Las consultas por `userId`, `nextWateringDate`, y rango de fechas necesitan indices compuestos en Firestore para evitar escaneos completos de coleccion.

### 19. Añadir Error Boundaries en React Native
No hay `ErrorBoundary` component. Un error no capturado en un componente hijo puede crashear toda la app. Implementar boundaries en layouts principales.

### 20. Implementar cola offline para escrituras fallidas
`lib/plants.ts` ya tiene fallback de lectura offline, pero no hay cola de escritura. Si el usuario marca una planta como regada sin conexion, la accion se pierde. Guardar en AsyncStorage y reintentar al reconectar.

### 21. Refrescar token JWT automaticamente
El JWT expira en 7 dias sin mecanismo de refresh. El usuario debe re-login manualmente. Implementar refresh tokens o renovacion silenciosa via Firebase.

---

## Medias (Funcionalidad & UX)

### 22. Configurar CI/CD (GitHub Actions)
No hay pipeline de CI. Configurar acciones para: lint, typecheck, build (ambos paquetes) en cada PR/push a main.

### 23. Implementar i18n (preparar para multi-idioma)
Todos los strings de UI estan hardcodeados en español. Extraer a archivos de traduccion y usar `expo-localization` + `i18next` para permitir ingles y otros idiomas en el futuro.

### 24. Usar almacenamiento en disco en vez de memoria para uploads
Multer usa `memoryStorage()` — archivos grandes (hasta 10MB) se almacenan en RAM. Usar `diskStorage` o streaming directo a Supabase para no agotar la memoria del servidor.

### 25. Optimizar imagenes antes de subir
Las imagenes de la camara se suben a resolucion completa. Usar `expo-image-manipulator` (ya instalado) para redimensionar/comprimir antes de enviar al backend. Reduciria uso de ancho de banda y almacenamiento.

### 26. Usar alias de ruta `@/` consistentemente en el frontend
Algunos imports usan `@/services/...`, otros usan rutas relativas largas como `../../lib/...`. Estandarizar al alias `@/`.

### 27. Documentar/implementar reglas de seguridad de Firestore
No se mencionan reglas de seguridad de Firestore en el proyecto. Sin reglas configuradas, los datos podrian ser accesibles publicamente via Firebase client SDK.

### 28. Mover `types/` vacio o poblarlo con tipos compartidos
El directorio `project_plant/types/` existe pero esta vacio. Los tipos viven dispersos en `lib/api.ts`, `context/AuthContext.tsx`, etc. Centralizar tipos compartidos ahi.

### 29. Manejar timezone en el calendario de riego
Las fechas de riego se calculan sin consideracion de zona horaria. `new Date().toISOString()` y comparaciones de fechas pueden dar resultados incorrectos cerca de medianoche o en viajes entre zonas.

### 30. Añadir constantes para codigos HTTP y rutas
Los codigos de estado (`400`, `401`, `500`, etc.) y rutas (`/api/plants`, `/api/auth`, etc.) estan hardcodeados. Definir enums/constantes.

### 31. Añadir compresion de respuestas HTTP
Grandes payloads (listas de plantas, respuestas del calendario) no se comprimen. Añadir `compression` middleware para gzip/brotli.

---

## Bajas (Pulido & Futuro)

### 32. Añadir etiquetas de accesibilidad
Faltan `accessibilityLabel`, `accessibilityRole`, y `accessible` en componentes interactivos (botones, inputs, tabs). Necesario para lectores de pantalla.

### 33. Integrar Firebase Analytics / Crashlytics
No hay analiticas ni reporte de crashes. Configurar `expo-firebase-analytics` y Crashlytics para monitorear uso y errores en produccion.

### 34. Integrar monitoreo de errores (Sentry)
Los errores solo se loguean en consola. Configurar `@sentry/react-native` para capturar crashes y errores no manejados con contexto (usuario, dispositivo, stack trace).

### 35. Añadir tests E2E (Detox o Maestro)
No hay tests end-to-end que validen flujos completos (login → identificar planta → guardar en jardin → ver calendario).

### 36. Implementar backup automatico de Firestore
No hay estrategia de respaldo. Configurar export programado de Firestore o usar `firestore-export`.

### 37. Lazy loading de pantallas
Todas las pantallas se cargan al iniciar. Usar `React.lazy` + `Suspense` para cargar pantallas de tabs secundarios (explore, calendar) solo cuando se navega a ellas.

### 38. Soporte PWA (web)
`react-dom` esta instalado y hay soporte web via `expo start --web`. Añadir manifest y service worker para permitir instalacion como PWA y uso offline en navegador.

### 39. Añadir sistema de feature flags
No hay forma de habilitar/deshabilitar funcionalidades sin deploy. Implementar flags remotos (Firebase Remote Config) o por variable de entorno.

### 40. Estandarizar mensajes de error desde el backend
Los mensajes de error varian en estructura (`{ error: string }`, `{ message: string }`). Definir un formato `ApiError` consistente con `code`, `message`, y opcionalmente `details`.

### 41. Documentar codigo con JSDoc
Funciones publicas (controladores, servicios, hooks) no tienen documentacion. Añadir JSDoc para parametros, retornos, y comportamientos esperados.

### 42. Añadir CONTRIBUTING.md
No hay guia para contribuidores. Documentar convenciones de codigo, flujo de PR, configuracion local, y estructura del proyecto.

---

## Resumen por area

| Area | Cantidad |
|------|----------|
| Seguridad | 7 |
| Arquitectura/Calidad | 14 |
| Funcionalidad/UX | 11 |
| Pulido/Futuro | 11 |
| **Total** | **43** |
