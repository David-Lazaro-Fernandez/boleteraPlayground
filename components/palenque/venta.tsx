import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"

interface VentaProps {
  generalTickets: {
    id: string
    zoneName: string
    price: number
    quantity: number
  }[]
  selectedSeats: {
    id: string
    zoneName: string
    rowLetter: string
    seatNumber: number
    price: number
  }[]
}

export function Venta({ generalTickets, selectedSeats }: VentaProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null)
  const [cashReceived, setCashReceived] = useState<string>('')
  const [showTerminalModal, setShowTerminalModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Calcular totales
  const generalTotal = generalTickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0)
  const seatsTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
  const total = generalTotal + seatsTotal

  // Calcular cambio
  const change = cashReceived ? parseFloat(cashReceived) - total : 0

  const handlePaymentSuccess = () => {
    setShowConfirmationModal(true)
  }

  const updateSeatsStatus = async () => {
    try {
      const response = await fetch('/api/seats/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedSeats }),
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error al actualizar los asientos:', error)
      return false
    }
  }

  const handleConfirmSale = async (confirmed: boolean) => {
    if (confirmed) {
      setIsProcessing(true)
      try {
        const success = await updateSeatsStatus()
        if (success) {
          toast({
            title: "Venta exitosa",
            description: "Los asientos han sido actualizados correctamente.",
          })
          // Redirigir al mapa de asientos después de un breve delay
          setTimeout(() => {
            router.push('/')
            router.refresh() // Esto forzará una recarga de los datos
          }, 2000)
        } else {
          toast({
            title: "Error en la venta",
            description: "No se pudieron actualizar los asientos.",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error en la venta",
          description: "Ocurrió un error al procesar la venta.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }
    setShowConfirmationModal(false)
    setShowTerminalModal(false)
    setPaymentMethod(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Detalles de la Venta</h2>

      {/* Boletos Generales */}
      {generalTickets.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Boletos Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generalTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border bg-blue-100">
                  <div>
                    <div className="font-medium">{ticket.zoneName}</div>
                    <div className="text-gray-600">
                      ${ticket.price.toFixed(2)} MXN x {ticket.quantity}
                    </div>
                  </div>
                  <div className="font-semibold">
                    ${(ticket.price * ticket.quantity).toFixed(2)} MXN
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asientos Seleccionados */}
      {selectedSeats.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Asientos Seleccionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedSeats.map((seat) => (
                <div key={seat.id} className="flex items-center justify-between p-3 rounded-lg border bg-[#325CE5] text-white">
                  <div>
                    <div className="font-medium">
                      {seat.zoneName} - Fila {seat.rowLetter}, Asiento {seat.seatNumber}
                    </div>
                    <div className="opacity-90">${seat.price.toFixed(2)} MXN</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total y Forma de Pago */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Total a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-6">${total.toFixed(2)} MXN</div>

          {!paymentMethod && (
            <div className="flex gap-4">
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => setPaymentMethod('cash')}
                disabled={isProcessing}
              >
                Pago en Efectivo
              </Button>
              <Button 
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setPaymentMethod('card')
                  setShowTerminalModal(true)
                }}
                disabled={isProcessing}
              >
                Pago con Tarjeta
              </Button>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Efectivo Recibido
                </label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Ingrese el monto recibido"
                  disabled={isProcessing}
                />
              </div>
              {cashReceived && parseFloat(cashReceived) >= total && (
                <div>
                  <div className="text-lg font-semibold mb-2">
                    Cambio a entregar: ${change.toFixed(2)} MXN
                  </div>
                  <Button 
                    onClick={() => handlePaymentSuccess()}
                    disabled={isProcessing}
                  >
                    Confirmar Pago
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Pago con Terminal */}
      <Dialog open={showTerminalModal} onOpenChange={setShowTerminalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago con Terminal</DialogTitle>
            <DialogDescription>
              Por favor, realice el cobro en la terminal por ${total.toFixed(2)} MXN
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => handlePaymentSuccess()}
              disabled={isProcessing}
            >
              El pago en terminal fue exitoso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Venta</DialogTitle>
            <DialogDescription>
              ¿La venta fue realizada con éxito?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleConfirmSale(false)}
              disabled={isProcessing}
            >
              No
            </Button>
            <Button 
              onClick={() => handleConfirmSale(true)}
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : "Sí"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 