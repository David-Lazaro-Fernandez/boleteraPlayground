import Stripe from 'stripe';

// Obtener las claves y el modo
const stripeSecretKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY || '';
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripeMode = process.env.NEXT_PUBLIC_STRIPE_MODE || 'test'; // Nuevo: permite forzar el modo

// Validar formato de las claves
const isValidTestKey = (key: string, prefix: string) => key.startsWith(prefix);
const isValidLiveKey = (key: string, prefix: string) => key.startsWith(prefix);

console.log(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);
console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
console.log(process.env.NEXT_PUBLIC_STRIPE_MODE);

// Determinar el modo basado en STRIPE_MODE
const isTestMode = stripeMode === 'test';


// // Validar que las claves coincidan con el modo (test/live)
// if (isTestMode) {
//   if (!isValidTestKey(stripeSecretKey, 'sk_test_')) {
//     throw new Error('STRIPE_SECRET_KEY debe comenzar con sk_test_ en modo test');
//   }
//   if (!isValidTestKey(stripePublishableKey, 'pk_test_')) {
//     throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY debe comenzar con pk_test_ en modo test');
//   }
// } else {
//   if (!isValidLiveKey(stripeSecretKey, 'sk_live_')) {
//     throw new Error('STRIPE_SECRET_KEY debe comenzar con sk_live_ en modo producción');
//   }
//   if (!isValidLiveKey(stripePublishableKey, 'pk_live_')) {
//     throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY debe comenzar con pk_live_ en modo producción');
//   }
// }

export const STRIPE_CONFIG = {
  publishableKey: stripePublishableKey,
  secretKey: stripeSecretKey,
  currency: 'mxn',
  mode: isTestMode ? 'test' : 'live',
} as const;

// Instancia de Stripe para uso en el servidor
export const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2025-02-24.acacia',
});
