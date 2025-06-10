"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Trash2, MapPin, Calendar, Clock, Users, DollarSign } from "lucide-react"
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

// Función de utilidad para verificar si un asiento está en el viewport
const isSeatInViewport = (
  seat: CreatedSeat,
  viewBox: { x: number; y: number; width: number; height: number }
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  // Información del evento
  const eventInfo = {
    title: "Gloria Trevi - En Vivo",
    date: "Sábado, 29 de marzo 2025",
    time: "21:00 hrs",
    venue: "Palenque Victoria, San Luis Potosí",
  }

  // Configuración del ruedo
  const maxRadius = 800
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

  // Memoize unique zones and their prices for the price list
  const uniqueZones = useMemo(() => {
    const zones = new Map<string, { name: string; color: string; price: number }>()
    venueConfig.createdSeats.forEach((seat: CreatedSeat) => {
      if (!zones.has(seat.zone)) {
        zones.set(seat.zone, {
          name: seat.zoneName,
          color: seat.color,
          price: seat.price
        })
      }
    })
    return Array.from(zones.values())
  }, [])

  const handleSeatClick = (seat: CreatedSeat) => {
    if (seat.status === "occupied") return

    setSelectedSeats(prev => {
      const isSelected = prev.find(s => s.id === seat.id)
      if (isSelected) {
        return prev.filter(s => s.id !== seat.id)
      }
      return [...prev, seat]
    })
  }

  const removeSeat = (seatId: string) => {
    setSelectedSeats(prev => prev.filter(s => s.id !== seatId))
  }

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
  const totalSeats = selectedSeats.length

  // Current viewBox for viewport calculations
  const viewBox = `${-panX} ${-panY} ${svgWidth} ${svgHeight}`
  const currentViewBox = useMemo(() => {
    const [x, y, width, height] = viewBox.split(" ").map(Number)
    return { x, y, width, height }
  }, [viewBox])

  // Memorizar los asientos visibles
  const visibleSeats = useMemo(() => {
    return venueConfig.createdSeats.filter((seat: CreatedSeat) => isSeatInViewport(seat, currentViewBox))
  }, [currentViewBox])

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
            {uniqueZones.map((zone) => (
              <div key={zone.name} className="flex items-center p-3 rounded-lg border bg-gray-50">
                <div className="w-4 h-8 rounded mr-3" style={{ backgroundColor: zone.color }} />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{zone.name}</div>
                  <div className="text-green-600 font-semibold">${zone.price.toFixed(2)} MXN</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asientos seleccionados */}
        {selectedSeats.length > 0 && (
          <div className="p-6 border-b">
            <Card className="bg-pink-500 text-white border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Asientos Seleccionados ({totalSeats})
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

                <div className="border-t border-white/30 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-lg font-bold">${totalPrice.toFixed(2)} MXN</span>
                    </div>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Comprar {totalSeats} boleto{totalSeats !== 1 ? "s" : ""}
                  </Button>
                </div>
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
            <p>• Haz clic en los asientos para seleccionar</p>
            <p>• Puedes seleccionar múltiples asientos</p>
            <p>• Los asientos grises no están disponibles</p>
          </div>
        </div>
      </div>

      {/* Mapa de asientos */}
      <div className="flex-1 p-6 overflow-auto">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-xl">Mapa de Asientos - {venueConfig.venue.name}</CardTitle>
            <p className="text-gray-600">Selecciona tus asientos haciendo clic en el mapa</p>
          </CardHeader>
          <CardContent className="h-full">
            <div className="flex justify-center h-full">
              <svg
                ref={svgRef}
                width={svgWidth}
                height={svgHeight}
                viewBox={viewBox}
                className="border rounded-lg bg-gray-50"
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
                <text
                  x={centerX}
                  y={centerY - 10}
                  textAnchor="middle"
                  fill="white"
                  fontSize="18"
                  fontWeight="bold"
                >
                  RUEDO
                </text>
                <text
                  x={centerX}
                  y={centerY + 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                >
                  {venueConfig.venue.name.toUpperCase()}
                </text>

                {/* Render lines */}
                {venueConfig.createdLines.map((line: SeatLine) => (
                  <line
                    key={line.id}
                    x1={line.startX}
                    y1={line.startY}
                    x2={line.endX}
                    y2={line.endY}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                ))}

                {/* Render seats */}
                {visibleSeats.map((seat: CreatedSeat) => {
                  const isSelected = selectedSeats.some((s: CreatedSeat) => s.id === seat.id)
                  return (
                    <g key={seat.id}>
                      <circle
                        cx={seat.x}
                        cy={seat.y}
                        r="4"
                        fill={isSelected ? "#EC4899" : seat.status === "occupied" ? "#6B7280" : seat.color}
                        stroke={isSelected ? "#BE185D" : "#374151"}
                        strokeWidth="1.5"
                        className="cursor-pointer hover:stroke-gray-400 hover:stroke-3 transition-all duration-200"
                        onClick={() => handleSeatClick(seat)}
                        onMouseEnter={(e) => {
                          setHoveredSeat(seat)
                          // Obtener la posición del mouse relativa al SVG
                          const svgRect = svgRef.current?.getBoundingClientRect()
                          if (svgRect) {
                            const x = e.clientX - svgRect.left
                            const y = e.clientY - svgRect.top
                            setMousePosition({ x, y })
                          }
                        }}
                        onMouseMove={(e) => {
                          // Actualizar la posición mientras se mueve el mouse
                          const svgRect = svgRef.current?.getBoundingClientRect()
                          if (svgRect) {
                            const x = e.clientX - svgRect.left
                            const y = e.clientY - svgRect.top
                            setMousePosition({ x, y })
                          }
                        }}
                        onMouseLeave={() => setHoveredSeat(null)}
                      />
                      {/* Solo renderizar el texto si el zoom es suficiente */}
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

                {/* Tooltip para asiento hover */}
                {hoveredSeat && (
                  <g transform={`translate(${mousePosition.x + 20}, ${mousePosition.y - 40})`}>
                    {/* Contenedor principal */}
                    <g filter="url(#shadow)">
                      {/* Sección superior blanca */}
                      <rect 
                        x="0" 
                        y="0" 
                        width="280" 
                        height="50" 
                        fill="white"
                        rx="8" 
                        ry="8"
                      />
                      {/* Sección inferior con color de zona */}
                      <rect 
                        x="0" 
                        y="50" 
                        width="280" 
                        height="50" 
                        fill={hoveredSeat.color}
                        rx="8" 
                        ry="8"
                      />
                      {/* Rectángulo para unir las dos secciones */}
                      <rect 
                        x="0" 
                        y="45" 
                        width="280" 
                        height="10" 
                        fill={hoveredSeat.color}
                      />
                    </g>

                    {/* Filtro para sombra */}
                    <defs>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                    </defs>

                    {/* Contenido superior */}
                    <text x="20" y="25" fill="#1F2937" fontSize="16" fontWeight="600">
                      SECCIÓN
                    </text>
                    <text x="100" y="25" fill="#1F2937" fontSize="16" fontWeight="600">
                      FILA
                    </text>
                    <text x="180" y="25" fill="#1F2937" fontSize="16" fontWeight="600">
                      ASIENTO
                    </text>
                    <text x="20" y="45" fill="#4B5563" fontSize="16" fontWeight="500">
                      {hoveredSeat.zoneName}
                    </text>
                    <text x="100" y="45" fill="#4B5563" fontSize="16" fontWeight="500">
                      {hoveredSeat.rowLetter}
                    </text>
                    <text x="180" y="45" fill="#4B5563" fontSize="16" fontWeight="500">
                      {hoveredSeat.seatNumber}
                    </text>

                    {/* Contenido inferior */}
                    <text x="20" y="85" fill="white" fontSize="18" fontWeight="bold">
                      {hoveredSeat.zoneName}
                    </text>
                    <text x="140" y="85" fill="white" fontSize="18" fontWeight="bold" textAnchor="end">
                      ${hoveredSeat.price.toFixed(2)} MXN
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
