"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Send, AlertCircle } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";
import { 
  createMovement,
  createTickets,
  createMovementTickets,
  updateMovementStatus,
  processPaymentWithBackend
} from "@/lib/firebase/transactions";
import { updateSeatsFromCartItems } from "@/lib/firebase/seat-management";

interface CartItem {
  id: string;
  type: "seat" | "general";
  zoneName: string;
  price: number;
  rowLetter?: string;
  seatNumber?: number;
  quantity?: number;
}

interface MovementData {
  total: number;
  subtotal: number;
  cargo_servicio: number;
  tipo_pago: "efectivo" | "tarjeta" | "cortesia";
  card_brand?: "visa" | "mastercard" | "amex" | "other";
  buyer_email: string;
  buyer_name: string;
  event_id: string;
  user_id: string;
}

const ZONES = [
  { id: "VIP 1", name: "VIP 1" },
  { id: "VIP 2", name: "VIP 2" },
  { id: "VIP 3", name: "VIP 3" },
  { id: "VIP 4", name: "VIP 4" },
  { id: "Oro 1", name: "Oro 1" },
  { id: "Oro 2", name: "Oro 2" },
  { id: "Oro 3", name: "Oro 3" },
  { id: "Oro 4", name: "Oro 4" },
  { id: "Oro 5", name: "Oro 5" },
  { id: "Oro 6", name: "Oro 6" },
  { id: "Oro 7", name: "Oro 7" },
  { id: "Oro 8", name: "Oro 8" },
  { id: "General", name: "General" },
];

