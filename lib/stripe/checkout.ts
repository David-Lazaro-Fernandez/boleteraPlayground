import { CartSummary, EventInfo, CheckoutSession, PaymentResult, CustomerData } from './types'
import { STRIPE_CONFIG } from './config'

/**
 * Crea una sesión de checkout en Stripe
 */
export async function createCheckoutSession(
  cartSummary: CartSummary,
  eventInfo: EventInfo,
  successUrl: string,
  cancelUrl: string,
  customerData?: CustomerData
): Promise<CheckoutSession> {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        currency: STRIPE_CONFIG.currency
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear la sesión de checkout')
    }

    const data = await response.json()
    return {
      sessionId: data.sessionId,
      url: data.url
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

/**
 * Verifica el estado de un pago
 */
export async function verifyPayment(sessionId: string): Promise<PaymentResult> {
  try {
    const response = await fetch(`/api/stripe/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al verificar el pago')
    }

    const data = await response.json()
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
      error: data.error
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Formatea el precio para mostrar en la UI
 */
export function formatPrice(amount: number, currency: string = STRIPE_CONFIG.currency): string {
  return new Intl.NumberFormat(STRIPE_CONFIG.locale, {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount)
} 