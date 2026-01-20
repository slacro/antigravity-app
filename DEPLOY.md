# Guía de Despliegue (Publishing Guide)

Existen dos formas de "publicar" tu aplicación:
1. **Acceso Local (Inmediato)**: Para verla desde tu teléfono en la misma red WiFi.
2. **Publicar en Internet (Despliegue)**: Para que cualquiera pueda acceder desde cualquier lugar.

---

## 🌎 Opción 1: Acceso Local (WiFi)
Esta es la forma más rápida de probar en tu teléfono ahora mismo.

1. Abre una terminal nueva en Visual Studio Code.
2. Ve a la carpeta del cliente:
   ```bash
   cd client
   ```
3. Ejecuta el siguiente comando para exponer tu IP:
   ```bash
   npm run dev -- --host
   ```
4. Verás algo como `Network: http://192.168.1.XX:5173/`.
5. Escribe esa dirección exacta en el navegador de tu teléfono.

> **Nota**: Tanto tu PC como tu teléfono deben estar conectados a la misma red WiFi.

---

## 🚀 Opción 2: Publicar en Internet (Profesional)

Para que la app funcione 24/7 en internet, necesitamos subir el **Frontend** (la parte visual) y el **Backend** (el servidor de datos) por separado.

### Paso 1: Backend (Servidor)
Usaremos **Render.com** (Tiene plan gratuito).

1. Crea un repositorio en **GitHub** y sube todo tu código.
2. Registrate en [Render.com](https://render.com).
3. Crea un **New Web Service**.
4. Conecta tu repositorio de GitHub.
5. Configuración:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables** (Añádelas en la sección "Environment"):
     - `SUPABASE_URL`: (Tus credenciales de Supabase)
     - `SUPABASE_KEY`: (Tus credenciales de Supabase - Service Role Key recomendada para el server)
     - `GEMINI_API_KEY`: (Tu clave de Google AI Studio)
     - `HUGGINGFACE_API_KEY`: (Tu clave de Hugging Face, opcional pero recomendada)
6. Render te dará una URL (ej: `https://mi-app-api.onrender.com`). **Copia esta URL**.

### Paso 2: Frontend (Cliente)
Usaremos **Vercel** (El estándar para React/Vite).

1. Registrate en [Vercel.com](https://vercel.com).
2. Crea un **New Project**.
3. Importa el mismo repositorio de GitHub.
4. Configuración:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite (se detecta automático).
   - **Environment Variables**:
     - `VITE_API_URL`: Pega aquí la URL de tu Backend (ej: `https://mi-app-api.onrender.com`).
     - `VITE_SUPABASE_URL`: (Tus credenciales)
     - `VITE_SUPABASE_ANON_KEY`: (Tus credenciales)
5. Haz clic en **Deploy**.

¡Listo! Vercel te dará un dominio (ej: `mi-app.vercel.app`) que podrás compartir con cualquiera.

---

### 📝 Preparación del Código

Ya he actualizado tu código para que soporte esta configuración.
- Se ha creado un archivo `client/src/config.js` que detecta automáticamente si estás en modo Local o en Producción.
- Si usas Vercel, el sistema usará automáticamente la variable `VITE_API_URL` para conectarse a tu servidor.
