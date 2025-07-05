"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {} from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";
import { Logo } from "@/components/prueba-boleto/logo";
import { Download } from "lucide-react";
import Link from "next/link";
import { storage } from "@/lib/firebase/config";
import { ref, getDownloadURL, uploadString } from "firebase/storage";
import { dazzleUnicase, gontserrat } from "@/lib/fonts";
import { createSale, Movement, Ticket } from "@/lib/firebase/transactions";
import Stars from "./stars";
import SeparationLines from "./separationLines";

interface VenueConfigSeat {
  id: string;
  x: number;
  y: number;
  zone: string;
  zoneName: string;
  color: string;
  price: number;
  status: string;
  rowLetter: string;
  seatNumber: number;
  lineId?: string;
  lineIndex?: number;
}

interface VenueConfig {
  venue: {
    name: string;
    type: string;
    capacity: number;
    layout: string;
  };
  ruedo: {
    centerX: number;
    centerY: number;
    radius: number;
  };
  createdSeats: VenueConfigSeat[];
  exportDate: string;
}

interface VentaProps {
  generalTickets: {
    id: string;
    zoneName: string;
    price: number;
    quantity: number;
  }[];
  selectedSeats: {
    id: string;
    zoneName: string;
    rowLetter: string;
    seatNumber: number;
    price: number;
  }[];
}

function getTicketHeight() {
  return "240px";
}

function getTicketDescription() {
  return "Diseño optimizado para impresión térmica de boletos - Formato horizontal";
}

