# Módulo de Pagos con Stripe

Este módulo maneja los pagos online utilizando Stripe para el sistema de venta de boletos. Incluye un sistema de carrito de compras con la misma lógica de cargos por servicio (18%) que el sistema de venta tradicional.

## Estructura del Módulo

```
lib/stripe/
├── config.ts          # Configuración de Stripe
├── types.ts           # Tipos TypeScript
├── cart.ts            # Lógica del carrito de compras
├── checkout.ts        # Funciones de checkout
└── README.md          # Documentación
```

## Componentes

```
components/stripe/
├── checkout-button.tsx         # Botón para iniciar checkout
├── cart-summary.tsx           # Resumen del carrito
└── stripe-checkout-section.tsx # Sección completa de checkout
```

## API Routes

```
app/api/stripe/
├── create-checkout-session/    # Crear sesión de checkout
└── verify-payment/            # Verificar estado del pago
```

## Características

- ✅ Sistema de carrito de compras
- ✅ Cargo por servicio del 18% (mismo que venta tradicional)
- ✅ Compatibilidad con asientos numerados y boletos generales
- ✅ Integración con Stripe Checkout
- ✅ Verificación de pagos
- ✅ Páginas de éxito y error
- ✅ Interfaz responsiva

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```bash
# Claves de Stripe (obtener desde dashboard de Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 2. Instalación de Dependencias

```bash
npm install @stripe/stripe-js stripe
```

### 3. Configuración de Stripe

1. Crear cuenta en [Stripe](https://stripe.com)
2. Obtener las claves de API desde el dashboard
3. Configurar los webhooks (opcional)

## Uso del Sistema

### Integración en la Página de Compra

```tsx
import { StripeCheckoutSection } from "@/components/stripe/stripe-checkout-section";

function ComprarPage() {
  return (
    <StripeCheckoutSection
      selectedSeats={selectedSeats}
      generalTickets={generalTickets}
      eventInfo={eventInfo}
    />
  );
}
```

### Hook del Carrito

```tsx
import { useCart } from "@/hooks/use-cart";

function MyComponent() {
  const { items, cartSummary, addItem, removeItem, updateQuantity, clearCart } =
    useCart();

  // Usar funciones del carrito
}
```

## Flujo de Pago

1. **Selección de Boletos**: Usuario selecciona asientos/boletos generales
2. **Agregado al Carrito**: Items se agregan automáticamente al carrito
3. **Cálculo de Cargos**: Se aplica el 18% de cargo por servicio
4. **Checkout**: Se crea sesión de Stripe Checkout
5. **Pago**: Usuario completa el pago en Stripe
6. **Verificación**: Se verifica el estado del pago
7. **Confirmación**: Usuario recibe confirmación y boletos

## Cálculo de Precios

```typescript
// Ejemplo de cálculo
const subtotal = 1000; // MXN
const serviceCharge = subtotal * 0.18; // 18% = 180 MXN
const total = subtotal + serviceCharge; // 1180 MXN
```

## Tipos de Boletos

### Asientos Numerados

- Fila y número de asiento específico
- Precio individual
- Un boleto por asiento

### Boletos Generales

- Sin asiento asignado
- Precio individual
- Cantidad variable

## Integración con Sistema Existente

Este módulo se integra perfectamente con el sistema de venta tradicional:

- **Misma lógica de precios**: 18% cargo por servicio
- **Mismos tipos de boletos**: Asientos numerados y generales
- **Compatibilidad**: Funciona junto al sistema existente
- **Datos compartidos**: Utiliza la misma estructura de datos

## Páginas del Sistema

- `/eventos/[id]/comprar` - Página principal de compra con tabs
- `/checkout/success` - Página de éxito después del pago
- `/venta` - Sistema de venta tradicional (existente)

## Seguridad

- ✅ Claves de API seguras (server-side)
- ✅ Validación de datos en servidor
- ✅ Verificación de pagos
- ✅ Manejo de errores
- ✅ Protección contra ataques comunes

## Testing

### Tarjetas de Prueba

```
Visa: 4242 4242 4242 4242
Mastercard: 5555 5555 5555 4444
American Express: 3782 822463 10005
```

### Webhooks (Opcional)

Para mayor robustez, se pueden configurar webhooks de Stripe:

```typescript
// app/api/stripe/webhook/route.ts
export async function POST(request: Request) {
  // Manejar eventos de Stripe
}
```

## Mantenimiento

- Actualizar regularmente las dependencias de Stripe
- Monitorear el dashboard de Stripe para transacciones
- Revisar logs de errores
- Mantener respaldos de configuración
