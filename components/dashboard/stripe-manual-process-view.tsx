"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Upload, CheckCircle, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";
import { 
  createMovement,
  createTickets,
  createMovementTickets,
  updateMovementStatus,
  processPaymentWithBackend
} from "@/lib/firebase/transactions";
import { updateSeatsFromCartItems } from "@/lib/firebase/seat-management";

interface StripePaymentData {
  // Información básica del pago
  payment_id: string;
  charge_id: string;
  amount: number; // en centavos
  status: string;
  
  // Información del cliente
  customer_email: string;
  customer_name: string;
  customer_first_name?: string;
  customer_last_name?: string;
  
  // Información de la tarjeta
  card_brand: "visa" | "mastercard" | "amex" | "other";
  card_last4: string;
  
  // Información del evento y items
  event_id?: string;
  items_json: string; // JSON string de los items
  
  // Fechas
  created_date: string;
}

export default function StripeManualProcessView() {
  const [stripeData, setStripeData] = useState<StripePaymentData>({
    payment_id: "",
    charge_id: "",
    amount: 0,
    status: "succeeded",
    customer_email: "",
    customer_name: "",
    customer_first_name: "",
    customer_last_name: "",
    card_brand: "visa",
    card_last4: "",
    event_id: "",
    items_json: "",
    created_date: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    serviceCharge: 0,
    total: 0
  });

  const handleInputChange = (field: keyof StripePaymentData, value: any) => {
    setStripeData(prev => ({ ...prev, [field]: value }));
  };

  const parseItemsJson = () => {
    try {
      const items = JSON.parse(stripeData.items_json);
      setParsedItems(items);
      
      // Calcular totales
      const subtotal = items.reduce((sum: number, item: any) => {
        if (item.type === "general") {
          return sum + item.price * (item.quantity || 1);
        }
        return sum + item.price;
      }, 0);

      const serviceCharge = subtotal * 0.18; // 18%
      const total = subtotal + serviceCharge;

      setTotals({
        subtotal: Math.round(subtotal * 100) / 100,
        serviceCharge: Math.round(serviceCharge * 100) / 100,
        total: Math.round(total * 100) / 100
      });

      toast({
        title: "Items parseados correctamente",
        description: `${items.length} item(s) encontrado(s). Total calculado: $${total.toFixed(2)}`,
      });
    } catch (error) {
      console.error("Error parsing items JSON:", error);
      toast({
        title: "Error en JSON",
        description: "El formato del JSON de items no es válido",
        variant: "destructive",
      });
      setParsedItems([]);
      setTotals({ subtotal: 0, serviceCharge: 0, total: 0 });
    }
  };

  const validateForm = (): boolean => {
    if (!stripeData.payment_id || !stripeData.customer_email || !stripeData.items_json) {
      toast({
        title: "Datos incompletos",
        description: "Payment ID, email del cliente e items son requeridos",
        variant: "destructive",
      });
      return false;
    }

    if (parsedItems.length === 0) {
      toast({
        title: "Items no parseados",
        description: "Debes parsear los items antes de procesar",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const processStripePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      // Convertir monto de centavos a pesos
      const totalAmount = stripeData.amount / 100;

      // 1. Crear movimiento
      const movementId = await createMovement({
        total: totalAmount,
        subtotal: totals.subtotal,
        cargo_servicio: totals.serviceCharge,
        tipo_pago: "tarjeta",
        card_brand: stripeData.card_brand,
        buyer_email: stripeData.customer_email,
        buyer_name: stripeData.customer_name,
        event_id: stripeData.event_id || undefined,
        payment_intent_id: stripeData.payment_id,
        user_id: "", // Se puede crear automáticamente
        metadata: {
          stripe_manual_import: true,
          charge_id: stripeData.charge_id,
          card_last4: stripeData.card_last4,
          original_amount_centavos: stripeData.amount,
        },
      });

      // 2. Crear tickets
      const ticketIds = await createTickets(parsedItems, "", stripeData.event_id);

      // 3. Crear relaciones movement_tickets
      await createMovementTickets(movementId, ticketIds, parsedItems);

      // 4. Actualizar asientos
      const seatUpdateResult = await updateSeatsFromCartItems(parsedItems, 'occupied');
      if (!seatUpdateResult.success) {
        console.warn("Warning: Could not update seats:", seatUpdateResult.error);
      }

      // 5. Marcar como pagado
      await updateMovementStatus(movementId, "paid", {
        stripe_payment_id: stripeData.payment_id,
        stripe_charge_id: stripeData.charge_id,
        stripe_manual_import: true,
        processed_date: new Date().toISOString(),
      });

      // 6. Procesar con backend para enviar emails
      const backendResult = await processPaymentWithBackend(movementId, "paid");

      if (backendResult.success) {
        toast({
          title: "¡Procesamiento exitoso!",
          description: `Pago de Stripe procesado correctamente. Movement ID: ${movementId}`,
        });

        // Limpiar formulario
        setStripeData({
          payment_id: "",
          charge_id: "",
          amount: 0,
          status: "succeeded",
          customer_email: "",
          customer_name: "",
          customer_first_name: "",
          customer_last_name: "",
          card_brand: "visa",
          card_last4: "",
          event_id: "",
          items_json: "",
          created_date: "",
        });
        setParsedItems([]);
        setTotals({ subtotal: 0, serviceCharge: 0, total: 0 });

      } else {
        toast({
          title: "Parcialmente exitoso",
          description: `Movimiento creado (${movementId}) pero error en backend: ${backendResult.error}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error processing Stripe payment:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar el pago de Stripe",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Información de ayuda */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Procesamiento Manual de Pagos de Stripe</p>
              <p className="text-xs">
                Esta herramienta permite procesar pagos exitosos de Stripe que no se registraron automáticamente en Firebase debido a problemas de webhooks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del pago de Stripe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información del Pago de Stripe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment ID */}
            <div className="space-y-2">
              <Label htmlFor="payment_id">Payment ID *</Label>
              <Input
                id="payment_id"
                value={stripeData.payment_id}
                onChange={(e) => handleInputChange("payment_id", e.target.value)}
                placeholder="pi_3RjrnHJwsvKRzMuE1Y6fhvIT"
              />
            </div>

            {/* Charge ID */}
            <div className="space-y-2">
              <Label htmlFor="charge_id">Charge ID</Label>
              <Input
                id="charge_id"
                value={stripeData.charge_id}
                onChange={(e) => handleInputChange("charge_id", e.target.value)}
                placeholder="ch_3RjrnHJwsvKRzMuE1uJpEspb"
              />
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monto (en centavos) *</Label>
              <Input
                id="amount"
                type="number"
                value={stripeData.amount}
                onChange={(e) => handleInputChange("amount", parseInt(e.target.value) || 0)}
                placeholder="188800"
              />
              <div className="text-xs text-gray-500">
                {stripeData.amount > 0 && `= ${formatCurrency(stripeData.amount / 100)}`}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={stripeData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="customer_email">Email del Cliente *</Label>
              <Input
                id="customer_email"
                type="email"
                value={stripeData.customer_email}
                onChange={(e) => handleInputChange("customer_email", e.target.value)}
                placeholder="amairanyguadiana@gmail.com"
              />
            </div>

            {/* Nombre completo */}
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nombre Completo</Label>
              <Input
                id="customer_name"
                value={stripeData.customer_name}
                onChange={(e) => handleInputChange("customer_name", e.target.value)}
                placeholder="Natalia Amairani Guadiana"
              />
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="customer_first_name">Nombre</Label>
              <Input
                id="customer_first_name"
                value={stripeData.customer_first_name}
                onChange={(e) => handleInputChange("customer_first_name", e.target.value)}
                placeholder="Amairani"
              />
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label htmlFor="customer_last_name">Apellido</Label>
              <Input
                id="customer_last_name"
                value={stripeData.customer_last_name}
                onChange={(e) => handleInputChange("customer_last_name", e.target.value)}
                placeholder="Guadiana"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de la tarjeta */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Tarjeta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Marca de tarjeta */}
            <div className="space-y-2">
              <Label htmlFor="card_brand">Marca de Tarjeta</Label>
              <Select value={stripeData.card_brand} onValueChange={(value: any) => handleInputChange("card_brand", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="amex">American Express</SelectItem>
                  <SelectItem value="other">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Últimos 4 dígitos */}
            <div className="space-y-2">
              <Label htmlFor="card_last4">Últimos 4 Dígitos</Label>
              <Input
                id="card_last4"
                value={stripeData.card_last4}
                onChange={(e) => handleInputChange("card_last4", e.target.value)}
                placeholder="8544"
                maxLength={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del evento e items */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Evento e Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Event ID */}
            <div className="space-y-2">
              <Label htmlFor="event_id">Event ID</Label>
              <Input
                id="event_id"
                value={stripeData.event_id}
                onChange={(e) => handleInputChange("event_id", e.target.value)}
                placeholder="Pg8YWJPTZ5pejgYuC9DB"
              />
            </div>

            {/* Items JSON */}
            <div className="space-y-2">
              <Label htmlFor="items_json">Items JSON *</Label>
              <Textarea
                id="items_json"
                value={stripeData.items_json}
                onChange={(e) => handleInputChange("items_json", e.target.value)}
                placeholder='[{"id":"seat_1749502403965_y7epdh2db","type":"seat","zoneName":"VIP 2","price":800,"rowLetter":"E","seatNumber":50}]'
                rows={4}
              />
              <Button onClick={parseItemsJson} variant="outline" size="sm">
                Parsear Items
              </Button>
            </div>

            {/* Fecha de creación */}
            <div className="space-y-2">
              <Label htmlFor="created_date">Fecha de Creación</Label>
              <Input
                id="created_date"
                type="datetime-local"
                value={stripeData.created_date}
                onChange={(e) => handleInputChange("created_date", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview de items parseados */}
      {parsedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Items Parseados ({parsedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parsedItems.map((item, index) => (
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
                <span className="font-semibold">{formatCurrency(item.price)}</span>
              </div>
            ))}

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Subtotal:</span>
                <span className="ml-2 font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div>
                <span className="text-gray-500">Cargo Servicio:</span>
                <span className="ml-2 font-medium">{formatCurrency(totals.serviceCharge)}</span>
              </div>
              <div>
                <span className="text-gray-500">Total:</span>
                <span className="ml-2 font-semibold">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón de procesamiento */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Button
              onClick={processStripePayment}
              disabled={isProcessing || parsedItems.length === 0}
              size="lg"
              className="flex items-center gap-2"
            >
              <Upload className="h-5 w-5" />
              {isProcessing ? "Procesando..." : "Procesar Pago de Stripe"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Proceso que se ejecutará:</p>
              <ul className="space-y-1 text-xs">
                <li>• Se creará un movimiento en Firebase con los datos de Stripe</li>
                <li>• Se generarán los boletos correspondientes</li>
                <li>• Se actualizará el estado de asientos (si aplica)</li>
                <li>• Se marcará el movimiento como pagado</li>
                <li>• Se enviará el email con los boletos PDF al cliente</li>
                <li>• Se conservará la trazabilidad del pago original de Stripe</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 