export function Venta({ generalTickets, selectedSeats }: VentaProps) {
  console.log("generalTickets", generalTickets);
  console.log("selectedSeats", selectedSeats);
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "courtesy" | null
  >(null);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showPrintConfirmationModal, setShowPrintConfirmationModal] =
    useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicketPreviews, setShowTicketPreviews] = useState(false);

  // Calcular totales
  const subtotal =
    paymentMethod === "courtesy"
      ? 0
      : generalTickets.reduce(
          (sum, ticket) => sum + ticket.price * ticket.quantity,
          0,
        ) + selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceCharge = paymentMethod === "courtesy" ? 0 : subtotal * 0.18; // 18% cargo por servicio
  const total = subtotal + serviceCharge;

  // Calcular cambio
  const change = cashReceived ? parseFloat(cashReceived) - total : 0;

  const handlePaymentSuccess = () => {
    // Solo mostramos el modal de confirmación si no es cortesía
    if (paymentMethod !== "courtesy") {
      setShowConfirmationModal(true);
    } else {
      handleConfirmSale(true);
    }
  };

  const updateSeatsStatus = async () => {
    try {
      // First, get the current venue configuration from Firebase Storage
      const fileRef = ref(storage, "Seats_data_last_actualizado.json");
      const downloadURL = await getDownloadURL(fileRef);
      const response = await fetch(downloadURL);
      const venueConfig: VenueConfig = await response.json();

      // Update the seats status in the venue configuration
      const updatedSeats = venueConfig.createdSeats.map(
        (seat: VenueConfigSeat) => {
          const selectedSeat = selectedSeats.find((s) => s.id === seat.id);
          if (selectedSeat) {
            return { ...seat, status: "occupied" };
          }
          return seat;
        },
      );

      // Create updated venue configuration
      const updatedVenueConfig: VenueConfig = {
        ...venueConfig,
        createdSeats: updatedSeats,
      };

      // Convert the updated configuration to a JSON string
      const jsonString = JSON.stringify(updatedVenueConfig);

      // Upload the updated JSON back to Firebase Storage
      await uploadString(fileRef, jsonString, "raw", {
        contentType: "application/json",
      });

      return true; // Return true if the operation succeeds
    } catch (error) {
      console.error("Error al actualizar los asientos:", error);
      return false;
    }
  };

  // Función para convertir a monocromo
  const convertToMonochrome = async (
    canvas: HTMLCanvasElement,
  ): Promise<HTMLCanvasElement> => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const grayValue =
        0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const bwValue = grayValue > 128 ? 255 : 0;
      data[i] = bwValue;
      data[i + 1] = bwValue;
      data[i + 2] = bwValue;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  // Función para generar PDF con todos los boletos
  const generateAllTicketsPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Crear nuevo PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [140, 50],
        compress: true,
      });

      // Función para procesar cada boleto
      const processTicket = async (ticketRef: HTMLDivElement) => {
        const canvas = await html2canvas(ticketRef, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          removeContainer: true,
        });

        const finalCanvas = await convertToMonochrome(canvas);
        return finalCanvas.toDataURL("image/png");
      };

      let isFirstPage = true;

      // Procesar boletos generales
      for (const ticket of generalTickets) {
        for (let i = 0; i < ticket.quantity; i++) {
          const ticketId = `${ticket.id}-${i + 1}`;
          const ticketRef = document.getElementById(`ticket-${ticketId}`);
          if (ticketRef instanceof HTMLDivElement) {
            if (!isFirstPage) {
              pdf.addPage([140, 50], "landscape");
            }
            const imgData = await processTicket(ticketRef);
            pdf.addImage(imgData, "PNG", 0, 0, 140, 50, undefined, "FAST");
            isFirstPage = false;
          }
        }
      }

      // Procesar boletos numerados
      for (const seat of selectedSeats) {
        const ticketRef = document.getElementById(`ticket-${seat.id}`);
        if (ticketRef instanceof HTMLDivElement) {
          if (!isFirstPage) {
            pdf.addPage([140, 50], "landscape");
          }
          const imgData = await processTicket(ticketRef);
          pdf.addImage(imgData, "PNG", 0, 0, 140, 50, undefined, "FAST");
          isFirstPage = false;
        }
      }

      // Guardar PDF
      pdf.save(`boletos-${Date.now()}.pdf`);

      toast({
        title: "PDF generado",
        description: `Se han generado ${generalTickets.reduce((sum, t) => sum + t.quantity, 0) + selectedSeats.length} boletos en el PDF.`,
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmSale = async (confirmed: boolean) => {
    if (confirmed) {
      setIsProcessing(true);
      try {
        // First update seats status in the venue configuration
        const success = await updateSeatsStatus();
        if (success) {
          // Create the movement data
          const movementData: Omit<Movement, "id"> = {
            total: paymentMethod === "courtesy" ? 0 : total,
            subtotal: paymentMethod === "courtesy" ? 0 : subtotal,
            cargo_servicio: paymentMethod === "courtesy" ? 0 : serviceCharge,
            fecha: new Date(),
            tipo_pago:
              paymentMethod === "courtesy"
                ? "cortesia"
                : paymentMethod === "card"
                  ? "tarjeta"
                  : "efectivo",
          };

          // Prepare tickets data
          const ticketsData: Array<{
            ticket: Omit<Ticket, "id">;
            precio: number;
          }> = [
            // Add general tickets
            ...generalTickets.flatMap((ticket) =>
              Array(ticket.quantity)
                .fill(null)
                .map(() => ({
                  ticket: {
                    fila: "GENERAL",
                    asiento: 0,
                    zona: ticket.zoneName,
                  },
                  precio: paymentMethod === "courtesy" ? 0 : ticket.price,
                })),
            ),
            // Add numbered seats
            ...selectedSeats.map((seat) => ({
              ticket: {
                fila: seat.rowLetter,
                asiento: seat.seatNumber,
                zona: seat.zoneName,
              },
              precio: paymentMethod === "courtesy" ? 0 : seat.price,
            })),
          ];

          // Create the sale in Firebase
          const movementId = await createSale(movementData, ticketsData);

          if (movementId) {
            toast({
              title: "Venta exitosa",
              description: "La venta ha sido registrada correctamente.",
            });
            setShowTicketPreviews(true);
          } else {
            throw new Error("No se pudo crear el movimiento");
          }
        } else {
          toast({
            title: "Error en la venta",
            description: "No se pudieron actualizar los asientos.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error al procesar la venta:", error);
        toast({
          title: "Error en la venta",
          description: "Ocurrió un error al procesar la venta.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
    setShowConfirmationModal(false);
    setShowTerminalModal(false);
    // Solo reseteamos el método de pago si no es cortesía
    if (paymentMethod !== "courtesy") {
      setPaymentMethod(null);
    }
  };

  return (
    <div
      className={`max-w-4xl mx-auto p-6 ${dazzleUnicase.variable} ${gontserrat.variable}`}
    >
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
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-blue-100"
                >
                  <div>
                    <div className="font-medium font-dazzleUnicase">
                      {ticket.zoneName}
                    </div>
                    <div className="text-gray-600 font-gontserrat">
                      $
                      {paymentMethod === "courtesy"
                        ? "0.00"
                        : ticket.price.toFixed(2)}{" "}
                      MXN x {ticket.quantity}
                    </div>
                  </div>
                  <div className="font-semibold font-gontserrat">
                    $
                    {paymentMethod === "courtesy"
                      ? "0.00"
                      : (ticket.price * ticket.quantity).toFixed(2)}{" "}
                    MXN
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
                <div
                  key={seat.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-[#325CE5] text-white"
                >
                  <div>
                    <div className="font-medium">
                      {seat.zoneName} - Fila {seat.rowLetter}, Asiento{" "}
                      {seat.seatNumber}
                    </div>
                    <div className="opacity-90">
                      $
                      {paymentMethod === "courtesy"
                        ? "0.00"
                        : seat.price.toFixed(2)}{" "}
                      MXN
                    </div>
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)} MXN</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cargo por servicio (18%):</span>
              <span className="font-medium">
                ${serviceCharge.toFixed(2)} MXN
              </span>
            </div>
            <div className="h-px bg-gray-200"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold">${total.toFixed(2)} MXN</span>
            </div>
            {paymentMethod === "courtesy" && (
              <div className="mt-2 text-center text-green-600 font-semibold">
                Boletos de Cortesía - Sin Cargo
              </div>
            )}
          </div>

          {!paymentMethod && (
            <div className="flex gap-4 mt-6">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setPaymentMethod("cash")}
                disabled={isProcessing}
              >
                Pago en Efectivo
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setShowTerminalModal(true);
                }}
                disabled={isProcessing}
              >
                Pago con Tarjeta
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setPaymentMethod("courtesy");
                  handlePaymentSuccess();
                }}
                disabled={isProcessing}
              >
                Cortesía
              </Button>
            </div>
          )}

          {paymentMethod === "cash" && (
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
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Boletos Generados</h2>
            <Button variant="outline" onClick={generateAllTicketsPDF}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Todos los Boletos
            </Button>
          </div>

          {/* Boletos Generales */}
          {generalTickets.map((ticket) =>
            Array.from({ length: ticket.quantity }).map((_, index) => {
              const ticketId = `${ticket.id}-${index + 1}`;
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
                        <div
                          className={`flex w-full ${dazzleUnicase.variable} ${gontserrat.variable}`}
                        >
                          {/* Columna izquierda para boletos numerados */}
                          <div className="w-24 p-3 font-gontserrat">
                            <div className="space-y-2 text-center">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`text-xs font-[5px] ${gontserrat.className}`}
                                >
                                  PRECIO
                                </div>
                                <div
                                  className={`text-[11px] ${gontserrat.className}`}
                                >
                                  ${" "}
                                  {paymentMethod === "courtesy"
                                    ? "0.00"
                                    : ticket.price}
                                </div>
                                <div className="py-1">
                                  <SeparationLines />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`text-xs font-[5px] ${gontserrat.className}`}
                                >
                                  TIPO
                                </div>
                                <div
                                  className={`text-[11px] ${gontserrat.className}`}
                                >
                                  {paymentMethod === "courtesy"
                                    ? "CORTESIA"
                                    : "NUMERADO"}
                                </div>
                                <div className="py-1">
                                  <SeparationLines />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`text-xs font-[5px] ${gontserrat.className}`}
                                >
                                  ORDEN
                                </div>
                                <div
                                  className={`text-[11px] ${gontserrat.className}`}
                                >
                                  {ticketId.slice(-6)}
                                </div>
                                <div className="py-1">
                                  <SeparationLines />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`text-xs font-[5px] ${gontserrat.className}`}
                                >
                                  SECCIÓN
                                </div>
                                <div
                                  className={`text-[11px] ${gontserrat.className}`}
                                >
                                  {ticket.zoneName}
                                </div>
                                <div className="py-1">
                                  <SeparationLines />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <Stars />
                          </div>

                          {/* Contenido central */}
                          <div className="flex-grow p-[0.6rem] flex flex-col relative">
                            {/* Título del evento y recinto */}
                            <div
                              className={`text-2xl font-bold mb-2 ${dazzleUnicase.className}`}
                            >
                              ACORDEONAZO
                              <div
                                className={`text-[14px] ${dazzleUnicase.className}`}
                              >
                                CENTRO DE ESPECTACULOS
                              </div>
                              <div
                                className={`text-[14px] ${dazzleUnicase.className} mt-[-12px]`}
                              >
                                VICTORIA
                              </div>
                            </div>

                            {/* Fecha, hora y ciudad */}
                            <div
                              className={`text-md mb-6 text-[11.7px] ${gontserrat.className}`}
                            >
                              19 DE JULIO 2025
                              <div className={`${gontserrat.className}`}>
                                20:00 hrs.
                              </div>
                              <div className={`${gontserrat.className}`}>
                                CD. VICTORIA, TAMPS
                              </div>
                            </div>

                            {/* Detalles del boleto con separadores */}
                            <div
                              className={`flex items-center space-x-[8px] ${gontserrat.className}`}
                            >
                              <div className="text-center">
                                <div
                                  className={`text-[12px] ${gontserrat.className}`}
                                >
                                  PRECIO
                                </div>
                                <div
                                  className={`text-sm ${gontserrat.className}`}
                                >
                                  ${" "}
                                  {paymentMethod === "courtesy"
                                    ? "0.00"
                                    : ticket.price}
                                </div>
                              </div>
                              <div className="h-8 w-px bg-black"></div>
                              <div className="text-center">
                                <div
                                  className={`text-[12px] ${gontserrat.className}`}
                                >
                                  TIPO
                                </div>
                                <div
                                  className={`text-sm ${gontserrat.className}`}
                                >
                                  {paymentMethod === "courtesy"
                                    ? "CORTESIA"
                                    : "NUMERADO"}
                                </div>
                              </div>
                              <div className="h-8 w-px bg-black"></div>
                              <div className="text-center">
                                <div
                                  className={`text-[12px] ${gontserrat.className}`}
                                >
                                  ORDEN
                                </div>
                                <div
                                  className={`text-sm ${gontserrat.className}`}
                                >
                                  {ticketId.slice(-6)}
                                </div>
                              </div>
                              <div className="h-8 w-px bg-black"></div>
                              <div className="text-center">
                                <div
                                  className={`text-[12px] ${gontserrat.className}`}
                                >
                                  SECCIÓN
                                </div>
                                <div
                                  className={`text-sm ${gontserrat.className}`}
                                >
                                  {ticket.zoneName}
                                </div>
                              </div>
                            </div>

                            {/* Logo */}
                            <div className="absolute top-[132px] right-6 w-24">
                              <Logo />
                            </div>
                          </div>

                          <div className="flex items-center">
                            <Stars />
                          </div>

                          {/* Columna derecha para boletos numerados */}
                          <div className="w-24 p-3 font-gontserrat">
                            <div className="space-y-2 text-center">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`text-xs font-[5px] ${gontserrat.className}`}
                                >
                                  PRECIO
                                </div>
                                <div
                                  className={`text-[11px] ${gontserrat.className}`}
                                >
                                  ${" "}
                                  {paymentMethod === "courtesy"
                                    ? "0.00"
                                    : ticket.price}
                                </div>
                                <div className="py-1">
                                  <SeparationLines />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`text-xs font-[5px] ${gontserrat.className}`}
                                >
                                  TIPO
                                </div>
                                <div
                                  className={`text-[11px] ${gontserrat.className}`}
                                >
                                  {paymentMethod === "courtesy"
                                    ? "CORTESIA"
                                    : "NUMERADO"}
                                </div>
                                <div className="py-1">
                                  <SeparationLines />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`text-xs font-[5px] ${gontserrat.className}`}
                                >
                                  ORDEN
                                </div>
                                <div
                                  className={`text-[11px] ${gontserrat.className}`}
                                >
                                  {ticketId.slice(-6)}
                                </div>
                                <div className="py-1">
                                  <SeparationLines />
                                </div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div
                                  className={`text-xs font-[5px] ${gontserrat.className}`}
                                >
                                  SECCIÓN
                                </div>
                                <div
                                  className={`text-[11px] ${gontserrat.className}`}
                                >
                                  {ticket.zoneName}
                                </div>
                                <div className="py-1">
                                  <SeparationLines />
                                </div>
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
                          const ticketRef = document.getElementById(
                            `ticket-${ticketId}`,
                          );
                          if (ticketRef instanceof HTMLDivElement) {
                            generateAllTicketsPDF();
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }),
          )}

          {/* Boletos Numerados */}
          {selectedSeats.map((seat) => {
            const ticketId = seat.id;
            return (
              <Card key={ticketId}>
                <CardHeader>
                  <CardTitle>Vista Previa del Boleto (140mm x 50mm)</CardTitle>
                  <CardDescription>{getTicketDescription()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-8 rounded-lg flex justify-center">
                    <div
                      id={`ticket-${seat.id}`}
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
                      <div
                        className={`flex w-full ${dazzleUnicase.variable} ${gontserrat.variable}`}
                      >
                        {/* Columna izquierda para boletos numerados */}
                        <div className="w-24 p-[5px] font-gontserrat">
                          <div className="space-y-0 text-center">
                            <div className="flex flex-col items-center">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                PRECIO
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                ${" "}
                                {paymentMethod === "courtesy"
                                  ? "0.00"
                                  : seat.price}
                              </div>
                              <div className="py-1">
                                <SeparationLines />
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                TIPO
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                {paymentMethod === "courtesy"
                                  ? "CORTESIA"
                                  : "NUMERADO"}
                              </div>
                              <div className="py-1">
                                <SeparationLines />
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                ORDEN
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                {seat.id.slice(8, 14)}
                              </div>
                              <div className="py-1">
                                <SeparationLines />
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                SECCIÓN
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                {seat.zoneName}
                              </div>
                              <div className="py-1">
                                <SeparationLines />
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-0px">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                ASIENTO
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                {seat.rowLetter}
                                {seat.seatNumber}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Stars />
                        </div>

                        {/* Contenido central */}
                        <div className="flex-grow p-[0.6rem] flex flex-col relative">
                          {/* Título del evento y recinto */}
                          <div
                            className={`text-2xl font-bold mb-2 ${dazzleUnicase.className}`}
                          >
                            ACORDEONAZO
                            <div
                              className={`text-[14px] ${dazzleUnicase.className}`}
                            >
                              CENTRO DE ESPECTACULOS
                            </div>
                            <div
                              className={`text-[14px] ${dazzleUnicase.className} mt-[-12px]`}
                            >
                              VICTORIA
                            </div>
                          </div>

                          {/* Fecha, hora y ciudad */}
                          <div
                            className={`text-md mb-6 text-[11.7px] ${gontserrat.className}`}
                          >
                            19 DE JULIO 2025
                            <div className={`${gontserrat.className}`}>
                              20:00 hrs.
                            </div>
                            <div className={`${gontserrat.className}`}>
                              CD. VICTORIA, TAMPS
                            </div>
                          </div>

                          {/* Detalles del boleto con separadores */}
                          <div
                            className={`flex items-center space-x-[8px] ${gontserrat.className}`}
                          >
                            <div className="text-center">
                              <div
                                className={`text-[12px] ${gontserrat.className}`}
                              >
                                PRECIO
                              </div>
                              <div
                                className={`text-sm ${gontserrat.className}`}
                              >
                                ${" "}
                                {paymentMethod === "courtesy"
                                  ? "0.00"
                                  : seat.price}
                              </div>
                            </div>
                            <div className="h-8 w-px bg-black"></div>
                            <div className="text-center">
                              <div
                                className={`text-[12px] ${gontserrat.className}`}
                              >
                                TIPO
                              </div>
                              <div
                                className={`text-sm ${gontserrat.className}`}
                              >
                                {paymentMethod === "courtesy"
                                  ? "CORTESIA"
                                  : "NUMERADO"}
                              </div>
                            </div>
                            <div className="h-8 w-px bg-black"></div>
                            <div className="text-center">
                              <div
                                className={`text-[12px] ${gontserrat.className}`}
                              >
                                ORDEN
                              </div>
                              <div
                                className={`text-sm ${gontserrat.className}`}
                              >
                                {seat.id.slice(8, 14)}
                              </div>
                            </div>
                            <div className="h-8 w-px bg-black"></div>
                            <div className="text-center">
                              <div
                                className={`text-[12px] ${gontserrat.className}`}
                              >
                                SECCIÓN
                              </div>
                              <div
                                className={`text-sm ${gontserrat.className}`}
                              >
                                {seat.zoneName}
                              </div>
                            </div>
                            <div className="h-8 w-px bg-black"></div>
                            <div className="text-center">
                              <div
                                className={`text-[12px] ${gontserrat.className}`}
                              >
                                ASIENTO
                              </div>
                              <div
                                className={`text-sm ${gontserrat.className}`}
                              >
                                {seat.rowLetter}
                                {seat.seatNumber}
                              </div>
                            </div>
                          </div>

                          {/* Logo */}
                          <div className="absolute top-[132px] right-6 w-24">
                            <Logo />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Stars />
                        </div>

                        {/* Columna derecha para boletos numerados */}
                        <div className="w-24 p-2 font-gontserrat">
                          <div className="space-y-0 text-center">
                            <div className="flex flex-col items-center">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                PRECIO
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                ${" "}
                                {paymentMethod === "courtesy"
                                  ? "0.00"
                                  : seat.price}
                              </div>
                              <div className="py-1">
                                <SeparationLines />
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                TIPO
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                {paymentMethod === "courtesy"
                                  ? "CORTESIA"
                                  : "NUMERADO"}
                              </div>
                              <div className="py-1">
                                <SeparationLines />
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                ORDEN
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                {seat.id.slice(8, 14)}
                              </div>
                              <div className="py-1">
                                <SeparationLines />
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                SECCIÓN
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                {seat.zoneName}
                              </div>
                              <div className="py-1">
                                <SeparationLines />
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div
                                className={`text-xs font-[5px] ${gontserrat.className}`}
                              >
                                ASIENTO
                              </div>
                              <div
                                className={`text-[11px] ${gontserrat.className}`}
                              >
                                {seat.rowLetter}
                                {seat.seatNumber}
                              </div>
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
                        const ticketRef = document.getElementById(
                          `ticket-${seat.id}`,
                        );
                        if (ticketRef instanceof HTMLDivElement) {
                          generateAllTicketsPDF();
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex justify-end mt-6">
            <Button
              className="bg-[#325CE5] text-white hover:bg-[#2849B3]"
              onClick={() => setShowPrintConfirmationModal(true)}
            >
              Finalizar Venta
            </Button>
          </div>
        </div>
      )}

      {/* Modal para Pago con Terminal */}
      <Dialog
        open={showTerminalModal}
        onOpenChange={(open) => {
          setShowTerminalModal(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago con Terminal</DialogTitle>
            <DialogDescription>
              Por favor, realice el cobro en la terminal por ${total.toFixed(2)}{" "}
              MXN
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowTerminalModal(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setPaymentMethod("card");
                handlePaymentSuccess();
              }}
              disabled={isProcessing}
            >
              El pago en terminal fue exitoso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación */}
      <Dialog
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
      >
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

      {/* Modal de Confirmación de Impresión */}
      <Dialog
        open={showPrintConfirmationModal}
        onOpenChange={setShowPrintConfirmationModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Impresión</DialogTitle>
            <DialogDescription>
              ¿Se han impreso todos los boletos correctamente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPrintConfirmationModal(false);
                toast({
                  title: "Impresión pendiente",
                  description:
                    "Por favor, asegúrate de imprimir todos los boletos antes de finalizar.",
                  variant: "destructive",
                });
              }}
            >
              No
            </Button>
            <Button
              onClick={() => {
                setShowPrintConfirmationModal(false);
                window.location.href = "/dashboard/mapas-asientos";
              }}
            >
              Sí, todo correcto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
