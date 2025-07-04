"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  CreditCardIcon,
  UserIcon,
  TicketIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { verifyPayment } from "@/lib/stripe/checkout";
import { getEvent, Event } from "@/lib/firebase/events";
import { getVenue, Venue } from "@/lib/firebase/venues";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { CartItem } from "@/lib/stripe/types";
import { useMobileDetection } from "@/hooks/use-mobile-detection";

interface PaymentData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  eventId: string;
  eventName: string;
  totalAmount: number;
  subtotal: number;
  serviceCharge: number;
  ticketCount: number;
  purchaseDate: string;
  cartItems: CartItem[];
  paymentMethod?: {
    type: string;
    card?: {
      brand: string;
      last4: string;
    };
  };
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { isMobile } = useMobileDetection();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);

  useEffect(() => {
    if (sessionId) {
      verifyPaymentAndLoadEvent();
    } else {
      setError("No se encontró información de la sesión de pago");
      setLoading(false);
    }
  }, [sessionId]);

  const verifyPaymentAndLoadEvent = async () => {
    try {
      setLoading(true);
      const result = await verifyPayment(sessionId!);

      if (result.success && result.metadata) {
        const metadata = result.metadata;

        // Obtener información del evento completa
        const eventData = await getEvent(metadata.eventId);

        // Obtener información del venue si el evento existe
        let venueData = null;
        if (eventData && eventData.lugar_id) {
          venueData = await getVenue(eventData.lugar_id);
        }

        // Parsear los items del carrito desde metadata
        const cartItems: CartItem[] = metadata.cartItems
          ? JSON.parse(metadata.cartItems)
          : [];

        setPaymentData({
          customerEmail: result.customerDetails?.email || "",
          customerName: result.customerDetails?.name || "",
          orderNumber: result.sessionId?.slice(-8).toUpperCase() || "N/A",
          eventId: metadata.eventId || "",
          eventName: metadata.eventName || "",
          totalAmount: result.amountTotal ? result.amountTotal / 100 : 0,
          subtotal: parseFloat(metadata.subtotal || "0"),
          serviceCharge: parseFloat(metadata.serviceCharge || "0"),
          ticketCount: parseInt(metadata.ticketCount || "1"),
          cartItems: cartItems,
          paymentMethod: result.paymentMethod || undefined,
          purchaseDate: new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        });

        setEvent(eventData);
        setVenue(venueData);
      } else {
        setError("No se pudo verificar el pago");
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      setError("Error al verificar el pago");
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (date: Date, time: string) => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    return `${dayName}, ${month} ${day}, ${year}, ${time}`;
  };

  const getVenueDisplayName = () => {
    if (venue) {
      return `${venue.ciudad}, ${venue.estado} - ${venue.nombre}`;
    }
    return "Lugar por confirmar";
  };

  const getSeatsSummary = () => {
    if (!paymentData?.cartItems.length) return "Boletos generales";

    const seatItems = paymentData.cartItems.filter(
      (item) => item.type === "seat",
    );
    const generalItems = paymentData.cartItems.filter(
      (item) => item.type === "general",
    );

    let summary: string[] = [];

    // Agrupar asientos por zona
    const seatsByZone = seatItems.reduce(
      (acc, item) => {
        if (!acc[item.zoneName]) {
          acc[item.zoneName] = [];
        }
        acc[item.zoneName].push(item);
        return acc;
      },
      {} as Record<string, CartItem[]>,
    );

    // Crear resumen para cada zona
    Object.entries(seatsByZone).forEach(([zoneName, seats]) => {
      const sortedSeats = seats.sort(
        (a, b) => (a.seatNumber || 0) - (b.seatNumber || 0),
      );
      const firstSeat = sortedSeats[0];
      const lastSeat = sortedSeats[sortedSeats.length - 1];

      if (sortedSeats.length === 1) {
        summary.push(
          `${zoneName}, Row ${firstSeat.rowLetter}, Seat ${firstSeat.seatNumber}`,
        );
      } else {
        summary.push(
          `${zoneName}, Row ${firstSeat.rowLetter}, Seats ${firstSeat.seatNumber} - ${lastSeat.seatNumber}`,
        );
      }
    });

    // Agregar boletos generales
    if (generalItems.length > 0) {
      const totalGeneralTickets = generalItems.reduce(
        (acc, item) => acc + (item.quantity || 1),
        0,
      );
      summary.push(
        `General (${totalGeneralTickets} boleto${totalGeneralTickets > 1 ? "s" : ""})`,
      );
    }

    return summary.length > 0 ? summary.join(", ") : "Boletos generales";
  };

  const getCardBrand = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "Visa";
      case "mastercard":
        return "Mastercard";
      case "amex":
        return "American Express";
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  };

  const groupItemsByZone = () => {
    if (!paymentData?.cartItems.length) return {};

    return paymentData.cartItems.reduce(
      (acc, item) => {
        // Para boletos generales, usar "General" como nombre de zona
        const zoneName = item.type === "general" ? "General" : item.zoneName;

        if (!acc[zoneName]) {
          acc[zoneName] = {
            items: [],
            totalPrice: 0,
            totalQuantity: 0,
            isGeneral: item.type === "general",
          };
        }

        acc[zoneName].items.push(item);
        acc[zoneName].totalPrice += item.price * (item.quantity || 1);
        acc[zoneName].totalQuantity += item.quantity || 1;

        return acc;
      },
      {} as Record<
        string,
        {
          items: CartItem[];
          totalPrice: number;
          totalQuantity: number;
          isGeneral: boolean;
        }
      >,
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Verificando tu compra...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Error en la Verificación
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/eventos">
                <Button className="w-full">Volver a Eventos</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!paymentData || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center text-white">
            <p className="text-lg">No se encontró información de la compra</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const groupedItems = groupItemsByZone();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">

      <main className={`container mx-auto px-4 py-8 ${isMobile ? 'max-w-md' : 'max-w-6xl'}`}>
        {/* Header Success Message */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircleIcon className={`text-white ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`} />
          </div>
          <h1 className={`font-bold text-white mb-2 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
            ¡Ya son tuyos!
          </h1>
          <p className={`text-blue-100 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Tu compra ha sido procesada exitosamente
          </p>
        </div>

        {/* Two Column Layout */}
        <div className={`${isMobile ? 'space-y-6' : 'grid lg:grid-cols-2 gap-8'}`}>
          {/* Left Column - Event Information */}
          <Card className="bg-white shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              {/* Event Name */}
              <div className="mb-6">
                <Badge className="bg-green-100 text-green-800 mb-3">
                  Confirmado
                </Badge>
                <h2 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                  {event.nombre}
                </h2>
              </div>

              {/* Seats Summary */}
              <div className="mb-6">
                <h3 className={`font-semibold text-gray-800 mb-2 ${isMobile ? 'text-base' : ''}`}>
                  Resumen de Asientos
                </h3>
                <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>{getSeatsSummary()}</p>
              </div>

              {/* Event Date & Time */}
              <div className="mb-6">
                <h3 className={`font-semibold text-gray-800 mb-2 ${isMobile ? 'text-base' : ''}`}>
                  Fecha del Evento
                </h3>
                <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
                  {formatEventDate(event.fecha, event.hora)}
                </p>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className={`font-semibold text-gray-800 mb-2 ${isMobile ? 'text-base' : ''}`}>Ubicación</h3>
                <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>{getVenueDisplayName()}</p>
              </div>

              <hr className="my-6" />

              {/* Tickets Section */}
              <div>
                <h3 className={`font-semibold text-gray-800 mb-4 ${isMobile ? 'text-base' : ''}`}>Tickets</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Número de Orden:</span>
                    <span className={`font-mono font-medium ${isMobile ? 'text-sm' : ''}`}>
                      {paymentData.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Delivery:</span>
                    <span className={`text-gray-800 ${isMobile ? 'text-sm' : ''}`}>Correo Electrónico</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Payment & Ticket Details */}
          <Card className="bg-white shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              {/* Payment Method Card */}
              {paymentData.paymentMethod?.card && (
                <div className="mb-6">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <CreditCardIcon className={`text-gray-600 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
                    <div>
                      <p className={`font-medium text-gray-800 ${isMobile ? 'text-sm' : ''}`}>
                        {getCardBrand(paymentData.paymentMethod.card.brand)}{" "}
                        •••• {paymentData.paymentMethod.card.last4}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <hr className="my-6" />

              {/* Tickets Breakdown */}
              <div className="mb-6">
                <h3 className={`font-semibold text-gray-800 mb-4 ${isMobile ? 'text-base' : ''}`}>Tickets</h3>
                <div className="space-y-3">
                  {Object.entries(groupedItems).map(([zoneName, zoneData]) => (
                    <div
                      key={zoneName}
                      className='flex flex-row justify-between items-start md:items-center'
                    >
                      <div>
                        <span className={`text-gray-800 ${isMobile ? 'text-sm font-medium' : ''}`}>
                          {zoneData.isGeneral ? "General" : zoneName}:
                        </span>
                        <span className={`text-gray-600 ${isMobile ? 'text-xs block' : 'ml-2'}`}>
                          ${zoneData.items[0].price.toFixed(2)} MXN x{" "}
                          {zoneData.totalQuantity}
                        </span>
                      </div>
                      <span className={`font-medium text-gray-800 ${isMobile ? 'text-sm' : ''}`}>
                        ${zoneData.totalPrice.toFixed(2)} MXN
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Charge */}
              <div className="mb-6">
                <h3 className={`font-semibold text-gray-800 mb-4 ${isMobile ? 'text-base' : ''}`}>Servicios</h3>
                <div className="flex justify-between items-center">
                  <span className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>Cargo por servicio</span>
                  <span className={`font-medium text-gray-800 ${isMobile ? 'text-sm' : ''}`}>
                    ${paymentData.serviceCharge.toFixed(2)} MXN
                  </span>
                </div>
              </div>

              <hr className="my-6" />

              {/* Total */}
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <span className={`font-bold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>Total</span>
                  <span className={`font-bold text-green-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    ${paymentData.totalAmount.toFixed(2)} MXN
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-4 justify-center mt-8 ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}>
          <Link href="/">
            <Button
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className={`bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 ${isMobile ? 'w-full py-3 text-base' : 'w-full sm:w-auto px-8 py-3 text-lg'}`}
            >
              Explorar Más Eventos
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-8 text-blue-100">
          <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
            Recibirás un correo de confirmación con los detalles de tu compra.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <Header />
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
