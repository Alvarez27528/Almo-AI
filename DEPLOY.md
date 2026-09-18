# Desplegar ALMO AI

La app es un servidor Express (`server.ts`) que sirve la SPA de Vite y las rutas `/api/*`.
Necesita salida a Internet hacia Google (Gemini, Firebase), Gmail (SMTP) y Stripe.

## Variables de entorno (obligatorias)

| Variable | Descripción |
|---|---|
| `NODE_ENV` | `production` |
| `GEMINI_API_KEY` | Clave de Google AI Studio |
| `SMTP_USER` / `SMTP_PASS` | Cuenta Gmail + **contraseña de aplicación** (16 letras) |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `465` (o `587`) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON completo de la cuenta de servicio, en una sola línea |
| `STRIPE_SECRET_KEY` | `sk_live_…` o `sk_test_…` (para el plan Premium) |
| `APP_URL` | URL pública, p. ej. `https://almo-ai.onrender.com` (redirección de Stripe) |

> Nunca subas estas claves a Git. `.env*` ya está ignorado.

## Opción A — Render (gratis, 5 min)
1. Sube el repo a GitHub (ya lo está).
2. https://dashboard.render.com → **New → Blueprint** → elige el repo. Detecta `render.yaml`.
3. Rellena las variables marcadas como *sync: false*.
4. Deploy. La URL será `https://almo-ai.onrender.com`.
5. En Firebase Console → Authentication → Settings → **Authorized domains**, añade ese dominio.

## Opción B — Google Cloud Run
```bash
gcloud run deploy almo-ai --source . --region europe-west1 --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,SMTP_HOST=smtp.gmail.com,SMTP_PORT=465 \
  --set-secrets GEMINI_API_KEY=gemini:latest,SMTP_USER=smtp-user:latest,SMTP_PASS=smtp-pass:latest,FIREBASE_SERVICE_ACCOUNT=firebase-sa:latest,STRIPE_SECRET_KEY=stripe:latest
```
(Usa `Dockerfile` incluido.)

## Opción C — Cualquier VPS / Docker
```bash
docker build -t almo-ai .
docker run -d -p 3000:3000 --env-file .env -e NODE_ENV=production almo-ai
```

## Comprobación
- `GET /api/health` → `{"status":"ok"}`
- Registro → debe llegar el correo con el código de 6 dígitos.
- Recuperar contraseña → correo + cambio real vía Firebase Admin.
