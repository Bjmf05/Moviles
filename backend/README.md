# Plant BFF — Backend For Frontend

Servidor proxy en Node.js/Express/TypeScript que actúa como intermediario entre la app móvil y las APIs externas (Plant.id y MyMemory), manteniendo las claves de API fuera del bundle del cliente.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/identify` | Recibe una imagen en base64 y devuelve la información de la planta identificada (ya traducida al español) |
| `GET` | `/api/translate?text=...&langpair=en&#124;es` | Proxy a MyMemory para traducción de texto |
| `GET` | `/health` | Health check (retorna `{ status: "ok" }`) |

### POST /api/identify

**Request body:**
```json
{ "base64": "<imagen JPEG en base64 sin prefijo data:>" }
```

**Response (PlantInfo):**
```json
{
  "nombreComun": "Rosa",
  "nombreCientifico": "Rosa canina",
  "descripcion": "Arbusto espinoso nativo de Europa...",
  "cuidados": {
    "riego": "Cada 7 días",
    "luz": "Pleno sol",
    "temperatura": "15°C – 30°C"
  },
  "toxicidad": {
    "esToxica": false,
    "detalle": "Sin información de toxicidad."
  }
}
```

## Desarrollo local

```bash
cd backend
cp .env.example .env
# Edita .env y agrega tu PLANT_ID_API_KEY

npm install
npm run dev
# Servidor disponible en http://localhost:3000
```

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `PLANT_ID_API_KEY` | ✅ Sí | Clave de API de [Plant.id](https://plant.id) |
| `MYMEMORY_EMAIL` | ❌ Opcional | Email para aumentar cuota de MyMemory (10.000 palabras/día vs 500) |
| `PORT` | ❌ Opcional | Puerto del servidor (default: 3000). Render lo inyecta automáticamente |

## Despliegue en Render

1. Crea un nuevo **Web Service** en [render.com](https://render.com)
2. Conecta el repositorio `Bjmf05/Moviles`
3. Configura:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Runtime:** Node
4. En **Environment Variables**, agrega:
   - `PLANT_ID_API_KEY` → tu clave de Plant.id
   - `MYMEMORY_EMAIL` → tu email (opcional pero recomendado)
5. Haz el deploy. Render te dará una URL como `https://plant-bff.onrender.com`
6. Copia esa URL y úsala en la app móvil como `EXPO_PUBLIC_API_URL`

## Configuración en la app móvil

En `project_plant/.env`:
```env
EXPO_PUBLIC_API_URL=https://plant-bff.onrender.com
```

> ⚠️ **Nota de seguridad:** El plan gratuito de Render apaga el servicio tras 15 minutos de inactividad. El primer request después de un periodo inactivo puede tardar ~30 segundos en responder (cold start). Para producción, considera el plan de pago o usa un cron job para hacer ping al `/health` cada 10 minutos.
