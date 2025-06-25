"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, MapPin, Copy, Trash2, Map } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Event,
  getActiveEvents,
  getEvent,
  Venue,
  getVenue,
} from "@/lib/firebase/transactions";

interface EventTableProps {
  onEdit: (id: string) => void;
  venueFilter?: string;
}

interface EventWithVenue extends Event {
  venue?: Venue | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "en_preventa":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "activo":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "agotado":
      return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    case "finalizado":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "en_preventa":
      return "En preventa";
    case "activo":
      return "Activo";
    case "agotado":
      return "Agotado";
    case "finalizado":
      return "Finalizado";
    default:
      return status;
  }
};

export function EventTable({ onEdit, venueFilter }: EventTableProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [events, setEvents] = useState<EventWithVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [venueFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsList = await getActiveEvents();

      // Cargar la información del venue para cada evento
      const eventsWithVenue = await Promise.all(
        eventsList.map(async (event) => {
          const venue = await getVenue(event.lugar_id);
          return {
            ...event,
            venue,
          } as EventWithVenue;
        }),
      );

      // Aplicar filtro de venue si existe
      const filteredEvents = venueFilter
        ? eventsWithVenue.filter((event) => event.lugar_id === venueFilter)
        : eventsWithVenue;

      setEvents(filteredEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEvents.length === events.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(events.map((event) => event.id!));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedEvents.includes(id)) {
      setSelectedEvents(selectedEvents.filter((eventId) => eventId !== id));
    } else {
      setSelectedEvents([...selectedEvents, id]);
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border bg-white p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3">Cargando eventos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={
                  selectedEvents.length === events.length && events.length > 0
                }
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="w-16">Imagen</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Lugar</TableHead>
            <TableHead>Estado de Venta</TableHead>
            <TableHead>Venta en línea</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="hover:bg-gray-50">
              <TableCell>
                <Checkbox
                  checked={selectedEvents.includes(event.id!)}
                  onCheckedChange={() => toggleSelect(event.id!)}
                />
              </TableCell>
              <TableCell>
                <Avatar className="h-10 w-10 rounded-md">
                  <AvatarImage
                    src={event.imagen_url || "/placeholder.svg"}
                    alt={event.nombre}
                  />
                  <AvatarFallback className="rounded-md bg-gray-100">
                    EV
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => onEdit(event.id!)}
                  >
                    {event.nombre}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {format(event.fecha, "dd MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell>{event.hora}</TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span>{event.venue?.nombre || "Cargando..."}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{event.venue?.direccion || "Sin dirección"}</p>
                      <p>{`${event.venue?.ciudad}, ${event.venue?.estado}`}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(event.estado_venta)}>
                  {getStatusText(event.estado_venta)}
                </Badge>
              </TableCell>
              <TableCell>
                <Switch checked={event.venta_en_linea} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      <span>Duplicar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedEvents.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedEvents.length} eventos seleccionados
          </span>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </Button>
          <Button variant="outline" size="sm">
            Pausar ventas
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      )}
    </div>
  );
}
