"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  Mail, 
  Send, 
  AlertCircle, 
  CheckCircle,
  CalendarIcon,
  Clock,
  CreditCard,
  User,
  Hash,
  DollarSign
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  getMovementsByEmail,
  getTicketsByMovement,
  processPaymentWithBackend,
  Movement,
  MovementTicket
} from "@/lib/firebase/transactions";

interface MovementWithTickets extends Movement {
  tickets: MovementTicket[];
}

export default function TicketResendView() {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchDate, setSearchDate] = useState<Date>(new Date());
  const [isSearching, setIsSearching] = useState(false);
  const [foundMovements, setFoundMovements] = useState<MovementWithTickets[]>([]);
  const [resendingMovementId, setResendingMovementId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa un email para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Buscar movimientos en un rango de ±1 día de la fecha seleccionada
      const startDate = startOfDay(subDays(searchDate, 1));
      const endDate = endOfDay(searchDate);
      
      const movements = await getMovementsByEmail(searchEmail.trim(), startDate, endDate);
      
      // Obtener tickets para cada movimiento
      const movementsWithTickets: MovementWithTickets[] = [];
      
      for (const movement of movements) {
        try {
          const tickets = await getTicketsByMovement(movement.id);
          movementsWithTickets.push({
            ...movement,
            tickets
          });
        } catch (error) {
          console.error(`Error getting tickets for movement ${movement.id}:`, error);
          movementsWithTickets.push({
            ...movement,
            tickets: []
          });
        }
      }

      setFoundMovements(movementsWithTickets);

      if (movementsWithTickets.length === 0) {
        toast({
          title: "No se encontraron movimientos",
          description: `No hay movimientos para ${searchEmail} en la fecha ${format(searchDate, "dd/MM/yyyy")}`,
        });
      } else {
        toast({
          title: "Búsqueda completada",
          description: `Se encontraron ${movementsWithTickets.length} movimiento(s)`,
        });
      }

    } catch (error) {
      console.error("Error searching movements:", error);
      toast({
        title: "Error en la búsqueda",
        description: "Ocurrió un error al buscar los movimientos",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleResendTickets = async (movementId: string) => {
    setResendingMovementId(movementId);
    try {
      const result = await processPaymentWithBackend(movementId, "paid");
      
      if (result.success) {
        toast({
          title: "¡Boletos reenviados!",
          description: "Los boletos han sido reenviados exitosamente al email del comprador",
        });
      } else {
        toast({
          title: "Error al reenviar",
          description: result.error || "No se pudieron reenviar los boletos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resending tickets:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al reenviar los boletos",
        variant: "destructive",
      });
    } finally {
      setResendingMovementId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Pagado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentTypeBadge = (tipo_pago: string, card_brand?: string) => {
    switch (tipo_pago) {
      case 'efectivo':
        return <Badge variant="outline" className="text-green-600 border-green-600">Efectivo</Badge>;
      case 'tarjeta':
        const cardText = card_brand ? `${card_brand.toUpperCase()}` : 'Tarjeta';
        return <Badge variant="outline" className="text-blue-600 border-blue-600">{cardText}</Badge>;
      case 'cortesia':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">Cortesía</Badge>;
      default:
        return <Badge variant="outline">{tipo_pago}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatTicketInfo = (tickets: MovementTicket[]) => {
    if (tickets.length === 0) return "Sin información de boletos";
    
    // Agrupar tickets por zona
    const ticketsByZone = tickets.reduce((acc, ticket) => {
      // Necesitamos obtener la información del ticket desde la colección tickets
      // Por ahora solo mostraremos el ID y precio
      const key = `Ticket ${ticket.boleto_id.substring(0, 8)}...`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(ticket);
      return acc;
    }, {} as Record<string, MovementTicket[]>);

    return Object.entries(ticketsByZone).map(([zone, zoneTickets]) => 
      `${zone} (${zoneTickets.length})`
    ).join(", ");
  };

  return (
    <div className="space-y-6">
      {/* Formulario de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Movimientos para Reenvío
          </CardTitle>
          <div className="text-sm text-gray-500">
            💡 Busca movimientos por email del comprador para reenviar boletos
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email del comprador */}
            <div className="space-y-2">
              <Label htmlFor="search_email">Email del Comprador</Label>
              <Input
                id="search_email"
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="flex-1"
              />
            </div>

            {/* Fecha de la compra */}
            <div className="space-y-2">
              <Label>Fecha de la Compra</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !searchDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchDate ? format(searchDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={searchDate}
                    onSelect={(date) => date && setSearchDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Botón de búsqueda */}
            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchEmail.trim()}
                className="w-full flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados de la búsqueda */}
      {foundMovements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Movimientos Encontrados ({foundMovements.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {foundMovements.map((movement) => (
              <div key={movement.id} className="border rounded-lg p-4 space-y-3">
                {/* Encabezado del movimiento */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="font-mono text-sm text-gray-600">
                        {movement.id.substring(0, 8)}...
                      </span>
                    </div>
                    {getStatusBadge(movement.status || 'unknown')}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-lg">
                      {formatCurrency(movement.total)}
                    </span>
                  </div>
                </div>

                {/* Información del comprador */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{movement.buyer_name || "Sin nombre"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{movement.buyer_email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(movement.fecha, "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      {getPaymentTypeBadge(movement.tipo_pago, movement.card_brand)}
                    </div>
                  </div>
                </div>

                {/* Información de boletos */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Boletos ({movement.tickets.length}):
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTicketInfo(movement.tickets)}
                  </div>
                </div>

                {/* Detalles financieros */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="ml-2 font-medium">{formatCurrency(movement.subtotal)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cargo Servicio:</span>
                    <span className="ml-2 font-medium">{formatCurrency(movement.cargo_servicio)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-2 font-semibold">{formatCurrency(movement.total)}</span>
                  </div>
                </div>

                <Separator />

                {/* Acciones */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {movement.status === 'paid' 
                      ? "Listo para reenviar boletos" 
                      : "Solo se pueden reenviar boletos pagados"
                    }
                  </div>
                  <Button
                    onClick={() => handleResendTickets(movement.id)}
                    disabled={
                      movement.status !== 'paid' || 
                      resendingMovementId === movement.id
                    }
                    className="flex items-center gap-2"
                  >
                    {resendingMovementId === movement.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Reenviar Boletos
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Información de ayuda */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">¿Cómo funciona el reenvío de boletos?</p>
              <ul className="space-y-1 text-xs">
                <li>• Busca movimientos por email del comprador y fecha de compra</li>
                <li>• Solo se pueden reenviar boletos de movimientos con status "Pagado"</li>
                <li>• El sistema llamará al backend para regenerar y enviar los PDFs</li>
                <li>• Los boletos se enviarán al email original del comprador</li>
                <li>• El rango de búsqueda incluye ±1 día de la fecha seleccionada</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 