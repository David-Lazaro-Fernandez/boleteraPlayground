import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID es requerido" },
        { status: 400 },
      );
    }

    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "customer", "payment_intent.payment_method"],
    });

    // Verificar el estado del pago
    const success = session.payment_status === "paid";

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    // Obtener información del método de pago
    let paymentMethodInfo = null;
    if (session.payment_intent && typeof session.payment_intent === "object") {
      const paymentMethod = session.payment_intent.payment_method;
      if (paymentMethod && typeof paymentMethod === "object") {
        paymentMethodInfo = {
          type: paymentMethod.type,
          card: paymentMethod.card
            ? {
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                exp_month: paymentMethod.card.exp_month,
                exp_year: paymentMethod.card.exp_year,
              }
            : null,
        };
      }
    }

    return NextResponse.json({
      success,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      paymentIntentId,
      metadata: session.metadata,
      customerDetails: session.customer_details,
      amountTotal: session.amount_total,
      currency: session.currency,
      paymentMethod: paymentMethodInfo,
      error: success ? null : "Pago no completado",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Error al verificar el pago" },
      { status: 500 },
    );
  }
}
