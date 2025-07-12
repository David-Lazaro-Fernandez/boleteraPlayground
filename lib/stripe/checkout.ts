import { loadStripe } from "@stripe/stripe-js";
import {
  CartSummary,
  EventInfo,
  CheckoutSession,
  CustomerData,
} from "./types";
import { STRIPE_CONFIG } from "./config";

// Inicializar el cliente de Stripe
export const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

/**
 * Formatea un precio en formato de moneda
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

/**
 * Crea una sesión de checkout en Stripe
 */
export async function createCheckoutSession(
  cartSummary: CartSummary,
  eventInfo: EventInfo,
  successUrl: string,
  cancelUrl: string,
  customerData?: CustomerData,
  userId?: string,
): Promise<CheckoutSession> {
  try {
    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cartSummary.items,
        subtotal: cartSummary.subtotal,
        serviceCharge: cartSummary.serviceCharge,
        total: cartSummary.total,
        eventInfo,
        customerData,
        successUrl,
        cancelUrl,
        userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Error al crear la sesión de checkout");
    }

    if (!data.url) {
      throw new Error("No se recibió la URL de checkout");
    }

    return {
      sessionId: data.sessionId,
      url: data.url,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error instanceof Error 
      ? error 
      : new Error("Error al crear la sesión de checkout");
  }
}

/**
 * Verifica el estado de un pago
 */
export async function verifyPayment(sessionId: string): Promise<any> {
  try {
    const response = await fetch(`/api/stripe/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al verificar el pago");
    }

    const data = await response.json();
    return {
      success: data.success,
      sessionId: data.sessionId,
      paymentStatus: data.paymentStatus,
      paymentIntentId: data.paymentIntentId,
      metadata: data.metadata,
      customerDetails: data.customerDetails,
      amountTotal: data.amountTotal,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      error: data.error,
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
