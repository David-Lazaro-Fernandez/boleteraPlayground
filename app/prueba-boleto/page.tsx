"use client"

import { useState, useRef } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Printer, Download, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo} from "@/components/prueba-boleto/logo"
import  Stars  from "@/components/palenque/stars"
import { dazzleUnicase, gontserrat } from "@/lib/fonts"
import SeparationLines from '@/components/palenque/separationLines'
interface TicketData {
  seccion: string
  orden: string
  precio: string
  tipo: string
  fila: string
  asiento: string
  evento: string
  fecha: string
  hora: string
  lugar: string
  ciudad: string
}

interface PrintConfig {
  paperSize: string
  scale: string
  orientation: string
  margins: string
  monocromo: boolean
  dpi: string
}

const ZONAS = [
  { value: "GENERAL", label: "General" },
  { value: "ORO-1", label: "Oro 1" },
  { value: "ORO-2", label: "Oro 2" },
  { value: "ORO-3", label: "Oro 3" },
  { value: "ORO-4", label: "Oro 4" },
  { value: "ORO-5", label: "Oro 5" },
  { value: "ORO-6", label: "Oro 6" },
  { value: "ORO-7", label: "Oro 7" },
  { value: "ORO-8", label: "Oro 8" },
  { value: "VIP-1", label: "VIP 1" },
  { value: "VIP-2", label: "VIP 2" },
  { value: "VIP-3", label: "VIP 3" },
  { value: "VIP-4", label: "VIP 4" },
]

const TIPOS_BOLETO = [
  { value: "GENERAL", label: "General" },
  { value: "NUMERADO", label: "Numerado" },
  { value: "CORTESIA", label: "Cortesía" },
]

