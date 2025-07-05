# 📚 Documentación de API

## 🔑 Autenticación

Todas las rutas protegidas requieren un token de Firebase en el header:
```
Authorization: Bearer <firebase_token>
```

## 🎫 Endpoints de Eventos

### GET /api/eventos
Obtiene lista de eventos disponibles.

**Query Parameters:**
- `status` (opcional): "active" | "upcoming" | "past"
- `limit` (opcional): número de resultados (default: 10)
- `page` (opcional): página actual (default: 1)

**Respuesta:**
```json
{
  "events": [
    {
      "id": "string",
      "name": "string",
      "date": "ISO-8601",
      "venue": "string",
      "status": "string",
      "availableSeats": number
    }
  ],
  "pagination": {
    "total": number,
    "pages": number,
    "currentPage": number
  }
}
```

### GET /api/eventos/:id
Obtiene detalles de un evento específico.

### POST /api/eventos
Crea un nuevo evento (requiere rol admin).

**Body:**
```json
{
  "name": "string",
  "date": "ISO-8601",
  "venue": "string",
  "seatMap": "string",
  "pricing": {
    "general": number,
    "vip": number
  }
}
```

## 💳 Endpoints de Pagos

### POST /api/stripe/create-checkout-session
Inicia sesión de pago con Stripe.

**Body:**
```json
{
  "eventId": "string",
  "seats": ["A1", "A2"],
  "customerEmail": "string"
}
```

### POST /api/stripe/verify-payment
Verifica estado de pago y genera boletos.

## 🎟️ Endpoints de Boletos

### GET /api/tickets/:id
Obtiene información de un boleto.

### POST /api/tickets/validate
Valida un boleto para entrada al evento.

## 📊 Endpoints de Dashboard

### GET /api/dashboard/stats
Obtiene estadísticas de ventas (requiere rol admin).

### GET /api/dashboard/sales
Obtiene reporte de ventas (requiere rol admin).

## ⚠️ Manejo de Errores

Todos los endpoints siguen el siguiente formato de error:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje descriptivo del error",
    "details": {} // Opcional
  }
}
```

Códigos de error comunes:
- `AUTH_REQUIRED`: 401 - Autenticación requerida
- `FORBIDDEN`: 403 - No tiene permisos suficientes
- `NOT_FOUND`: 404 - Recurso no encontrado
- `VALIDATION_ERROR`: 422 - Datos inválidos
- `INTERNAL_ERROR`: 500 - Error interno del servidor