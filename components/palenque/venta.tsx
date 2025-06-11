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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import {  } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/prueba-boleto/logo"
import { Download } from "lucide-react"
import Link from "next/link"

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

function getTicketHeight() {
  return "240px"
}

function getTicketDescription() {
  return "Diseño optimizado para impresión térmica de boletos - Formato horizontal"
}

export function Venta({ generalTickets, selectedSeats }: VentaProps) {
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null)
  const [cashReceived, setCashReceived] = useState<string>('')
  const [showTerminalModal, setShowTerminalModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showTicketPreviews, setShowTicketPreviews] = useState(false)

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

  // Función para convertir a monocromo
  const convertToMonochrome = async (canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return canvas

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const grayValue = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      const bwValue = grayValue > 128 ? 255 : 0
      data[i] = bwValue
      data[i + 1] = bwValue
      data[i + 2] = bwValue
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  // Función para generar PDF de un boleto
  const generateTicketPDF = async (ticketRef: HTMLDivElement, ticketId: string) => {
    try {
      const { jsPDF } = await import("jspdf")
      const html2canvas = (await import("html2canvas")).default

      if (ticketRef) {
        const canvas = await html2canvas(ticketRef, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          removeContainer: true,
        })

        const finalCanvas = await convertToMonochrome(canvas)
        const imgData = finalCanvas.toDataURL("image/png")

        const pdfWidth = 140
        const pdfHeight = 50

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: [pdfWidth, pdfHeight],
          compress: true,
        })

        pdf.setFillColor(255, 255, 255)
        pdf.rect(0, 0, pdfWidth, pdfHeight, "F")
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST")
        pdf.save(`boleto-${ticketId}.pdf`)

        toast({
          title: "PDF generado",
          description: "El boleto se ha descargado como PDF.",
        })
      }
    } catch (error) {
      console.error("Error generando PDF:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Intenta nuevamente.",
        variant: "destructive",
      })
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
          setShowTicketPreviews(true)
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

  function borderLine() {
    return (
      <div className="w-12 h-[1px] bg-black mt-1"></div>
    )
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

      {/* Previews de Boletos */}
      {showTicketPreviews && (
        <div className="mt-8 space-y-8">
          <h2 className="text-2xl font-bold">Boletos Generados</h2>
          
          {/* Boletos Generales */}
          {generalTickets.map((ticket) => 
            Array.from({ length: ticket.quantity }).map((_, index) => {
              const ticketId = `${ticket.id}-${index + 1}`
              return (
                <Card key={ticketId}>
                  <CardHeader>
                    <CardTitle>
                      Vista Previa del Boleto (140mm x 50mm)
                    </CardTitle>
                    <CardDescription>{getTicketDescription()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 p-8 rounded-lg flex justify-center">
                      <div
                        id={`ticket-${ticketId}`}
                        className="bg-white"
                        style={{
                          width: "100%",
                          maxWidth: "600px",
                          height: getTicketHeight(),
                          display: "flex",
                          overflow: "hidden",
                        }}
                      >
                        {/* Contenido principal del boleto */}
                        <div className="flex-grow flex relative">
                          {/* Contenido central */}
                          <div className="flex-grow p-4 flex flex-col">
                            {/* Título del evento y recinto */}
                            <div className="text-3xl font-bold mb-2">
                              GLORIA TREVI
                              <div className="text-2xl">ARENA POTOSI</div>
                            </div>

                            {/* Fecha, hora y ciudad */}
                            <div className="text-md mb-10 text-[12.7px]">
                              29 DE MARZO 2024
                              <div>21:00 hrs.</div>
                              <div>SAN LUIS POTOSÍ, SLP</div>
                            </div>

                            {/* Detalles del boleto con separadores */}
                            <div className="flex items-center space-x-[13.5px]">
                              <div className="text-center">
                                <div className="text-[9.5px]">PRECIO</div>
                                <div className="text-base">$ {ticket.price}</div>
                              </div>
                              <div className="h-8 w-px bg-black"></div>
                              <div className="text-center">
                                <div className="text-[9.5px]">TIPO</div>
                                <div className="text-base">GENERAL</div>
                              </div>
                              <div className="h-8 w-px bg-black"></div>
                              <div className="text-center">
                                <div className="text-[9.5px]">ORDEN</div>
                                <div className="text-base">{ticketId.slice(8, 14)}</div>
                              </div>
                              <div className="h-8 w-px bg-black"></div>
                              <div className="text-center">
                                <div className="text-[9.5px]">SECCIÓN</div>
                                <div className="text-base">{ticket.zoneName}</div>
                              </div>
                            </div>

                            {/* Logo */}
                            <div className="absolute top-32 right-36 w-24">
                              <Logo />
                            </div>
                          </div>

                          {/* Columna derecha */}
                          <div className="w-32 border-l border-black p-2">
                            <div className="space-y-2 text-center">
                              <div className="flex flex-col items-center">
                                <div className="text-xs font-[8px]">PRECIO</div>
                                <div className="text-sm">$ {ticket.price}</div>
                                {borderLine()}
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="text-xs font-[8px]">TIPO</div>
                                <div className="text-sm">GENERAL</div>
                                {borderLine()}
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="text-xs font-[8px]">ORDEN</div>
                                <div className="text-sm">{ticketId.slice(8, 14)}</div>
                                {borderLine()}
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="text-xs font-[8px]">SECCIÓN</div>
                                <div className="text-sm">{ticket.zoneName}</div>
                                {borderLine()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const ticketRef = document.getElementById(`ticket-${ticketId}`)
                          if (ticketRef instanceof HTMLDivElement) {
                            generateTicketPDF(ticketRef, ticketId)
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* Boletos Numerados */}
          {selectedSeats.map((seat) => {
            const ticketId = seat.id
            return (
              <Card key={ticketId}>
                <CardHeader>
                  <CardTitle>
                    Vista Previa del Boleto (140mm x 50mm)
                  </CardTitle>
                  <CardDescription>{getTicketDescription()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-8 rounded-lg flex justify-center">
                    <div
                      id={`ticket-${ticketId}`}
                      className="bg-white"
                      style={{
                        width: "100%",
                        maxWidth: "600px",
                        height: getTicketHeight(),
                        display: "flex",
                        overflow: "hidden",
                      }}
                    >
                      {/* Contenido principal del boleto */}
                      <div className="flex-grow flex relative">
                        {/* Contenido central */}
                        <div className="flex-grow p-4 flex flex-col">
                          {/* Título del evento y recinto */}
                          <div className="text-3xl font-bold mb-2">
                            GLORIA TREVI
                            <div className="text-2xl">ARENA POTOSI</div>
                          </div>

                          {/* Fecha, hora y ciudad */}
                          <div className="text-md mb-10 text-[12.7px]">
                            29 DE MARZO 2024
                            <div>21:00 hrs.</div>
                            <div>SAN LUIS POTOSÍ, SLP</div>
                          </div>

                          {/* Detalles del boleto con separadores */}
                          <div className="flex items-center space-x-[13.5px]">
                            <div className="text-center">
                              <div className="text-[9.5px]">PRECIO</div>
                              <div className="text-base">$ {seat.price}</div>
                            </div>
                            <div className="h-8 w-px bg-black"></div>
                            <div className="text-center">
                              <div className="text-[9.5px]">TIPO</div>
                              <div className="text-base">NUMERADO</div>
                            </div>
                            <div className="h-8 w-px bg-black"></div>
                            <div className="text-center">
                              <div className="text-[9.5px]">ORDEN</div>
                              <div className="text-base">{seat.id.slice(8, 14)}</div>
                            </div>
                            <div className="h-8 w-px bg-black"></div>
                            <div className="text-center">
                              <div className="text-[9.5px]">SECCIÓN</div>
                              <div className="text-base">{seat.zoneName}</div>
                            </div>
                            <div className="h-8 w-px bg-black"></div>
                            <div className="text-center">
                              <div className="text-[9.5px]">ASIENTO</div>
                              <div className="text-base">{seat.seatNumber}</div>
                            </div>
                          </div>

                          {/* Logo */}
                          <div className="absolute top-32 right-36 w-24">
                            <Logo />
                          </div>
                        </div>

                        {/* Columna derecha */}
                        <div className="w-32 border-l border-black p-2">
                          <div className="space-y-2 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-xs font-[8px]">PRECIO</div>
                              <div className="text-sm">$ {seat.price}</div>
                              {borderLine()}
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="text-xs font-[8px]">TIPO</div>
                              <div className="text-sm">NUMERADO</div>
                              {borderLine()}
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="text-xs font-[8px] ">ORDEN</div>
                              <div className="text-sm text-base">{seat.id.slice(8, 14)}</div>
                              {borderLine()}
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="text-xs font-[8px]">SECCIÓN</div>
                              <div className="text-sm">{seat.zoneName}</div>
                              {borderLine()}
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="text-xs font-[8px]">ASIENTO</div>
                              <div className="text-sm">{seat.seatNumber}</div>
                              {borderLine()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const ticketRef = document.getElementById(`ticket-${ticketId}`)
                        if (ticketRef instanceof HTMLDivElement) {
                          generateTicketPDF(ticketRef, ticketId)
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <div className="flex justify-end mt-6">
            <Link
              href="/mapas-asientos"
              className="bg-[#325CE5] text-white hover:bg-[#2849B3] px-4 py-2 rounded-md"
            >
              Finalizar Venta
            </Link>
          </div>
        </div> 

      )}

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
