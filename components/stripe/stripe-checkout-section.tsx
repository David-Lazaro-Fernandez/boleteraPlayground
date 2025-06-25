"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { CartSummaryComponent } from "./cart-summary";
import { CheckoutButton } from "./checkout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventInfo } from "@/lib/stripe/types";

interface StripeCheckoutSectionProps {
  selectedSeats: any[];
  generalTickets: any[];
  eventInfo: EventInfo;
  className?: string;
}

export function StripeCheckoutSection({
  selectedSeats,
  generalTickets,
  eventInfo,
  className = "",
}: StripeCheckoutSectionProps) {
  const {
    cartSummary,
    removeItem,
    updateQuantity,
    loadFromExistingData,
    setEvent,
  } = useCart();

  // Cargar datos cuando cambien los asientos seleccionados o boletos generales
  useEffect(() => {
    loadFromExistingData(selectedSeats, generalTickets);
  }, [selectedSeats, generalTickets, loadFromExistingData]);

  // Establecer información del evento
  useEffect(() => {
    setEvent(eventInfo);
  }, [eventInfo, setEvent]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Resumen del carrito */}
      <CartSummaryComponent
        cartSummary={cartSummary}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateQuantity}
      />

      {/* Botón de checkout */}
      {!cartSummary.isEmpty && (
        <Card>
          <CardHeader>
            <CardTitle>Finalizar Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-2xl">💳</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Pago Seguro con Stripe
                    </h4>
                    <p className="text-sm text-blue-700">
                      Procesamos tu pago de forma segura utilizando Stripe.
                      Acepta tarjetas de crédito y débito.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-amber-600 text-xl">ℹ️</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 mb-1">
                      Cargo por Servicio
                    </h4>
                    <p className="text-sm text-amber-700">
                      Se aplicará un cargo por servicio del 18% sobre el
                      subtotal. Este cargo cubre los costos de procesamiento y
                      emisión de boletos.
                    </p>
                  </div>
                </div>
              </div>

              <CheckoutButton
                cartSummary={cartSummary}
                eventInfo={eventInfo}
                className="bg-blue-600 hover:bg-blue-700"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