export default function ManualTicketSendView() {
  const [movementData, setMovementData] = useState<MovementData>({
    total: 0,
    subtotal: 0,
    cargo_servicio: 0,
    tipo_pago: "efectivo",
    buyer_email: "",
    buyer_name: "",
    event_id: "",
    user_id: "",
  });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para nuevo boleto
  const [newTicketType, setNewTicketType] = useState<"seat" | "general">("seat");
  const [newTicketZone, setNewTicketZone] = useState<string>("");
  const [newTicketPrice, setNewTicketPrice] = useState<string>("");
  const [newTicketRow, setNewTicketRow] = useState<string>("");
  const [newTicketSeat, setNewTicketSeat] = useState<string>("");
  const [newTicketQuantity, setNewTicketQuantity] = useState<string>("1");

  const handleMovementDataChange = (field: keyof MovementData, value: any) => {
    setMovementData(prev => ({ ...prev, [field]: value }));
  };

  const addTicket = () => {
    if (!newTicketZone || !newTicketPrice) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa zona y precio",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(newTicketPrice);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Precio inválido",
        description: "Por favor ingresa un precio válido",
        variant: "destructive",
      });
      return;
    }

    if (newTicketType === "seat") {
      if (!newTicketRow || !newTicketSeat) {
        toast({
          title: "Datos incompletos",
          description: "Para asientos numerados necesitas fila y número de asiento",
          variant: "destructive",
        });
        return;
      }

      const seatNumber = parseInt(newTicketSeat);
      if (isNaN(seatNumber) || seatNumber < 1) {
        toast({
          title: "Asiento inválido",
          description: "El número de asiento debe ser un número positivo",
          variant: "destructive",
        });
        return;
      }

      const newTicket: CartItem = {
        id: `${newTicketZone}-${newTicketRow}-${seatNumber}-${Date.now()}`,
        type: "seat",
        zoneName: newTicketZone,
        price: price,
        rowLetter: newTicketRow.toUpperCase(),
        seatNumber: seatNumber,
      };

      setCartItems(prev => [...prev, newTicket]);
    } else {
      const quantity = parseInt(newTicketQuantity);
      if (isNaN(quantity) || quantity < 1) {
        toast({
          title: "Cantidad inválida",
          description: "La cantidad debe ser un número positivo",
          variant: "destructive",
        });
        return;
      }

      const newTicket: CartItem = {
        id: `${newTicketZone}-general-${Date.now()}`,
        type: "general",
        zoneName: newTicketZone,
        price: price,
        quantity: quantity,
      };

      setCartItems(prev => [...prev, newTicket]);
    }

    // Limpiar formulario
    setNewTicketZone("");
    setNewTicketPrice("");
    setNewTicketRow("");
    setNewTicketSeat("");
    setNewTicketQuantity("1");
  };

  const removeTicket = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      if (item.type === "general") {
        return sum + item.price * (item.quantity || 1);
      }
      return sum + item.price;
    }, 0);

    const serviceCharge = subtotal * 0.18; // 18% cargo por servicio
    const total = subtotal + serviceCharge;

    return { subtotal, serviceCharge, total };
  };

  const updateCalculatedTotals = () => {
    const { subtotal, serviceCharge, total } = calculateTotals();
    setMovementData(prev => ({
      ...prev,
      subtotal: Math.round(subtotal * 100) / 100,
      cargo_servicio: Math.round(serviceCharge * 100) / 100,
      total: Math.round(total * 100) / 100,
    }));
  };

  const validateForm = (): boolean => {
    if (!movementData.buyer_email || !movementData.buyer_name) {
      toast({
        title: "Datos del comprador incompletos",
        description: "Email y nombre del comprador son requeridos",
        variant: "destructive",
      });
      return false;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Sin boletos",
        description: "Debes agregar al menos un boleto",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const processManualTicketSend = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      // 1. Crear movimiento
      const movementId = await createMovement({
        ...movementData,
        total: movementData.total,
        subtotal: movementData.subtotal,
        cargo_servicio: movementData.cargo_servicio,
        tipo_pago: movementData.tipo_pago,
        card_brand: movementData.card_brand,
        buyer_email: movementData.buyer_email,
        buyer_name: movementData.buyer_name,
        event_id: movementData.event_id || undefined,
        user_id: movementData.user_id || undefined,
        metadata: {
          manual_send: true,
          ticketCount: cartItems.length.toString(),
        },
      });

      // 2. Crear tickets
      const ticketIds = await createTickets(cartItems, movementData.user_id, movementData.event_id);

      // 3. Crear relaciones movement_tickets
      await createMovementTickets(movementId, ticketIds, cartItems);

      // 4. Actualizar asientos si es necesario
      const seatUpdateResult = await updateSeatsFromCartItems(cartItems, 'occupied');
      if (!seatUpdateResult.success) {
        console.warn("Warning: Could not update seats:", seatUpdateResult.error);
      }

      // 5. Marcar movimiento como pagado
      await updateMovementStatus(movementId, "paid", {
        manual_send: true,
        processed_by: "manual_system",
      });

      // 6. Llamar al backend para procesar y enviar emails
      const backendResult = await processPaymentWithBackend(movementId, "paid");

      if (backendResult.success) {
        toast({
          title: "¡Éxito!",
          description: `Boletos enviados correctamente. Movement ID: ${movementId}`,
        });

        // Limpiar formulario
        setMovementData({
          total: 0,
          subtotal: 0,
          cargo_servicio: 0,
          tipo_pago: "efectivo",
          buyer_email: "",
          buyer_name: "",
          event_id: "",
          user_id: "",
        });
        setCartItems([]);

      } else {
        toast({
          title: "Parcialmente exitoso",
          description: `Movimiento creado (${movementId}) pero error en backend: ${backendResult.error}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error processing manual ticket send:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar el envío de boletos",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const { subtotal, serviceCharge, total } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Datos del Movimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Envío Manual de Boletos
          </CardTitle>
          <div className="text-sm text-gray-500">
            💡 Completa los datos del comprador y agrega los boletos para enviar por email
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email del comprador */}
            <div className="space-y-2">
              <Label htmlFor="buyer_email">Email del Comprador *</Label>
              <Input
                id="buyer_email"
                type="email"
                value={movementData.buyer_email}
                onChange={(e) => handleMovementDataChange("buyer_email", e.target.value)}
                placeholder="cliente@ejemplo.com"
              />
            </div>

            {/* Nombre del comprador */}
            <div className="space-y-2">
              <Label htmlFor="buyer_name">Nombre del Comprador *</Label>
              <Input
                id="buyer_name"
                value={movementData.buyer_name}
                onChange={(e) => handleMovementDataChange("buyer_name", e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>

            {/* Tipo de pago */}
            <div className="space-y-2">
              <Label htmlFor="tipo_pago">Tipo de Pago</Label>
              <Select 
                value={movementData.tipo_pago} 
                onValueChange={(value) => handleMovementDataChange("tipo_pago", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="cortesia">Cortesía</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Marca de tarjeta (solo si es tarjeta) */}
            {movementData.tipo_pago === "tarjeta" && (
              <div className="space-y-2">
                <Label htmlFor="card_brand">Marca de Tarjeta</Label>
                <Select 
                  value={movementData.card_brand || ""} 
                  onValueChange={(value) => handleMovementDataChange("card_brand", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="other">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Event ID */}
            <div className="space-y-2">
              <Label htmlFor="event_id">ID del Evento (opcional)</Label>
              <Input
                id="event_id"
                value={movementData.event_id}
                onChange={(e) => handleMovementDataChange("event_id", e.target.value)}
                placeholder="event_123"
              />
            </div>

            {/* User ID */}
            <div className="space-y-2">
              <Label htmlFor="user_id">ID del Usuario (opcional)</Label>
              <Input
                id="user_id"
                value={movementData.user_id}
                onChange={(e) => handleMovementDataChange("user_id", e.target.value)}
                placeholder="user_456"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agregar Boletos */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar Boletos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            {/* Tipo de boleto */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newTicketType} onValueChange={(value: "seat" | "general") => setNewTicketType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seat">Asiento</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zona */}
            <div className="space-y-2">
              <Label>Zona</Label>
              <Select value={newTicketZone} onValueChange={setNewTicketZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Zona" />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input
                type="number"
                value={newTicketPrice}
                onChange={(e) => setNewTicketPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Fila (solo para asientos) */}
            {newTicketType === "seat" && (
              <div className="space-y-2">
                <Label>Fila</Label>
                <Input
                  value={newTicketRow}
                  onChange={(e) => setNewTicketRow(e.target.value)}
                  placeholder="A"
                  maxLength={2}
                />
              </div>
            )}

            {/* Asiento (solo para asientos) */}
            {newTicketType === "seat" && (
              <div className="space-y-2">
                <Label>Asiento</Label>
                <Input
                  type="number"
                  value={newTicketSeat}
                  onChange={(e) => setNewTicketSeat(e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </div>
            )}

            {/* Cantidad (solo para generales) */}
            {newTicketType === "general" && (
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={newTicketQuantity}
                  onChange={(e) => setNewTicketQuantity(e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </div>
            )}

            {/* Botón agregar */}
            <Button onClick={addTicket} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Boletos */}
      {cartItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Boletos Agregados ({cartItems.length})</CardTitle>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Subtotal: ${subtotal.toFixed(2)}</span>
              <span>Cargo Servicio (18%): ${serviceCharge.toFixed(2)}</span>
              <span className="font-semibold">Total: ${total.toFixed(2)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={item.type === "seat" ? "default" : "secondary"}>
                      {item.type === "seat" ? "Asiento" : "General"}
                    </Badge>
                    <div>
                      <span className="font-medium">{item.zoneName}</span>
                      {item.type === "seat" ? (
                        <span className="text-sm text-gray-600 ml-2">
                          Fila {item.rowLetter}, Asiento {item.seatNumber}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600 ml-2">
                          Cantidad: {item.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      ${item.type === "general" ? (item.price * (item.quantity || 1)).toFixed(2) : item.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeTicket(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center">
              <Button
                onClick={updateCalculatedTotals}
                variant="outline"
                size="sm"
              >
                Actualizar Totales
              </Button>

              <Button
                onClick={processManualTicketSend}
                disabled={isProcessing || cartItems.length === 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isProcessing ? "Procesando..." : "Enviar Boletos"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de ayuda */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información del proceso:</p>
              <ul className="space-y-1 text-xs">
                <li>• Se creará un movimiento en Firestore</li>
                <li>• Se generarán los boletos correspondientes</li>
                <li>• Se actualizará el estado de asientos (si aplica)</li>
                <li>• Se enviará el email con los boletos PDF al comprador</li>
                <li>• El cargo por servicio se calcula automáticamente (18%)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 