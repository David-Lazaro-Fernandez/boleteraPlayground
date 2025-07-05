# Boletera - Sistema de Venta de Boletos 🎫

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

## 📋 Descripción General

Sistema integral de venta de boletos que combina una interfaz moderna de Next.js con un backend robusto en Express.js. Integra procesamiento de pagos con Stripe, autenticación mediante Firebase, y generación de boletos electrónicos.

## 🏗️ Arquitectura del Proyecto

El proyecto está estructurado como un monorepo que contiene:

- **Frontend (Next.js)**: Aplicación web moderna con rutas dinámicas y autenticación
- **Backend (Express.js)**: API REST para procesamiento de boletos y pagos

### Estructura de Carpetas

```
/
├── app/                    # Frontend (Next.js 13+ App Router)
│   ├── (auth)/            # Rutas de autenticación
│   ├── (client)/          # Rutas públicas del cliente
│   ├── (dashboard)/       # Panel de administración
│   ├── api/               # API Routes de Next.js
│   └── types/             # TypeScript types para el frontend
│
├── backend/               # Servidor Express.js
│   ├── src/
│   │   ├── config/       # Configuraciones y variables de entorno
│   │   ├── middleware/   # Middlewares de Express
│   │   ├── routes/       # Definición de rutas API
│   │   ├── services/     # Servicios de negocio
│   │   ├── templates/    # Plantillas de correo/boletos
│   │   └── utils/        # Utilidades y helpers
│   └── scripts/          # Scripts de automatización
│
├── components/           # Componentes React compartidos
│   ├── auth/            # Componentes de autenticación
│   ├── dashboard/       # Componentes del panel admin
│   ├── events/          # Componentes de gestión de eventos
│   ├── landing/         # Componentes de la página principal
│   ├── palenque/        # Componentes específicos del venue
│   ├── stripe/          # Componentes de integración con Stripe
│   └── ui/              # Componentes UI reutilizables
│
├── lib/                 # Utilidades y configuraciones compartidas
│   ├── contexts/        # Contextos de React
│   ├── firebase/        # Configuración e integración con Firebase
│   ├── hooks/           # Custom hooks de React
│   └── stripe/          # Configuración e integración con Stripe
│
└── public/              # Archivos estáticos
    └── secciones-palenque/ # Assets específicos del venue
```

## 🛠️ Tecnologías Principales

### Frontend
- **Next.js 13+** con App Router
- **React** para la interfaz de usuario
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes UI
- **Firebase Auth** para autenticación
- **Stripe** para procesamiento de pagos

### Backend
- **Express.js** para la API REST
- **TypeScript** para type safety
- **Firebase Admin** para autenticación y base de datos
- **nodemailer** para envío de correos
- **Stripe SDK** para procesamiento de pagos

## 📦 Requisitos Previos

- Node.js ≥ 18.x
- npm o pnpm
- Cuenta de Firebase
- Cuenta de Stripe
- Variables de entorno configuradas (ver `.env.example`)

## 🚀 Instalación y Setup

1. Clonar el repositorio:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd boletera
   ```

2. Instalar dependencias:
   ```bash
   # Para el frontend
   npm install
   
   # Para el backend
   cd backend
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   # En la raíz del proyecto
   cp .env.example .env.local
   
   # En el directorio backend
   cp .env.example .env
   ```

4. Iniciar el desarrollo:
   ```bash
   # Frontend (desde la raíz)
   npm run dev
   
   # Backend (desde /backend)
   npm run dev
   ```

## 📝 Variables de Entorno Necesarias

### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Backend (.env)
```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
STRIPE_SECRET_KEY=
```

## 🔧 Scripts Disponibles

### Frontend
- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

### Backend
- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run build` - Compila TypeScript
- `npm run start` - Inicia el servidor de producción

## 📚 Documentación de Carpetas Principales

### Frontend (app/)
- **(auth)/** - Rutas y componentes de autenticación
- **(client)/** - Páginas públicas para usuarios finales
- **(dashboard)/** - Panel de administración para gestión de eventos
- **api/** - Endpoints de API Routes de Next.js

### Backend (backend/src/)
- **routes/** - Definición de endpoints de la API
- **services/** - Lógica de negocio y servicios
- **templates/** - Plantillas para generación de boletos
- **utils/** - Funciones auxiliares y utilidades

### Componentes (components/)
- **auth/** - Componentes relacionados con autenticación
- **dashboard/** - Componentes del panel de administración
- **events/** - Componentes para gestión de eventos
- **palenque/** - Componentes específicos del venue
- **ui/** - Biblioteca de componentes UI reutilizables

## 🔐 Seguridad

- Autenticación manejada por Firebase
- Tokens JWT para sesiones
- Procesamiento seguro de pagos con Stripe
- Variables de entorno para secretos

## 🚀 Despliegue

### Frontend
- Desplegado en Vercel
- Configuración automática con GitHub

### Backend
- Desplegable en cualquier proveedor que soporte Node.js
- Dockerfile disponible para containerización

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 👥 Contribución

1. Fork el proyecto
2. Crea tu Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al Branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request
