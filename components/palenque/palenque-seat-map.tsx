"use client"

import type React from "react"

import { useState, useMemo, useRef } from "react"
import { Trash2, MapPin, Calendar, Clock, Users, DollarSign, Plus, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// @ts-ignore
import venueConfig from "../../data/seats-data-palenque-victoria.json"

// Interfaces para la configuración exportada del seat-map creator
interface CreatedSeat {
  id: string
  x: number
  y: number
  zone: string
  zoneName: string
  color: string
  price: number
  status: "available" | "occupied" | "selected"
  rowLetter: string
  seatNumber: number
  lineId?: string
  lineIndex?: number
}

interface SeatLine {
  id: string
  name: string
  startX: number
  startY: number
  endX: number
  endY: number
  seatCount: number
  angle: number
  zone: string
  rowLetter: string
}

interface Venue {
  name: string
  type: string
  capacity: number
  layout: string
}

interface Ruedo {
  centerX: number
  centerY: number
  radius: number
}

interface VenueConfig {
  venue: Venue
  ruedo: Ruedo
  createdSeats: CreatedSeat[]
  createdLines: SeatLine[]
  exportDate: string
}

interface ZoneInfo {
  name: string
  price: number
  color: string
  selectable: boolean
}

interface GeneralTicket {
  id: string
  zoneName: string
  price: number
  quantity: number
}

// Configuración de zonas
const zoneConfig: Record<string, ZoneInfo> = {
  General: { name: "General", price: 300, color: "#10B981", selectable: false },
  "Oro 1": { name: "Oro 1", price: 600, color: "#F59E0B", selectable: true },
  "Oro 2": { name: "Oro 2", price: 600, color: "#F59E0B", selectable: true },
  "Oro 3": { name: "Oro 3", price: 600, color: "#F59E0B", selectable: true },
  "Oro 4": { name: "Oro 4", price: 600, color: "#F59E0B", selectable: true },
  "Oro 5": { name: "Oro 5", price: 600, color: "#F59E0B", selectable: true },
  "Oro 6": { name: "Oro 6", price: 600, color: "#F59E0B", selectable: true },
  "Oro 7": { name: "Oro 7", price: 600, color: "#F59E0B", selectable: true },
  "Oro 8": { name: "Oro 8", price: 600, color: "#F59E0B", selectable: true },
  "VIP 1": { name: "VIP 1", price: 900, color: "#8B5CF6", selectable: true },
  "VIP 2": { name: "VIP 2", price: 900, color: "#8B5CF6", selectable: true },
  "VIP 3": { name: "VIP 3", price: 900, color: "#8B5CF6", selectable: true },
  "VIP 4": { name: "VIP 4", price: 900, color: "#8B5CF6", selectable: true },
}

// Función de utilidad para verificar si un asiento está en el viewport
const isSeatInViewport = (
  seat: CreatedSeat,
  viewBox: { x: number; y: number; width: number; height: number },
): boolean => {
  return (
    seat.x >= viewBox.x &&
    seat.x <= viewBox.x + viewBox.width &&
    seat.y >= viewBox.y &&
    seat.y <= viewBox.y + viewBox.height
  )
}

export function PalenqueSeatMap() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedSeats, setSelectedSeats] = useState<CreatedSeat[]>([])
  const [hoveredSeat, setHoveredSeat] = useState<CreatedSeat | null>(null)
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [generalTickets, setGeneralTickets] = useState<GeneralTicket[]>([])

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 })

  // Información del evento
  const eventInfo = {
    title: "Gloria Trevi - En Vivo",
    date: "Sábado, 29 de marzo 2025",
    time: "21:00 hrs",
    venue: "Palenque Victoria, San Luis Potosí",
  }

  // Configuración del ruedo
  const svgWidth = 1800
  const svgHeight = 1800
  const centerX = svgWidth / 2
  const centerY = svgHeight / 2

  // Memoize grouped seats by zone for better performance
  const groupedSeats = useMemo(() => {
    if (!selectedSeats.length) return {}
    return selectedSeats.reduce(
      (acc: Record<string, CreatedSeat[]>, seat: CreatedSeat) => {
        if (!acc[seat.zoneName]) {
          acc[seat.zoneName] = []
        }
        acc[seat.zoneName].push(seat)
        return acc
      },
      {} as Record<string, CreatedSeat[]>,
    )
  }, [selectedSeats])

  // Obtener asientos de la zona seleccionada
  const zoneSeats = useMemo(() => {
    if (!selectedZone) return []
    return venueConfig.createdSeats.filter((seat: CreatedSeat) => seat.zoneName === selectedZone)
  }, [selectedZone])

  const handleSeatClick = (seat: CreatedSeat) => {
    if (seat.status === "occupied") return

    setSelectedSeats((prev) => {
      const isSelected = prev.find((s) => s.id === seat.id)
      if (isSelected) {
        return prev.filter((s) => s.id !== seat.id)
      }
      return [...prev, seat]
    })
  }

  const removeSeat = (seatId: string) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId))
  }

  const handleZoneHover = (zoneName: string, event: React.MouseEvent) => {
    if (!zoneConfig[zoneName]?.selectable) return

    setHoveredZone(zoneName)
    const svgRect = svgRef.current?.getBoundingClientRect()
    if (svgRect) {
      const x = event.clientX - svgRect.left
      const y = event.clientY - svgRect.top
      setMousePosition({ x, y })
    }
  }

  const handleZoneClick = (zoneName: string) => {
    if (!zoneConfig[zoneName]?.selectable) return
    setSelectedZone(selectedZone === zoneName ? null : zoneName)
  }

  // Funciones para manejo de arrastre con click derecho
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 2) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      setLastPan({ x: panX, y: panY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) / zoomLevel
      const deltaY = (e.clientY - dragStart.y) / zoomLevel
      setPanX(lastPan.x - deltaX)
      setPanY(lastPan.y - deltaY)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    setZoomLevel((prev) => Math.max(0.3, Math.min(3, prev * zoomFactor)))
  }

  const adjustedWidth = svgWidth / zoomLevel
  const adjustedHeight = svgHeight / zoomLevel
  const viewBox = `${panX - adjustedWidth / 2 + svgWidth / 2} ${panY - adjustedHeight / 2 + svgHeight / 2} ${adjustedWidth} ${adjustedHeight}`

  const currentViewBox = useMemo(() => {
    const [x, y, width, height] = viewBox.split(" ").map(Number)
    return { x, y, width, height }
  }, [viewBox])

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(3, prev * 1.1))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.3, prev * 0.9))
  }

  // Funciones para boletos generales
  const addGeneralTicket = () => {
    const newTicket: GeneralTicket = {
      id: `general-${Date.now()}`,
      zoneName: "General",
      price: 300,
      quantity: 1,
    }
    setGeneralTickets((prev) => [...prev, newTicket])
  }

  const updateGeneralTicketQuantity = (ticketId: string, change: number) => {
    setGeneralTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id === ticketId) {
          const newQuantity = Math.max(1, ticket.quantity + change)
          return { ...ticket, quantity: newQuantity }
        }
        return ticket
      }),
    )
  }

  const removeGeneralTicket = (ticketId: string) => {
    setGeneralTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId))
  }

  const totalPrice =
    selectedSeats.reduce((sum, seat) => sum + seat.price, 0) +
    generalTickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0)
  const totalSeats = selectedSeats.length + generalTickets.reduce((sum, ticket) => sum + ticket.quantity, 0)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Panel lateral izquierdo */}
      <div className="w-96 bg-white shadow-xl overflow-y-auto">
        {/* Información del evento */}
        <div className="p-6 border-b">
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{eventInfo.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm opacity-90">
                <Calendar className="w-4 h-4 mr-2" />
                {eventInfo.date}
              </div>
              <div className="flex items-center text-sm opacity-90">
                <Clock className="w-4 h-4 mr-2" />
                {eventInfo.time}
              </div>
              <div className="flex items-center text-sm opacity-90">
                <MapPin className="w-4 h-4 mr-2" />
                {eventInfo.venue}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de precios por zona */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-800 mb-4">Precios por Zona</h3>
          <div className="space-y-3">
            {Object.entries(zoneConfig).map(([zoneName, zone]) => (
              <div key={zoneName} className="flex items-center p-3 rounded-lg border bg-gray-50">
                <div className="w-4 h-8 rounded mr-3" style={{ backgroundColor: zone.color }} />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{zone.name}</div>
                  <div className="text-green-600 font-semibold">${zone.price.toFixed(2)} MXN</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón para zona general */}
        <div className="p-6 border-b">
          <Button onClick={addGeneralTicket} className="w-full bg-green-600 hover:bg-green-700 text-white">
            Agregar Boleto General - $300 MXN
          </Button>
        </div>

        {/* Boletos generales */}
        {generalTickets.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-800 mb-4">Boletos Generales</h3>
            <div className="space-y-3">
              {generalTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{ticket.zoneName}</div>
                    <div className="text-green-600 font-semibold">
                      ${ticket.price.toFixed(2)} MXN x {ticket.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateGeneralTicketQuantity(ticket.id, -1)}
                      disabled={ticket.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{ticket.quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => updateGeneralTicketQuantity(ticket.id, 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeGeneralTicket(ticket.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Asientos seleccionados */}
        {selectedSeats.length > 0 && (
          <div className="p-6 border-b">
            <Card className="bg-pink-500 text-white border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Asientos Seleccionados ({selectedSeats.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(groupedSeats).map(([zoneName, seats]: [string, CreatedSeat[]]) => (
                  <div key={zoneName} className="space-y-2">
                    <div className="font-medium text-sm opacity-90">{zoneName}</div>
                    {seats.map((seat: CreatedSeat) => (
                      <div key={seat.id} className="flex justify-between items-center bg-white/20 p-2 rounded">
                        <div className="text-sm">
                          <div>Fila {seat.rowLetter}</div>
                          <div className="opacity-80">Asiento {seat.seatNumber}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">${seat.price.toFixed(2)}</span>
                          <button
                            onClick={() => removeSeat(seat.id)}
                            className="text-white/70 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Total y compra */}
        {(selectedSeats.length > 0 || generalTickets.length > 0) && (
          <div className="p-6 border-b">
            <Card className="bg-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-lg font-bold">${totalPrice.toFixed(2)} MXN</span>
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Comprar {totalSeats} boleto{totalSeats !== 1 ? "s" : ""}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leyenda */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Leyenda</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span>Ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-pink-500"></div>
              <span>Seleccionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Disponible</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>• Haz clic en las zonas para ver asientos</p>
            <p>• Haz clic en los asientos para seleccionar</p>
            <p>• Los asientos grises no están disponibles</p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Controles</h4>
            <div className="text-xs text-blue-600 space-y-1">
              <p>• Usa los botones + y - para hacer zoom</p>
              <p>• Click derecho + arrastrar: mover mapa</p>
              <p>• Rueda del mouse: zoom in/out</p>
              <p>• Botón casa: resetear vista</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa de asientos */}
      <div className="flex-1 p-6">
        <Card className="h-[800px]">
          <CardHeader>
            <CardTitle className="text-xl">Mapa de Asientos - {venueConfig.venue.name}</CardTitle>
            <p className="text-gray-600">
              {selectedZone ? `Zona seleccionada: ${selectedZone}` : "Selecciona una zona para ver los asientos"}
            </p>
          </CardHeader>
          <CardContent className="h-full relative">
            {/* Controles flotantes en la esquina superior derecha */}
            <div className="absolute top-4 right-4 z-10 space-y-2">
              {/* Controles de navegación */}
              <div className="bg-white rounded-lg shadow-lg border p-2">
                <div className="grid grid-cols-3 gap-1">
                  <div></div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPanY((prev) => prev - 50)}
                  >
                    ↑
                  </Button>
                  <div></div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPanX((prev) => prev - 50)}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => {
                      setPanX(0)
                      setPanY(0)
                      setZoomLevel(1)
                    }}
                  >
                    ⌂
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPanX((prev) => prev + 50)}
                  >
                    →
                  </Button>
                  <div></div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPanY((prev) => prev + 50)}
                  >
                    ↓
                  </Button>
                  <div></div>
                </div>
              </div>

              {/* Controles de zoom */}
              <div className="bg-white rounded-lg shadow-lg border p-2 space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                >
                  +
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.3}
                >
                  −
                </Button>
              </div>

              {/* Indicador de estado */}
              <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                <div>Zoom: {Math.round(zoomLevel * 100)}%</div>
                <div>
                  Pan: ({Math.round(panX)}, {Math.round(panY)})
                </div>
              </div>
            </div>

            {/* Canvas del mapa */}
            <div className="w-full h-full flex justify-center items-center bg-gray-50 rounded-lg border">
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={viewBox}
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
              >
                {/* Ruedo central */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={venueConfig.ruedo.radius}
                  fill="#1F2937"
                  stroke="#374151"
                  strokeWidth="3"
                />
                <text x={centerX} y={centerY - 10} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                  RUEDO
                </text>
                <text x={centerX} y={centerY + 15} textAnchor="middle" fill="white" fontSize="14">
                  {venueConfig.venue.name.toUpperCase()}
                </text>

                {/* Renderizar SVGs de secciones */}
                {Object.keys(zoneConfig).map((zoneName) => {
                  const zone = zoneConfig[zoneName]
                  const svgPath = `/secciones-palenque/${zoneName}.svg`

                  return (
                    <g key={zoneName}>
                      <image
                        href={svgPath}
                        x={centerX - 400}
                        y={centerY - 400}
                        width={800}
                        height={800}
                        className={`
                          ${zone.selectable ? "cursor-pointer" : "cursor-default"}
                          ${hoveredZone === zoneName ? "opacity-80" : "opacity-100"}
                          ${selectedZone === zoneName ? "brightness-110" : ""}
                          transition-all duration-200
                        `}
                        onMouseEnter={(e) => zone.selectable && handleZoneHover(zoneName, e)}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => handleZoneClick(zoneName)}
                      />
                    </g>
                  )
                })}

                {/* Renderizar asientos de la zona seleccionada */}
                {selectedZone &&
                  zoneSeats.map((seat: CreatedSeat) => {
                    const isSelected = selectedSeats.some((s: CreatedSeat) => s.id === seat.id)
                    return (
                      <g key={seat.id}>
                        <circle
                          cx={seat.x}
                          cy={seat.y}
                          r="4"
                          fill={
                            isSelected
                              ? "#EC4899"
                              : seat.status === "occupied"
                                ? "#6B7280"
                                : zoneConfig[selectedZone].color
                          }
                          stroke={isSelected ? "#BE185D" : "#374151"}
                          strokeWidth="1.5"
                          className="cursor-pointer hover:stroke-gray-400 hover:stroke-3 transition-all duration-200"
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={(e) => {
                            setHoveredSeat(seat)
                            const svgRect = svgRef.current?.getBoundingClientRect()
                            if (svgRect) {
                              const x = e.clientX - svgRect.left
                              const y = e.clientY - svgRect.top
                              setMousePosition({ x, y })
                            }
                          }}
                          onMouseMove={(e) => {
                            const svgRect = svgRef.current?.getBoundingClientRect()
                            if (svgRect) {
                              const x = e.clientX - svgRect.left
                              const y = e.clientY - svgRect.top
                              setMousePosition({ x, y })
                            }
                          }}
                          onMouseLeave={() => setHoveredSeat(null)}
                        />
                        {zoomLevel >= 0.5 && (
                          <text
                            x={seat.x}
                            y={seat.y - 8}
                            textAnchor="middle"
                            fill="#374151"
                            fontSize="6"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            {seat.rowLetter}
                            {seat.seatNumber}
                          </text>
                        )}
                      </g>
                    )
                  })}

                {/* Tooltip para zona hover */}
                {hoveredZone && zoneConfig[hoveredZone] && (
                  <g transform={`translate(${mousePosition.x + 15}, ${mousePosition.y - 25})`}>
                    <g filter="url(#zoneTooltipShadow)">
                      <rect x="0" y="0" width="200" height="60" fill="white" rx="8" ry="8" />
                      <rect x="0" y="40" width="200" height="20" fill={zoneConfig[hoveredZone].color} rx="8" ry="8" />
                      <rect x="0" y="35" width="200" height="10" fill={zoneConfig[hoveredZone].color} />
                    </g>

                    <defs>
                      <filter id="zoneTooltipShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25" />
                      </filter>
                    </defs>

                    <text x="15" y="20" fill="#1F2937" fontSize="14" fontWeight="bold">
                      {zoneConfig[hoveredZone].name}
                    </text>
                    <text x="15" y="35" fill="#4B5563" fontSize="12" fontWeight="normal">
                      Click para seleccionar
                    </text>
                    <text x="185" y="55" fill="white" fontSize="14" fontWeight="bold" textAnchor="end">
                      ${zoneConfig[hoveredZone].price} MXN
                    </text>
                  </g>
                )}

                {/* Tooltip para asiento hover */}
                {hoveredSeat && (
                  <g transform={`translate(${hoveredSeat.x + 50}, ${hoveredSeat.y - 35})`}>
                    <g filter="url(#shadow)">
                      <rect x="0" y="0" width="320" height="70" fill="white" rx="8" ry="8" />
                      <rect x="0" y="70" width="320" height="60" fill={hoveredSeat.color} rx="8" ry="8" />
                      <rect x="0" y="62" width="320" height="16" fill={hoveredSeat.color} />
                    </g>

                    <defs>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25" />
                      </filter>
                    </defs>

                    <text x="25" y="30" fill="#1F2937" fontSize="16" fontWeight="bold">
                      SECCIÓN
                    </text>
                    <text x="130" y="30" fill="#1F2937" fontSize="16" fontWeight="bold">
                      FILA
                    </text>
                    <text x="220" y="30" fill="#1F2937" fontSize="16" fontWeight="bold">
                      ASIENTO
                    </text>

                    <text x="25" y="55" fill="#4B5563" fontSize="16" fontWeight="normal">
                      {hoveredSeat.zoneName}
                    </text>
                    <text x="130" y="55" fill="#4B5563" fontSize="16" fontWeight="normal">
                      {hoveredSeat.rowLetter}
                    </text>
                    <text x="220" y="55" fill="#4B5563" fontSize="16" fontWeight="normal">
                      {hoveredSeat.seatNumber}
                    </text>

                    <text x="25" y="100" fill="white" fontSize="18" fontWeight="bold">
                      {hoveredSeat.zoneName}
                    </text>
                    <text x="295" y="100" fill="white" fontSize="18" fontWeight="bold" textAnchor="end">
                      ${hoveredSeat.price.toFixed(2)} MXN
                    </text>
                    <text x="25" y="120" fill="white" fontSize="14" fontWeight="normal" opacity="0.9">
                      {hoveredSeat.status === "available" ? "Disponible" : "Ocupado"}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
