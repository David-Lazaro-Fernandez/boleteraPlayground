import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { 
  createMovement, 
  createTickets, 
  createMovementTickets, 
  updateMovementStatus,
  processPaymentWithBackend,
  getMovementBySessionId 
} from "@/lib/firebase/transactions";
import { createOrGetUserFromCheckout } from "@/lib/utils/auto-user-creation";
import { updateSeatsFromCartItems } from "@/lib/firebase/seat-management";

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No stripe-signature in header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    let movementId: string | null = null;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;
        const paymentStatus = session.payment_status;
        const paymentIntentId = typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : session.payment_intent?.id;

        // Obtener información de la tarjeta
        let cardBrand: "visa" | "mastercard" | "amex" | "other" = "other";
        
        if (paymentIntentId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.payment_method) {
              const paymentMethod = await stripe.paymentMethods.retrieve(
                typeof paymentIntent.payment_method === 'string' 
                  ? paymentIntent.payment_method 
                  : paymentIntent.payment_method.id
              );
              
              if (paymentMethod.card?.brand) {
                switch(paymentMethod.card.brand.toLowerCase()) {
                  case 'visa':
                    cardBrand = 'visa';
                    break;
                  case 'mastercard':
                    cardBrand = 'mastercard';
                    break;
                  case 'amex':
                    cardBrand = 'amex';
                    break;
                  default:
                    cardBrand = 'other';
                }
              }
            }
          } catch (error) {
            console.error('Error getting payment method:', error);
          }
        }

        // Verificar si ya existe un movimiento para este session_id
        console.log("Webhook: Checking for existing movement with session_id:", sessionId);
        const existingMovement = await getMovementBySessionId(sessionId);
        console.log("Webhook: Existing movement found:", !!existingMovement);
        
        if (existingMovement) {
          // El movimiento ya existe, actualizar su estado
          movementId = existingMovement.id;
          
          // Actualizar estado de asientos si hay metadata
          if (session.metadata?.cartItems) {
            const cartItems = JSON.parse(session.metadata.cartItems);
            const seatUpdateResult = await updateSeatsFromCartItems(cartItems, 'occupied');
            if (!seatUpdateResult.success) {
              console.error("Error updating seats for existing movement:", seatUpdateResult.error);
            } else {
              console.log("Seats updated successfully for existing movement");
            }
          }
          
          await updateMovementStatus(movementId, "paid", {
            stripe_session_id: sessionId,
            stripe_payment_intent_id: paymentIntentId,
            card_brand: cardBrand
          });
        } else if (session.metadata) {
          // Crear nuevo movimiento
          const cartItems = JSON.parse(session.metadata.cartItems || "[]");
          
          // Obtener datos del cliente
          const customerEmail = session.metadata.customerEmail || session.customer_details?.email || "";
          const customerName = session.metadata.customerName || session.customer_details?.name || "";
          const customerPhone = session.metadata.customerPhone || session.customer_details?.phone || "";
          
          // Crear o obtener usuario automáticamente
          let userId = session.metadata.userId || "";
          
          if (!userId && customerEmail) {
            try {
              // Extraer nombre y apellido del customerName si está disponible
              const nameParts = customerName.split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              userId = await createOrGetUserFromCheckout({
                email: customerEmail,
                firstName,
                lastName,
                phone: customerPhone,
              });
              
              console.log('Usuario creado/obtenido automáticamente:', userId);
            } catch (error) {
              console.error('Error creating user from checkout:', error);
              // Continuar sin userId si hay error
            }
          }
          
          movementId = await createMovement({
            total: parseFloat(session.metadata.total || "0"),
            subtotal: parseFloat(session.metadata.subtotal || "0"),
            cargo_servicio: parseFloat(session.metadata.serviceCharge || "0"),
            tipo_pago: "tarjeta",
            card_brand: cardBrand,
            buyer_email: customerEmail,
            buyer_name: customerName,
            event_id: session.metadata.eventId || "",
            payment_intent_id: paymentIntentId,
            session_id: sessionId,
            user_id: userId, // Usar el userId creado automáticamente
            metadata: session.metadata
          });

          // Crear tickets
          const ticketIds = await createTickets(cartItems, userId, session.metadata.eventId);
          await createMovementTickets(movementId, ticketIds, cartItems);

          // Actualizar estado de asientos en Firebase Storage
          const seatUpdateResult = await updateSeatsFromCartItems(cartItems, 'occupied');
          if (!seatUpdateResult.success) {
            console.error("Error updating seats:", seatUpdateResult.error);
            // No fallar el webhook, solo registrar el error
          } else {
            console.log("Seats updated successfully for webhook transaction");
          }

          // Actualizar estado
          await updateMovementStatus(movementId, "paid", {
            stripe_session_id: sessionId,
            stripe_payment_intent_id: paymentIntentId
          });
        }

        // Procesar con el backend (generación de PDF y envío de email)
        if (movementId) {
          await processPaymentWithBackend(movementId, "paid");
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const existingMovement = await getMovementBySessionId(session.id);
        
        if (existingMovement) {
          await updateMovementStatus(existingMovement.id, "cancelled", {
            reason: "Session expired"
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (paymentIntent.metadata?.movementId) {
          await updateMovementStatus(paymentIntent.metadata.movementId, "cancelled", {
            error: "Payment failed",
            stripe_error: paymentIntent.last_payment_error?.message
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 