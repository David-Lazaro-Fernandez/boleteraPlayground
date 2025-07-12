import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe/config";

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // Log de información importante
    console.log('Modo:', STRIPE_CONFIG.mode);
    console.log('Request data:', {
      items: requestData.items?.length,
      eventInfo: requestData.eventInfo?.title,
      hasCustomerData: !!requestData.customerData,
      total: requestData.total,
    });

    const {
      items,
      subtotal,
      serviceCharge,
      total,
      eventInfo,
      customerData,
      successUrl,
      cancelUrl,
      userId,
      currency = 'mxn',
    } = requestData;

    // Validaciones mejoradas
    if (!items?.length) {
      return NextResponse.json(
        { error: "No hay items en el carrito" },
        { status: 400 }
      );
    }

    if (!eventInfo?.title) {
      return NextResponse.json(
        { error: "Información del evento es requerida" },
        { status: 400 }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "URLs de success y cancel son requeridas" },
        { status: 400 }
      );
    }

    // Crear line items para Stripe
    const lineItems = items.map((item: any) => {
      const lineItem = {
        price_data: {
          currency,
          unit_amount: Math.round(item.price * 100), // Stripe usa centavos
          product_data: {
            name: item.type === 'seat' 
              ? `${eventInfo.title} - ${item.zoneName} - Fila ${item.rowLetter}, Asiento ${item.seatNumber}`
              : `${eventInfo.title} - ${item.zoneName} - Boleto General`,
            description: item.type === 'seat'
              ? `Fila ${item.rowLetter}, Asiento ${item.seatNumber}`
              : 'Boleto General',
            metadata: {
              eventId: eventInfo.id || 'test',
              itemId: item.id,
              type: item.type,
              zone: item.zoneName,
              ...(item.type === 'seat' && {
                row: item.rowLetter,
                seat: item.seatNumber?.toString(),
              }),
            },
          },
        },
        quantity: item.type === 'general' ? (item.quantity || 1) : 1,
      };

      console.log('Line item:', {
        name: lineItem.price_data.product_data.name,
        price: lineItem.price_data.unit_amount,
        quantity: lineItem.quantity,
        originalPrice: item.price,
      });

      return lineItem;
    });

    // Agregar cargo por servicio si existe
    if (serviceCharge > 0) {
      const serviceChargeItem = {
        price_data: {
          currency,
          unit_amount: Math.round(serviceCharge * 100),
          product_data: {
            name: "Cargo por Servicio",
            description: "18% cargo por procesamiento",
          },
        },
        quantity: 1,
      };

      console.log('Service charge:', {
        amount: serviceChargeItem.price_data.unit_amount,
        originalAmount: serviceCharge,
      });

      lineItems.push(serviceChargeItem);
    }

    // Crear sesión de checkout
    const sessionData = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        eventId: eventInfo.id || 'test',
        eventName: eventInfo.title,
        eventDate: eventInfo.date,
        eventTime: eventInfo.time,
        venue: eventInfo.venue,
        ticketCount: items
          .reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
          .toString(),
        subtotal: subtotal?.toString(),
        serviceCharge: serviceCharge?.toString(),
        total: total?.toString(),
        cartItems: JSON.stringify(items),
        isTestMode: STRIPE_CONFIG.mode === 'test' ? 'true' : 'false',
        userId: userId || "",
        ...(customerData && {
          customerEmail: customerData.email,
          customerName: `${customerData.firstName} ${customerData.lastName}`,
          customerPhone: customerData.phone || "",
        }),
      },
      payment_intent_data: {
        metadata: {
          eventId: eventInfo.id || 'test',
          items: JSON.stringify(items),
          isTestMode: STRIPE_CONFIG.mode === 'test' ? 'true' : 'false',
          userId: userId || "",
          ...(customerData && {
            customerEmail: customerData.email,
            customerFirstName: customerData.firstName,
            customerLastName: customerData.lastName,
          }),
        },
      },
      ...(customerData?.email && {
        customer_email: customerData.email,
      }),
    };

    const calculatedTotal = sessionData.line_items.reduce((sum: number, item: any) => 
      sum + (item.price_data.unit_amount * item.quantity), 0);
    
    console.log('Creating Stripe session with data:', {
      mode: sessionData.mode,
      itemCount: sessionData.line_items.length,
      calculatedTotalInCentavos: calculatedTotal,
      calculatedTotalInPesos: calculatedTotal / 100,
      expectedTotalInPesos: total,
      lineItemsDetails: sessionData.line_items.map((item: any) => ({
        name: item.price_data.product_data.name,
        unitAmountCentavos: item.price_data.unit_amount,
        unitAmountPesos: item.price_data.unit_amount / 100,
        quantity: item.quantity,
        totalCentavos: item.price_data.unit_amount * item.quantity,
        totalPesos: (item.price_data.unit_amount * item.quantity) / 100,
      })),
    });

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log('Session created successfully:', {
      sessionId: session.id,
      url: session.url,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error detallado:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: "Error al crear la sesión de checkout",
          details: error.message,
          type: error.constructor.name,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Error desconocido al crear la sesión de checkout" },
      { status: 500 }
    );
  }
}
