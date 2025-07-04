"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Event, getEvent } from "@/lib/firebase/events";
import { Venue, getVenue } from "@/lib/firebase/venues";
import { useCart } from "@/hooks/use-cart";
import { CartSummaryComponent } from "@/components/stripe/cart-summary";
import { CheckoutButton } from "@/components/stripe/checkout-button";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import {
  ArrowLeft,
  Mail,
  User,
  Calendar,
  MapPin,
  Clock,
  CreditCard,
} from "lucide-react";

interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

function CheckoutContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile } = useMobileDetection();

  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);

  const {
    cartSummary,
    removeItem,
    updateQuantity,
    loadFromExistingData,
    setEvent: setCartEvent,
  } = useCart();

  // Cargar datos del evento
  useEffect(() => {
    async function fetchEventDetails() {
      try {
        setLoading(true);

        const eventData = await getEvent(eventId);
        if (!eventData) {
          toast({
            title: "Error",
            description: "Evento no encontrado",
            variant: "destructive",
          });
          router.push("/eventos");
          return;
        }

        setEvent(eventData);

        const venueData = await getVenue(eventData.lugar_id);
        setVenue(venueData);

        // Establecer evento en el carrito
        const eventInfo = {
          id: eventId,
          title: eventData.nombre,
          date: eventData.fecha.toLocaleDateString("es-ES"),
          time: eventData.hora,
          venue: venueData
            ? `${venueData.nombre}, ${venueData.ciudad}`
            : "Ubicación por confirmar",
        };
        setCartEvent(eventInfo);
      } catch (error) {
        console.error("Error fetching event details:", error);
        toast({
          title: "Error",
          description: "Error al cargar los detalles del evento",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, router, toast, setCartEvent]);

  // Cargar datos del carrito desde URL params
  useEffect(() => {
    const selectedSeatsParam = searchParams.get("selectedSeats");
    const generalTicketsParam = searchParams.get("generalTickets");

    if (selectedSeatsParam || generalTicketsParam) {
      const selectedSeats = selectedSeatsParam
        ? JSON.parse(selectedSeatsParam)
        : [];
      const generalTickets = generalTicketsParam
        ? JSON.parse(generalTicketsParam)
        : [];
      loadFromExistingData(selectedSeats, generalTickets);
    } else {
      // Si no hay datos en la URL, redirigir de vuelta
      router.push(`/eventos/${eventId}/comprar`);
    }
  }, [searchParams, loadFromExistingData, router, eventId]);

  // Validar formulario
  useEffect(() => {
    const isValid =
      customerData.email.trim() !== "" &&
      customerData.firstName.trim() !== "" &&
      customerData.lastName.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email);
    setIsFormValid(isValid);
  }, [customerData]);

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBackToSeatSelection = () => {
    router.push(`/eventos/${eventId}/comprar`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del evento...</p>
        </div>
      </div>
    );
  }

  if (!event || cartSummary.isEmpty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold mb-2">Carrito Vacío</h2>
            <p className="text-gray-600 mb-6">
              No hay boletos seleccionados para procesar.
            </p>
            <Button onClick={handleBackToSeatSelection} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Seleccionar Boletos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventInfo = {
    id: eventId,
    title: event.nombre,
    date: event.fecha.toLocaleDateString("es-ES"),
    time: event.hora,
    venue: venue
      ? `${venue.nombre}, ${venue.ciudad}`
      : "Ubicación por confirmar",
    image: event.imagen_url || "/placeholder.jpg",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`mx-auto p-4 ${isMobile ? 'max-w-md' : 'max-w-6xl p-6'}`}>
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToSeatSelection}
            className="mb-4"
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isMobile ? "Volver" : "Volver a selección de asientos"}
          </Button>

          <div className="text-center">
            <h1 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
              Finalizar Compra
            </h1>
            <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
              Completa tus datos para continuar con el pago
            </p>
          </div>
        </div>

        <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}`}>
          {/* Panel izquierdo - Información del evento y formulario */}
          <div className="space-y-6">
            {/* Información del evento */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                  <Calendar className="w-5 h-5" />
                  Información del Evento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`${isMobile ? 'space-y-3' : 'flex gap-4'}`}>
                  <img
                    src={eventInfo.image}
                    alt={eventInfo.title}
                    className={`object-cover rounded-lg ${isMobile ? 'w-full h-32' : 'w-20 h-20'}`}
                  />
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
                      {eventInfo.title}
                    </h3>
                    <div className={`space-y-1 text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {eventInfo.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {eventInfo.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className={isMobile ? 'text-xs' : ''}>{eventInfo.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de datos del cliente */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                  <User className="w-5 h-5" />
                  Datos del Comprador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
                  <div>
                    <Label htmlFor="firstName" className={isMobile ? 'text-sm' : ''}>Nombre *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={customerData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Tu nombre"
                      required
                      className={isMobile ? 'text-sm' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className={isMobile ? 'text-sm' : ''}>Apellido *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={customerData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Tu apellido"
                      required
                      className={isMobile ? 'text-sm' : ''}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className={isMobile ? 'text-sm' : ''}>Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    className={isMobile ? 'text-sm' : ''}
                  />
                  <p className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    Los boletos serán enviados a este correo
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone" className={isMobile ? 'text-sm' : ''}>Teléfono (Opcional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+52 555 123 4567"
                    className={isMobile ? 'text-sm' : ''}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className={`font-medium text-blue-900 mb-1 ${isMobile ? 'text-sm' : ''}`}>
                        Entrega de Boletos
                      </h4>
                      <p className={`text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        Después del pago exitoso, recibirás tus boletos por
                        correo electrónico en formato PDF listo para imprimir o
                        mostrar desde tu móvil.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho - Resumen del carrito */}
          <div className="space-y-6">
            <CartSummaryComponent
              cartSummary={cartSummary}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateQuantity}
              showTitle={true}
            />

            {/* Botón de pago */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                  <CreditCard className="w-5 h-5" />
                  Proceder al Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={`text-green-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>🔒</div>
                      <div>
                        <h4 className={`font-medium text-green-900 mb-1 ${isMobile ? 'text-sm' : ''}`}>
                          Pago Seguro
                        </h4>
                        <p className={`text-green-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          Tu información está protegida con cifrado SSL.
                          Procesamos pagos de forma segura con Stripe.
                        </p>
                      </div>
                    </div>
                  </div>

                  <CheckoutButton
                    cartSummary={cartSummary}
                    eventInfo={eventInfo}
                    disabled={!isFormValid}
                    className={`w-full ${isMobile ? 'h-11 text-base' : 'h-12 text-lg'}`}
                    customerData={customerData}
                  />

                  {!isFormValid && (
                    <p className={`text-red-600 text-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Por favor completa todos los campos requeridos
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
