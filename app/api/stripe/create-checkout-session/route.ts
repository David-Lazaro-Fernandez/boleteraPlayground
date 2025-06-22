import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const {
      items,
      subtotal,
      serviceCharge,
      total,
      eventInfo,
      customerData,
      successUrl,
      cancelUrl,
      currency
    } = await request.json()

    // Crear line items para Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    // Agregar items individuales
    items.forEach((item: any) => {
      if (item.type === 'seat') {
        lineItems.push({
          price_data: {
            currency: currency,
            unit_amount: Math.round(item.price * 100), // Stripe usa centavos
            product_data: {
              name: `${eventInfo.title} - ${item.zoneName}`,
              description: `Fila ${item.rowLetter}, Asiento ${item.seatNumber}`,
              metadata: {
                eventId: eventInfo.id,
                seatId: item.id,
                zone: item.zoneName,
                row: item.rowLetter,
                seat: item.seatNumber.toString()
              }
            },
          },
          quantity: 1,
        })
      } else if (item.type === 'general') {
        lineItems.push({
          price_data: {
            currency: currency,
            unit_amount: Math.round(item.price * 100),
            product_data: {
              name: `${eventInfo.title} - ${item.zoneName}`,
              description: `Boleto General`,
              metadata: {
                eventId: eventInfo.id,
                ticketId: item.id,
                zone: item.zoneName,
                type: 'general'
              }
            },
          },
          quantity: item.quantity || 1,
        })
      }
    })

    // Agregar cargo por servicio como un line item separado
    if (serviceCharge > 0) {
      lineItems.push({
        price_data: {
          currency: currency,
          unit_amount: Math.round(serviceCharge * 100),
          product_data: {
            name: 'Cargo por Servicio',
            description: '18% cargo por procesamiento',
          },
        },
        quantity: 1,
      })
    }

    // Crear sesión de checkout con información del cliente
    const sessionCreateData: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        eventId: eventInfo.id,
        eventName: eventInfo.title,
        eventDate: eventInfo.date,
        eventTime: eventInfo.time,
        venue: eventInfo.venue,
        ticketCount: items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0).toString(),
        subtotal: subtotal.toString(),
        serviceCharge: serviceCharge.toString(),
        total: total.toString(),
        cartItems: JSON.stringify(items),
        ...(customerData && {
          customerEmail: customerData.email,
          customerName: `${customerData.firstName} ${customerData.lastName}`,
          customerPhone: customerData.phone || ''
        })
      },
      payment_intent_data: {
        metadata: {
          eventId: eventInfo.id,
          items: JSON.stringify(items),
          ...(customerData && {
            customerEmail: customerData.email,
            customerFirstName: customerData.firstName,
            customerLastName: customerData.lastName
          })
        }
      }
    }

    // Si tenemos datos del cliente, prerellenar el email
    if (customerData?.email) {
      sessionCreateData.customer_email = customerData.email
    }

    const session = await stripe.checkout.sessions.create(sessionCreateData)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Error al crear la sesión de checkout' },
      { status: 500 }
    )
  }
} 