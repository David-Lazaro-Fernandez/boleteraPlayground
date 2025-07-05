"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Event, getEvent } from "@/lib/firebase/events";
import { Venue, getVenue } from "@/lib/firebase/venues";
import { PalenqueSeatMap } from "@/components/palenque/palenque-seat-map";
import { useMobileDetection } from "@/lib/hooks/use-mobile-detection";

// Componente que muestra el mapa de asientos con información del evento
function EventSeatMap({ event, venue, eventId }: { event: Event; venue: Venue | null; eventId: string }) {
  const { isMobile, isLoading } = useMobileDetection();
  
  const eventInfo = {
    id: eventId,
    title: event.nombre,
    date: event.fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: event.hora,
    venue: venue
      ? `${venue.nombre}, ${venue.ciudad}`
      : "Ubicación por confirmar",
  };

  // Mostrar loading mientras se detecta si es móvil
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa de asientos...</p>
        </div>
      </div>
    );
  }

  // Usar el mapa circular en móviles, el mapa tradicional en escritorio
  return isMobile ? (
    <PalenqueSeatMap eventInfo={eventInfo} />
  ) : (
    <PalenqueSeatMap eventInfo={eventInfo} />
  );
}

export default function ComprarBoletosPage() {
  const params = useParams();
  const eventId = params.id as string;

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

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Evento no encontrado"}
          </h1>
          <p className="text-gray-600 mb-4">
            Lo sentimos, no pudimos cargar la información de este evento.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Verificar si el evento permite compra
  if (event.estado_venta === "agotado" || event.estado_venta === "finalizado") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {event.estado_venta === "agotado"
              ? "Evento Agotado"
              : "Evento Finalizado"}
          </h1>
          <p className="text-gray-600 mb-4">
            {event.estado_venta === "agotado"
              ? "Lo sentimos, todos los boletos para este evento han sido vendidos."
              : "Este evento ya ha finalizado."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <EventSeatMap event={event} venue={venue} eventId={eventId} />;
}
