"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Star,
  Share2,
  Heart,
  Users,
  Info,
} from "lucide-react";
import { Event, getEvent } from "@/lib/firebase/events";
import { Venue, getVenue } from "@/lib/firebase/venues";
import { useMobileDetection } from "@/lib/hooks/use-mobile-detection";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { isMobile } = useMobileDetection();

  const [event, setEvent] = useState<Event | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventDetails() {
      try {
        setLoading(true);
        setError(null);

        // Obtener el evento
        const eventData = await getEvent(eventId);
        if (!eventData) {
          setError("Evento no encontrado");
          return;
        }

        setEvent(eventData);

        // Obtener información del venue
        const venueData = await getVenue(eventData.lugar_id);
        setVenue(venueData);
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Error al cargar los detalles del evento");
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-500";
      case "en_preventa":
        return "bg-yellow-500";
      case "agotado":
        return "bg-red-500";
      case "finalizado":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "activo":
        return "Venta Activa";
      case "en_preventa":
        return "En Preventa";
      case "agotado":
        return "Agotado";
      case "finalizado":
        return "Finalizado";
      default:
        return status;
    }
  };

  const handleComprarBoletos = () => {
    router.push(`/eventos/${eventId}/comprar`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles del evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Evento no encontrado"}
          </h1>
          <p className="text-gray-600 mb-4">
            Lo sentimos, no pudimos encontrar este evento.
          </p>
          <Button onClick={() => window.history.back()}>Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto px-4 py-8 ${isMobile ? 'max-w-md' : 'max-w-4xl'}`}>
      {/* Header Image */}
      <div className="relative mb-8">
        <div className={`rounded-lg overflow-hidden bg-gradient-to-r from-blue-400 to-purple-500 ${isMobile ? 'aspect-[4/3]' : 'aspect-video'}`}>
          {event.imagen_url &&
          event.imagen_url !== "https://picsum.photos/200" ? (
            <img
              src={event.imagen_url}
              alt={event.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <Calendar className={`mx-auto mb-4 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`} />
                <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{event.nombre}</h2>
              </div>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge className={`${getStatusColor(event.estado_venta)} text-white ${isMobile ? 'text-xs' : ''}`}>
            {getStatusText(event.estado_venta)}
          </Badge>
        </div>
      </div>

      {/* Event Title and Actions */}
      <div className={`${isMobile ? 'space-y-4' : 'flex justify-between items-start'} mb-6`}>
        <div>
          <h1 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            {event.nombre}
          </h1>
          <div className={`flex items-center text-gray-600 ${isMobile ? 'flex-col items-start gap-2' : 'gap-4'}`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className={isMobile ? 'text-sm' : ''}>{formatDate(event.fecha)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className={isMobile ? 'text-sm' : ''}>{formatTime(event.hora)}</span>
            </div>
          </div>
        </div>

        <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
          <Button variant="outline" size={isMobile ? "sm" : "sm"} className={isMobile ? 'flex-1' : ''}>
            <Heart className="w-4 h-4 mr-2" />
            {isMobile ? '' : 'Favorito'}
          </Button>
          <Button variant="outline" size={isMobile ? "sm" : "sm"} className={isMobile ? 'flex-1' : ''}>
            <Share2 className="w-4 h-4 mr-2" />
            {isMobile ? '' : 'Compartir'}
          </Button>
        </div>
      </div>

      <div className={`${isMobile ? 'space-y-6' : 'grid lg:grid-cols-3 gap-8'}`}>
        {/* Main Content */}
        <div className={`space-y-6 ${isMobile ? '' : 'lg:col-span-2'}`}>
          {/* Description */}
          <Card>
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>Descripción</h3>
              </div>
              <p className={`text-gray-700 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
                {event.descripcion}
              </p>
            </CardContent>
          </Card>

          {/* Venue Information */}
          {venue && (
            <Card>
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>Ubicación</h3>
                </div>
                <div className="space-y-2">
                  <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{venue.nombre}</h4>
                  {venue.direccion && (
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : ''}`}>{venue.direccion}</p>
                  )}
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : ''}`}>
                    {venue.ciudad}, {venue.estado}
                  </p>
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : ''}`}>{venue.pais}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Purchase Card */}
          <Card>
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="text-center mb-4">
                <div className={`font-bold text-blue-600 mb-1 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                  Boletos Disponibles
                </div>
                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {event.venta_en_linea
                    ? "Venta en línea disponible"
                    : "Venta en taquilla únicamente"}
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <Button
                    className={`w-full bg-blue-600 hover:bg-blue-700 ${isMobile ? 'py-3' : ''}`}
                    size={isMobile ? "default" : "lg"}
                    disabled={event.estado_venta === 'agotado' || event.estado_venta === 'finalizado'}
                    onClick={handleComprarBoletos}
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    {event.estado_venta === 'agotado' ? 'Agotado' :
                      event.estado_venta === 'finalizado' ? 'Finalizado' :
                        'Comprar Boletos'}
                  </Button>  
                  
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <h3 className={`font-semibold mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>
                Detalles del Evento
              </h3>
              <div className={`space-y-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{formatDate(event.fecha)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-medium">{formatTime(event.hora)}</span>
                </div>
                {venue && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lugar:</span>
                    <span className="font-medium">{venue.nombre}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <Badge
                    className={`${getStatusColor(event.estado_venta)} text-white text-xs`}
                  >
                    {getStatusText(event.estado_venta)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
