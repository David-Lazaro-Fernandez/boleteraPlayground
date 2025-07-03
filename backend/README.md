# Backend Boletera

Backend Express para el manejo de tickets y envío de emails automático.

## Instalación

1. Navega al directorio del backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` con las siguientes variables:

```env
# Backend Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# SMTP Configuration for Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@boletera.com

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## Configuración

### 1. Firebase
- Crea un proyecto en Firebase Console
- Genera una clave de servicio y descarga el archivo JSON
- Extrae las variables de entorno del archivo JSON

### 2. SMTP Email
- Configura un servidor SMTP (Gmail, SendGrid, etc.)
- Para Gmail, usa contraseñas de aplicación
- Configura las variables SMTP en el archivo `.env`

### 3. Frontend
Agrega la variable de entorno en el frontend (Next.js):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

## Comandos

```bash
# Desarrollo
npm run dev

# Compilar
npm run build

# Producción
npm start

# Tests
npm test
```

## Endpoints

### POST /api/tickets/process-payment
Procesa un pago y genera tickets automáticamente.

```json
{
  "movementId": "movement-id-from-firestore",
  "status": "paid" | "cancelled"
}
```

### POST /api/tickets/generate
Genera tickets manualmente.

```json
{
  "movementId": "movement-id-from-firestore"
}
```

### GET /health
Verifica el estado del servidor.

## Flujo de Integración

1. El frontend procesa el pago con Stripe
2. El frontend crea un movimiento en Firestore
3. El frontend llama a `/api/tickets/process-payment`
4. El backend:
   - Envía email de confirmación
   - Genera tickets con códigos QR
   - Crea PDF con los tickets
   - Sube PDF a Firebase Storage
   - Envía PDF por email

## Estructura de Archivos

```
backend/
├── src/
│   ├── config/
│   │   └── firebaseConfig.ts
│   ├── services/
│   │   ├── emailService.ts
│   │   └── ticketService.ts
│   ├── routes/
│   │   └── tickets.ts
│   ├── types/
│   │   └── index.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── README.md
``` 