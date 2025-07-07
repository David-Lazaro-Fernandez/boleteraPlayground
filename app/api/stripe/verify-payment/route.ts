import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { 
  createMovement, 
  createTickets, 
  createMovementTickets, 
  updateMovementStatus, 
  processPaymentWithBackend,
  getMovementBySessionId
} from "@/lib/firebase/transactions";

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

    // Si el pago es exitoso, procesar la compra
    let movementId = null;
    if (success && session.metadata) {
      try {
        // Verificar si ya existe un movimiento para este session_id
        const existingMovement = await getMovementBySessionId(sessionId);
        
        if (existingMovement) {
          // El movimiento ya existe, usar el ID existente
          movementId = existingMovement.id;
          console.log("Movement already exists for session_id:", sessionId, "movement_id:", movementId);
        } else {
          // No existe, crear un nuevo movimiento
          console.log("Creating new movement for session_id:", sessionId);
          
          // Parsear los items del carrito
          const cartItems = JSON.parse(session.metadata.cartItems || "[]");
          
          // Crear movimiento en Firestore
          movementId = await createMovement({
            total: parseFloat(session.metadata.total || "0"),
            subtotal: parseFloat(session.metadata.subtotal || "0"),
            cargo_servicio: parseFloat(session.metadata.serviceCharge || "0"),
            tipo_pago: paymentMethodInfo?.card?.brand || "card",
            buyer_email: session.metadata.customerEmail || session.customer_details?.email || "",
            buyer_name: session.metadata.customerName || session.customer_details?.name || "",
            event_id: session.metadata.eventId || "",
            payment_intent_id: paymentIntentId,
            session_id: sessionId,
            metadata: session.metadata
          });

          // Crear tickets en Firestore
          const ticketIds = await createTickets(cartItems);

          // Crear relaciones movement_tickets
          await createMovementTickets(movementId, ticketIds, cartItems);

          // Actualizar el estado del movimiento a pagado
          await updateMovementStatus(movementId, "paid", {
            payment_method: paymentMethodInfo,
            stripe_session_id: sessionId,
            stripe_payment_intent_id: paymentIntentId
          });

          // Llamar al backend Express para procesar tickets y enviar emails
          const backendResult = await processPaymentWithBackend(movementId, "paid");
          
          if (backendResult.success) {
            console.log("Backend processing successful:", backendResult.data);
          } else {
            console.warn("Backend processing failed:", backendResult.error);
            console.warn("Error type:", backendResult.errorType);
            
            // Si el backend no responde, continuar con el procesamiento
            // El pago ya fue exitoso en Stripe y los datos se guardaron en Firestore
            if (backendResult.errorType === 'not_found') {
              console.log("Backend endpoint not found - continuing without backend processing");
            } else if (backendResult.errorType === 'network') {
              console.log("Backend network error - continuing without backend processing");
            }
          }
          
          console.log("Payment processing completed:", {
            movementId,
            ticketCount: ticketIds.length,
            backendResult: backendResult.success,
            backendError: backendResult.success ? null : backendResult.error
          });
        }

      } catch (error) {
        console.error("Error processing payment:", error);
        
        // Si hay error en el procesamiento, intentar marcar el movimiento como fallido
        if (movementId) {
          try {
            await updateMovementStatus(movementId, "cancelled", {
              error: error instanceof Error ? error.message : "Processing error"
            });
          } catch (updateError) {
            console.error("Error updating movement status:", updateError);
          }
        }
        
        // No fallar la respuesta - el pago de Stripe es exitoso
        console.log("Payment succeeded in Stripe but processing failed");
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
      movementId,
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