function generateRandomOrder() {
  // Generate a random 8-character alphanumeric string
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function borderLine() {
  return (
    <div className="w-12 h-[1px] bg-black mt-1"></div>
  )
}

const getPrecioByZona = (zona: string): string => {
  if (zona.startsWith('ORO')) return '600'
  if (zona.startsWith('VIP')) return '800'
  return '300' // GENERAL
}

export default function PruebaBoletoPage() {
  const { toast } = useToast()
  const ticketRef = useRef<HTMLDivElement>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'courtesy' | null>(null)
  const [ticketData, setTicketData] = useState<TicketData>({
    seccion: "GENERAL",
    orden: generateRandomOrder(),
    precio: "300", // Precio inicial para GENERAL
    tipo: "NUMERADO",
    fila: "5",
    asiento: "12",
    evento: "ACORDEONAZO",
    fecha: "19 DE JULIO 2025",
    hora: "20:00",
    lugar: "CENTRO DE ESPECTACULOS CD VICTORIA",
    ciudad: "CD. VICTORIA, TAMPS",
  })

  const [printConfig, setPrintConfig] = useState<PrintConfig>({
    paperSize: "140x50mm",
    scale: "100",
    orientation: "landscape",
    margins: "none",
    monocromo: true,
    dpi: "203",
  })

  const handleTicketDataChange = (field: keyof TicketData, value: string) => {
    if (field === 'orden') {
      setTicketData((prev) => ({
        ...prev,
        orden: generateRandomOrder(),
      }))
    } else if (field === 'seccion') {
      // Actualizar precio cuando cambia la sección
      setTicketData((prev) => ({
        ...prev,
        [field]: value,
        precio: prev.tipo === 'CORTESIA' ? '0' : getPrecioByZona(value)
      }))
    } else {
      setTicketData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handlePrintConfigChange = (field: keyof PrintConfig, value: string | boolean) => {
    setPrintConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTicketTypeChange = (value: string) => {
    setTicketData(prev => ({
      ...prev,
      tipo: value,
      precio: value === "CORTESIA" ? "0" : getPrecioByZona(prev.seccion)
    }))
  }

  // Función para convertir una imagen a monocromo (1 bit)
  const convertToMonochrome = async (canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return canvas

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convertir a escala de grises y luego a 1 bit (blanco y negro)
    for (let i = 0; i < data.length; i += 4) {
      // Convertir a escala de grises usando luminosidad percibida
      const grayValue = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

      // Umbral para convertir a 1 bit (blanco o negro)
      const threshold = 128
      const bwValue = grayValue > threshold ? 255 : 0

      data[i] = bwValue // R
      data[i + 1] = bwValue // G
      data[i + 2] = bwValue // B
      // Alpha se mantiene igual
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  const generatePDF = async () => {
    try {
      const { jsPDF } = await import("jspdf")
      const html2canvas = (await import("html2canvas")).default

      if (ticketRef.current) {
        // Configurar opciones para html2canvas
        const scale = printConfig.monocromo ? 3 : 2 // Mayor escala para mejor calidad en monocromo
        const dpi = Number.parseInt(printConfig.dpi) / 72 // Convertir DPI a escala para html2canvas

        const canvas = await html2canvas(ticketRef.current, {
          scale: scale * dpi,
          useCORS: true,
          backgroundColor: "#ffffff", // Fondo explícitamente blanco
          logging: false,
          removeContainer: true,
        })

        // Aplicar conversión a monocromo si está habilitado
        const finalCanvas = printConfig.monocromo ? await convertToMonochrome(canvas) : canvas

        const imgData = finalCanvas.toDataURL("image/png")

        // Determinar dimensiones según el tamaño seleccionado
        const pdfWidth = 140
        let pdfHeight = 50

        if (printConfig.paperSize === "140x50mm+100px") {
          pdfHeight = 50 + 100 * 0.264583 // Convertir 100px a mm (100px / 378 px/100mm)
        }

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: [pdfWidth, pdfHeight],
          compress: true,
        })

        // Establecer fondo blanco explícito
        pdf.setFillColor(255, 255, 255)
        pdf.rect(0, 0, pdfWidth, pdfHeight, "F")

        // Añadir la imagen con calidad optimizada
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST")

        pdf.save(`boleto-${ticketData.orden}.pdf`)

        toast({
          title: "PDF generado",
          description: "El boleto se ha descargado como PDF optimizado para impresión térmica.",
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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow && ticketRef.current) {
      const ticketHTML = ticketRef.current.outerHTML

      // Determinar dimensiones según el tamaño seleccionado
      const pageWidth = "140mm"
      let pageHeight = "50mm"

      if (printConfig.paperSize === "140x50mm+100px") {
        pageHeight = "76.4mm" // 50mm + 26.4mm (100px convertidos a mm)
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Boleto - ${ticketData.orden}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Geist+Mono:wght@300;400;500;600&display=swap');
              
              body { 
                margin: 0; 
                padding: 0; 
                font-family: 'Courier New', 'Courier Prime', monospace;
                background: #ffffff !important;
              }
              
              @media print {
                body { 
                  margin: 0; 
                  padding: 0; 
                  background: #ffffff !important;
                }
                .no-print { display: none; }
                @page {
                  size: ${pageWidth} ${pageHeight};
                  margin: 0;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
              
              .ticket-container {
                width: 100%;
                max-width: ${pageWidth};
                height: ${pageHeight};
                background: #ffffff;
                border: 1px solid black;
                font-family: 'Courier New', 'Geist Mono', monospace;
                display: flex;
                overflow: hidden;
              }
              
              .ticket-talon {
                width: 25%;
                min-width: 90px;
                background: #ffffff;
                padding: 0.5rem;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                border-right: 6px solid black;
              }
              
              .ticket-body {
                flex: 1;
                padding: 0.5rem;
                display: flex;
                flex-direction: column;
                background: #ffffff;
              }
              
              .ticket-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: #ffffff;
              }
              
              .ticket-right {
                width: 30%;
                min-width: 100px;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                padding-left: 0.5rem;
                background: #ffffff;
              }
              
              .ticket-details {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                font-size: 0.6rem;
                line-height: 1.1;
                font-weight: 500;
              }
              
              .detail-item {
                margin-bottom: 0.25rem;
              }
              
              .detail-label {
                font-weight: 600;
              }
              
              .date-time {
                text-align: center;
                font-weight: 600;
                margin-bottom: 0.25rem;
                font-size: 0.75rem;
              }
              
              .presenter {
                text-align: center;
                margin-bottom: 0.25rem;
                font-size: 0.5rem;
                font-variant: small-caps;
                font-weight: 500;
              }
              
              .event-name {
                text-align: center;
                font-weight: 700;
                font-size: 1.25rem;
                margin: 0.25rem 0;
                letter-spacing: 0.05rem;
                line-height: 1;
              }
              
              .venue-info {
                text-align: center;
                margin: 0.25rem 0;
                font-size: 0.65rem;
                line-height: 1.2;
                font-weight: 500;
              }
              
              .logo {
                width: 2.5rem;
                height: 2.5rem;
                background: black;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.75rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                font-family: Arial, sans-serif;
              }
              
              .qr-code {
                width: 3.75rem;
                height: 3.75rem;
                border: 1px solid black;
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
              }
              
              .ticket-value {
                font-family: 'Geist Mono', monospace;
                font-weight: normal;
              }
              
              ${printConfig.monocromo
          ? `
              /* Estilos específicos para impresión monocromática */
              * {
                color: black !important;
                background-color: white !important;
                border-color: black !important;
              }
              `
          : ""
        }
            </style>
          </head>
          <body>
            ${ticketHTML}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  // Función para exportar como imagen monocromática TIFF
  const exportMonochromeTiff = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default

      if (ticketRef.current) {
        toast({
          title: "Procesando...",
          description: "Generando imagen monocromática para impresión térmica.",
        })

        // Capturar el boleto con alta resolución
        const canvas = await html2canvas(ticketRef.current, {
          scale: 4,
          useCORS: true,
          backgroundColor: "#ffffff",
        })

        // Convertir a monocromo
        const monoCanvas = await convertToMonochrome(canvas)

        // Crear un enlace de descarga
        const link = document.createElement("a")
        link.download = `boleto-${ticketData.orden}-mono.png`

        // Convertir a PNG (los navegadores no soportan TIFF directamente)
        monoCanvas.toBlob((blob) => {
          if (blob) {
            link.href = URL.createObjectURL(blob)
            link.click()

            toast({
              title: "Imagen generada",
              description: "La imagen monocromática se ha descargado. Úsala con ImageMagick para convertir a TIFF.",
            })
          }
        }, "image/png")
      }
    } catch (error) {
      console.error("Error generando imagen monocromática:", error)
      toast({
        title: "Error",
        description: "No se pudo generar la imagen. Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  // Determinar altura del contenedor según el tamaño seleccionado
  const getTicketHeight = () => {
    return printConfig.paperSize === "140x50mm+100px" ? "300px" : "240px"
  }

  const getTicketDescription = () => {
    return printConfig.paperSize === "140x42mm+100px"
      ? "Diseño extendido con 100px adicionales de altura"
      : "Diseño optimizado para impresión térmica de boletos - Formato horizontal"
  }

  return (
    <MainLayout activePage="prueba-boleto">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prueba de Boleto</h1>
          <p className="text-gray-600">Configura y previsualiza el diseño del boleto antes de imprimir</p>
        </div>

        {/* Layout en columna */}
        <div className="flex flex-col gap-8">
          {/* Configuration Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Data */}
            <Card>
              <CardHeader>
                <CardTitle>Datos del Boleto</CardTitle>
                <CardDescription>Configura la información que aparecerá en el boleto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="evento">Evento</Label>
                    <Input
                      id="evento"
                      value={ticketData.evento}
                      onChange={(e) => handleTicketDataChange("evento", e.target.value)}
                      placeholder="Nombre del evento"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Boleto</Label>
                    <Select
                      value={ticketData.tipo}
                      onValueChange={handleTicketTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_BOLETO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio</Label>
                    <Input
                      id="precio"
                      value={ticketData.precio}
                      onChange={(e) => handleTicketDataChange("precio", e.target.value)}
                      placeholder="300"
                      disabled={true} // Siempre deshabilitado ya que ahora es automático
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      value={ticketData.fecha}
                      onChange={(e) => handleTicketDataChange("fecha", e.target.value)}
                      placeholder="19 DE JULIO 2025"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora">Hora</Label>
                    <Input
                      id="hora"
                      value={ticketData.hora}
                      onChange={(e) => handleTicketDataChange("hora", e.target.value)}
                      placeholder="20:00"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lugar">Lugar</Label>
                    <Input
                      id="lugar"
                      value={ticketData.lugar}
                      onChange={(e) => handleTicketDataChange("lugar", e.target.value)}
                      placeholder="CENTRO DE EVENTOS CD VICTORIA"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      value={ticketData.ciudad}
                      onChange={(e) => handleTicketDataChange("ciudad", e.target.value)}
                      placeholder="CD. VICTORIA, TAMPS"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orden">Orden</Label>
                    <div className="flex gap-2">
                      <Input
                        id="orden"
                        value={ticketData.orden}
                        readOnly
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => handleTicketDataChange('orden', '')}
                        className="shrink-0"
                      >
                        Regenerar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seccion">Sección</Label>
                    <Select
                      value={ticketData.seccion}
                      onValueChange={(value) => handleTicketDataChange("seccion", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONAS.map((zona) => (
                          <SelectItem key={zona.value} value={zona.value}>
                            {zona.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fila">Fila</Label>
                    <Input
                      id="fila"
                      value={ticketData.fila}
                      onChange={(e) => handleTicketDataChange("fila", e.target.value)}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asiento">Asiento</Label>
                    <Input
                      id="asiento"
                      value={ticketData.asiento}
                      onChange={(e) => handleTicketDataChange("asiento", e.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Print Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Impresión</CardTitle>
                <CardDescription>Ajusta las opciones de impresión y formato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paperSize">Tamaño de Papel</Label>
                    <Select
                      value={printConfig.paperSize}
                      onValueChange={(value) => handlePrintConfigChange("paperSize", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="140x50mm">140mm x 50mm (Estándar)</SelectItem>
                        <SelectItem value="140x50mm+100px">140mm x 50mm + 100px (Extendido)</SelectItem>
                        <SelectItem value="A4">A4 (Prueba)</SelectItem>
                        <SelectItem value="Letter">Carta (Prueba)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orientation">Orientación</Label>
                    <Select
                      value={printConfig.orientation}
                      onValueChange={(value) => handlePrintConfigChange("orientation", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape">Horizontal</SelectItem>
                        <SelectItem value="portrait">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dpi">Resolución (DPI)</Label>
                    <Select value={printConfig.dpi} onValueChange={(value) => handlePrintConfigChange("dpi", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="203">203 DPI (Térmica estándar)</SelectItem>
                        <SelectItem value="300">300 DPI (Alta calidad)</SelectItem>
                        <SelectItem value="600">600 DPI (Muy alta calidad)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="margins">Márgenes</Label>
                    <Select
                      value={printConfig.margins}
                      onValueChange={(value) => handlePrintConfigChange("margins", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin márgenes</SelectItem>
                        <SelectItem value="minimal">Mínimos</SelectItem>
                        <SelectItem value="normal">Normales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Optimización para impresión térmica */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Optimización para impresión térmica
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="monocromo"
                        checked={printConfig.monocromo}
                        onCheckedChange={(checked) => handlePrintConfigChange("monocromo", checked === true)}
                      />
                      <Label htmlFor="monocromo" className="text-sm">
                        Convertir a monocromo (1 bit)
                      </Label>
                    </div>

                    <p className="text-xs text-gray-500">
                      La conversión a monocromo elimina los tramados y mejora la impresión en impresoras térmicas. Usa
                      203 DPI para impresoras térmicas estándar.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex gap-4">
                    <Button onClick={generatePDF} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                    <Button onClick={handlePrint} variant="outline" className="flex-1">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>

                  <Button onClick={exportMonochromeTiff} variant="secondary" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar imagen monocromática
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle>
                Vista Previa del Boleto (
                {printConfig.paperSize === "140x50mm+100px" ? "140mm x 76.4mm" : "140mm x 50mm"})
              </CardTitle>
              <CardDescription>{getTicketDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-8 rounded-lg flex justify-center">
                <div
                  ref={ticketRef}
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
                  <div className="flex w-full">
                    {/* Columna izquierda */}
                    <div className="w-24 p-[5px] font-gontserrat">
                                                    <div className="space-y-0 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>PRECIO</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>$ {paymentMethod === 'courtesy' ? '0.00' : ticketData.precio}</div>
                                                            <div className="py-1">
                                                                <SeparationLines />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>TIPO</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>
                                                                {ticketData.tipo === 'CORTESIA' ? 'CORTESIA' : ticketData.tipo}
                                                            </div>
                                                            <div className="py-1">
                                                                <SeparationLines />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>ORDEN</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>{ticketData.orden}</div>
                                                            <div className="py-1">
                                                                <SeparationLines />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>SECCIÓN</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>{ticketData.seccion}</div>
                                                            <div className="py-1">
                                                                <SeparationLines />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-0px">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>ASIENTO</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>{ticketData.fila}{ticketData.asiento}</div>
                                                        </div>
                                                    </div>
                                                </div>

                    <div className="flex items-center">
                      <Stars />
                    </div>

                    {/* Contenido central */}
                    <div className={`flex-grow p-[0.6rem] flex flex-col relative ${dazzleUnicase.variable} ${gontserrat.variable}`}>
                      {/* Título del evento y recinto */}
                      <div className={`text-2xl font-bold mb-6 ${dazzleUnicase.className}`}>
                        {ticketData.evento}
                        <div className="mt-1">
                          {ticketData.lugar.split(" CD ").map((part, index) => (
                            <div 
                              key={index}
                              className={`text-[14px] leading-[1.1] ${dazzleUnicase.className}`}
                            >
                              {index === 0 ? part : `CD ${part}`}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fecha, hora y ciudad */}
                      <div className={`text-md mb-6 text-[11.7px] ${gontserrat.className}`}>
                        {ticketData.fecha}
                        <div className={gontserrat.className}>{ticketData.hora} hrs.</div>
                        <div className={gontserrat.className}>{ticketData.ciudad}</div>
                      </div>

                      {/* Detalles del boleto con separadores */}
                      <div className={`flex items-center space-x-[8px] ${gontserrat.className}`}>
                        <div className="text-center">
                          <div className="text-[12px]">PRECIO</div>
                          <div className="text-sm">$ {ticketData.precio}</div>
                        </div>
                        <div className="h-8 w-px bg-black"></div>
                        <div className="text-center">
                          <div className="text-[12px]">TIPO</div>
                          <div className="text-sm">{ticketData.tipo === 'CORTESIA' ? 'CORTESIA' : ticketData.tipo}</div>
                        </div>
                        <div className="h-8 w-px bg-black"></div>
                        <div className="text-center">
                          <div className="text-[12px]">ORDEN</div>
                          <div className="text-sm">{ticketData.orden}</div>
                        </div>
                        <div className="h-8 w-px bg-black"></div>
                        <div className="text-center">
                          <div className="text-[12px]">SECCIÓN</div>
                          <div className="text-sm">{ticketData.seccion}</div>
                        </div>
                      </div>

                      {/* Logo */}
                      <div className="absolute top-[132px] right-4 w-24">
                        <Logo />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Stars />
                    </div>

                    {/* Columna derecha */}
                    <div className="w-24 p-[5px] font-gontserrat">
                                                    <div className="space-y-0 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>PRECIO</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>$ {paymentMethod === 'courtesy' ? '0.00' : ticketData.precio}</div>
                                                            <div className="py-1">
                                                                <SeparationLines />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>TIPO</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>
                                                                {ticketData.tipo === 'CORTESIA' ? 'CORTESIA' : ticketData.tipo}
                                                            </div>
                                                            <div className="py-1">
                                                                <SeparationLines />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>ORDEN</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>{ticketData.orden}</div>
                                                            <div className="py-1">
                                                                <SeparationLines />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>SECCIÓN</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>{ticketData.seccion}</div>
                                                            <div className="py-1">
                                                                <SeparationLines />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-0px">
                                                            <div className={`text-xs font-[5px] ${gontserrat.className}`}>ASIENTO</div>
                                                            <div className={`text-[11px] ${gontserrat.className}`}>{ticketData.fila}{ticketData.asiento}</div>
                                                        </div>
                                                    </div>
                                                </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
