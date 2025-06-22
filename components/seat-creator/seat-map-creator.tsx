"use client"

import type React from "react"

import { useState, useRef, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Download, Upload, Plus, RotateCcw, MousePointer, Move3D, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import palenqueData from "../../data/palenque-config.json"

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

interface PreviewSeat {
  x: number
  y: number
  index: number
}

type CreationMode = "single" | "line" | "select" | "edit"

// Función de utilidad para verificar si un asiento está en el viewport
const isSeatInViewport = (
  seat: CreatedSeat | undefined,
  viewBox: { x: number; y: number; width: number; height: number } | undefined,
): boolean => {
  if (!seat || !viewBox) return false

  return (
    seat.x >= viewBox.x &&
    seat.x <= viewBox.x + viewBox.width &&
    seat.y >= viewBox.y &&
    seat.y <= viewBox.y + viewBox.height
  )
}

export function SeatMapCreator() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Estados para asientos creados
  const [createdSeats, setCreatedSeats] = useState<CreatedSeat[]>([])
  const [createdLines, setCreatedLines] = useState<SeatLine[]>([])
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [hoveredSeat, setHoveredSeat] = useState<CreatedSeat | null>(null)

  // Estados para modos de creación
  const [creationMode, setCreationMode] = useState<CreationMode>("single")
  const [selectedZone, setSelectedZone] = useState(
    palenqueData.zones && palenqueData.zones.length > 0 ? palenqueData.zones[0].id : "default",
  )
  const [selectedRowLetter, setSelectedRowLetter] = useState("A")

  // Estados para modo edición
  const [editingMode, setEditingMode] = useState<"seat" | "line" | null>(null)
  const [editingSeat, setEditingSeat] = useState<CreatedSeat | null>(null)
  const [editingLine, setEditingLine] = useState<SeatLine | null>(null)
  const [editCoordinates, setEditCoordinates] = useState({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    angle: 0,
    seatCount: 5
  })

  // Estados para modo línea con mouse
  const [lineStartPoint, setLineStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [lineEndPoint, setLineEndPoint] = useState<{ x: number; y: number } | null>(null)
  const [isCreatingLine, setIsCreatingLine] = useState(false)
  const [isDraggingCurve, setIsDraggingCurve] = useState(false)
  const [currentCurveAngle, setCurrentCurveAngle] = useState(0)
  const [seatCount, setSeatCount] = useState("5")

  // Estados para preview
  const [previewLine, setPreviewLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [previewSeats, setPreviewSeats] = useState<PreviewSeat[]>([])
  const [previewCurvePath, setPreviewCurvePath] = useState<string>("")

  // Configuración del ruedo - aumentar radio general
  const ruedo = palenqueData.ruedo || { radius: 120 }
  const maxRadius = 800 // Aumentado de 280 a 800
  const svgWidth = 1800
  const svgHeight = 1800
  const centerX = svgWidth / 2 // 900
  const centerY = svgHeight / 2 // 900
  const maxCurveAngle = 60

  // Estados para zoom
  const [zoomLevel, setZoomLevel] = useState(1)
  // Estados para navegación (pan)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const panStep = 100 // Píxeles a mover por cada clic
  const [viewBox, setViewBox] = useState(`0 0 ${svgWidth} ${svgHeight}`)

  // Generar opciones de fila (A-Z)
  const rowOptions = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

  // Obtener información de zona
  const getZoneInfo = (zoneId: string) => {
    return palenqueData.zones.find((z) => z.id === zoneId) || palenqueData.zones[0]
  }

  // Funciones de zoom
  const zoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.2, 3)
    setZoomLevel(newZoom)
    updateViewBox(newZoom, panX, panY)
  }

  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.2, 0.3)
    setZoomLevel(newZoom)
    updateViewBox(newZoom, panX, panY)
  }

  const updateViewBox = useCallback(
    (zoom: number, offsetX = panX, offsetY = panY) => {
      const width = svgWidth / zoom
      const height = svgHeight / zoom
      const x = (svgWidth - width) / 2 + offsetX
      const y = (svgHeight - height) / 2 + offsetY
      setViewBox(`${x} ${y} ${width} ${height}`)
    },
    [svgWidth, svgHeight, panX, panY],
  )

  // Funciones de navegación (pan)
  const panLeft = () => {
    const newPanX = panX - panStep
    setPanX(newPanX)
    updateViewBox(zoomLevel, newPanX, panY)
  }

  const panRight = () => {
    const newPanX = panX + panStep
    setPanX(newPanX)
    updateViewBox(zoomLevel, newPanX, panY)
  }

  const panUp = () => {
    const newPanY = panY - panStep
    setPanY(newPanY)
    updateViewBox(zoomLevel, panX, newPanY)
  }

  const panDown = () => {
    const newPanY = panY + panStep
    setPanY(newPanY)
    updateViewBox(zoomLevel, panX, newPanY)
  }

  const resetView = () => {
    setZoomLevel(1)
    setPanX(0)
    setPanY(0)
    setViewBox(`0 0 ${svgWidth} ${svgHeight}`)
  }

  // Validar posición - usar coordenadas del centro del SVG
  const isValidPosition = useCallback(
    (x: number, y: number) => {
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
      const minDistance = ruedo.radius * 2 + 40
      const maxDistance = maxRadius - 10
      return distance >= minDistance && distance <= maxDistance
    },
    [ruedo.radius, maxRadius, centerX, centerY],
  )

  // Generar ID único
  const generateId = () => `seat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Convertir coordenadas del mouse a coordenadas SVG
  const getSVGCoordinates = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 }

    try {
      const svg = svgRef.current
      const CTM = svg.getScreenCTM()

      if (!CTM) return { x: 0, y: 0 }

      // Crear un punto SVG
      const point = svg.createSVGPoint()

      // Establecer las coordenadas del mouse
      point.x = event.clientX
      point.y = event.clientY

      // Convertir el punto usando la matriz de transformación inversa
      const svgPoint = point.matrixTransform(CTM.inverse())

      // Redondear las coordenadas para mayor precisión
      const x = Math.round(svgPoint.x)
      const y = Math.round(svgPoint.y)

      console.log(`Mouse Coordinates: (${event.clientX}, ${event.clientY})`)
      console.log(`SVG Coordinates: (${x}, ${y})`)

      return { x, y }
    } catch (error) {
      console.error("Error al calcular coordenadas SVG:", error)
      return { x: 0, y: 0 }
    }
  }

  // Calcular ángulo entre dos vectores
  const calculateAngle = (v1: { x: number; y: number }, v2: { x: number; y: number }) => {
    const dot = v1.x * v2.x + v1.y * v2.y
    const det = v1.x * v2.y - v1.y * v2.x
    return Math.atan2(det, dot) * (180 / Math.PI)
  }

  // Generar curva cuadrática Bézier
  const generateQuadraticBezier = (start: { x: number; y: number }, end: { x: number; y: number }, angle: number) => {
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2

    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
    const controlDistance = distance / 2

    // Calcular el punto de control
    const angleRad = (angle * Math.PI) / 180
    const perpAngleRad = Math.atan2(end.y - start.y, end.x - start.x) + Math.PI / 2

    const controlX = midX + Math.cos(perpAngleRad) * controlDistance * Math.sin(angleRad)
    const controlY = midY + Math.sin(perpAngleRad) * controlDistance * Math.sin(angleRad)

    return { controlX, controlY }
  }

  // Interpolar punto en curva cuadrática Bézier
  const interpolateBezier = (
    start: { x: number; y: number },
    control: { x: number; y: number },
    end: { x: number; y: number },
    t: number,
  ) => {
    const x = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * control.x + Math.pow(t, 2) * end.x
    const y = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * control.y + Math.pow(t, 2) * end.y
    return { x: Math.round(x), y: Math.round(y) }
  }

  // Generar preview de asientos en curva
  const generateCurvePreview = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    angle: number,
    count: number,
  ): PreviewSeat[] => {
    if (count < 2) return []

    const { controlX, controlY } = generateQuadraticBezier(start, end, angle)
    const seats: PreviewSeat[] = []

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1)
      const point = interpolateBezier(start, { x: controlX, y: controlY }, end, t)

      seats.push({
        x: point.x,
        y: point.y,
        index: i,
      })
    }

    return seats
  }

  // Generar path SVG para la curva
  const generateCurvePath = (start: { x: number; y: number }, end: { x: number; y: number }, angle: number): string => {
    const { controlX, controlY } = generateQuadraticBezier(start, end, angle)
    return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
  }

  // Obtener siguiente número de asiento para una fila
  const getNextSeatNumber = (rowLetter: string): number => {
    const seatsInRow = createdSeats.filter((seat) => seat.rowLetter === rowLetter)
    return seatsInRow.length + 1
  }

  // Manejar clic en el canvas
  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingCurve) return // No procesar clics durante el arrastre

    const { x, y } = getSVGCoordinates(event)
    console.log(`Clic en canvas: (${x}, ${y}), modo: ${creationMode}`)

    if (!isValidPosition(x, y)) {
      console.log(`Posición inválida: (${x}, ${y})`)
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
      const visualRuedoRadius = ruedo.radius * 2
      const minDistance = visualRuedoRadius + 50
      const maxDistance = maxRadius - 50

      toast({
        title: "Posición inválida",
        description: `El asiento debe estar entre ${minDistance.toFixed(0)}px y ${maxDistance.toFixed(0)}px del centro. Distancia actual: ${distance.toFixed(0)}px`,
        variant: "destructive",
      })
      return
    }

    if (creationMode === "single") {
      console.log(`Agregando asiento en: (${x}, ${y})`)
      addSeatAtPosition(x, y)
    } else if (creationMode === "line") {
      console.log(`Manejando línea en: (${x}, ${y}), isCreatingLine: ${isCreatingLine}`)
      handleLineCreation(x, y)
    }
  }

  // Agregar asiento en posición específica
  const addSeatAtPosition = (x: number, y: number) => {
    const zoneInfo = getZoneInfo(selectedZone)
    const seatNumber = getNextSeatNumber(selectedRowLetter)

    const newSeat: CreatedSeat = {
      id: generateId(),
      x,
      y,
      zone: selectedZone,
      zoneName: zoneInfo.name,
      color: zoneInfo.color,
      price: zoneInfo.price,
      status: "available",
      rowLetter: selectedRowLetter,
      seatNumber,
    }

    setCreatedSeats((prev) => [...prev, newSeat])
    toast({
      title: "Asiento agregado",
      description: `Asiento ${selectedRowLetter}${seatNumber} creado en ${zoneInfo.name}`,
    })
  }

  // Manejar creación de línea
  const handleLineCreation = (x: number, y: number) => {
    if (!isCreatingLine) {
      // Primer clic: establecer punto inicial
      setLineStartPoint({ x, y })
      setIsCreatingLine(true)
      toast({
        title: "Punto inicial establecido",
        description: "Haz clic y arrastra para crear la línea curva de asientos",
      })
    }
  }

  // Manejar mouse down en el segundo punto
  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (creationMode === "line" && isCreatingLine && lineStartPoint) {
      const { x, y } = getSVGCoordinates(event)
      console.log(`Mouse down en: (${x}, ${y})`)

      // Eliminar la validación de posición para el segundo punto
      setLineEndPoint({ x, y })
      setIsDraggingCurve(true)
      setCurrentCurveAngle(0)

      // Generar preview inicial (línea recta)
      const count = Number.parseInt(seatCount) || 5
      const seats = generateCurvePreview(lineStartPoint, { x, y }, 0, count)
      setPreviewSeats(seats)
      setPreviewCurvePath(generateCurvePath(lineStartPoint, { x, y }, 0))
    }
  }

  // Manejar movimiento del mouse
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (creationMode === "line" && isCreatingLine && lineStartPoint) {
      const { x, y } = getSVGCoordinates(event)

      if (isDraggingCurve && lineEndPoint) {
        // Calcular ángulo de curvatura
        const baseVector = { x: lineEndPoint.x - lineStartPoint.x, y: lineEndPoint.y - lineStartPoint.y }
        const cursorVector = { x: x - lineEndPoint.x, y: y - lineEndPoint.y }

        let angle = calculateAngle(baseVector, cursorVector)

        // Invertir el ángulo para que la curva se abra al lado opuesto
        angle = -angle

        // Limitar el ángulo
        angle = Math.max(-maxCurveAngle, Math.min(maxCurveAngle, angle))

        setCurrentCurveAngle(angle)

        // Actualizar preview
        const count = Number.parseInt(seatCount)
        const seats = generateCurvePreview(lineStartPoint, lineEndPoint, angle, count)
        setPreviewSeats(seats)
        setPreviewCurvePath(generateCurvePath(lineStartPoint, lineEndPoint, angle))
      } else {
        // Preview de línea recta
        setPreviewLine({
          x1: lineStartPoint.x,
          y1: lineStartPoint.y,
          x2: x,
          y2: y,
        })
      }
    }
  }

  // Manejar mouse up
  const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingCurve && lineStartPoint && lineEndPoint) {
      createCurvedSeatLine()
    }
  }

  // Crear línea curva de asientos
  const createCurvedSeatLine = () => {
    if (!lineStartPoint || !lineEndPoint) return

    const count = Number.parseInt(seatCount)

    if (count < 2) {
      toast({
        title: "Error",
        description: "Debe haber al menos 2 asientos en la línea.",
        variant: "destructive",
      })
      return
    }

    const zoneInfo = getZoneInfo(selectedZone)
    const lineId = generateId()
    const newSeats: CreatedSeat[] = []

    // Obtener números de asiento consecutivos para esta fila
    const startingSeatNumber = getNextSeatNumber(selectedRowLetter)

    // Generar asientos en la curva
    const seats = generateCurvePreview(lineStartPoint, lineEndPoint, currentCurveAngle, count)

    seats.forEach((seat, index) => {
      const newSeat: CreatedSeat = {
        id: generateId(),
        x: seat.x,
        y: seat.y,
        zone: selectedZone,
        zoneName: zoneInfo.name,
        color: zoneInfo.color,
        price: zoneInfo.price,
        status: "available",
        rowLetter: selectedRowLetter,
        seatNumber: startingSeatNumber + index,
        lineId,
        lineIndex: index,
      }
      newSeats.push(newSeat)
    })

    // Guardar línea
    const newLine: SeatLine = {
      id: lineId,
      name: `Línea ${createdLines.length + 1} (Fila ${selectedRowLetter})`,
      startX: lineStartPoint.x,
      startY: lineStartPoint.y,
      endX: lineEndPoint.x,
      endY: lineEndPoint.y,
      seatCount: count,
      angle: currentCurveAngle,
      zone: selectedZone,
      rowLetter: selectedRowLetter,
    }

    setCreatedSeats((prev) => [...prev, ...newSeats])
    setCreatedLines((prev) => [...prev, newLine])

    // Resetear estado
    resetLineCreation()

    toast({
      title: "Línea de asientos creada",
      description: `${count} asientos creados en Fila ${selectedRowLetter} (${zoneInfo.name})`,
    })
  }

  // Resetear creación de línea
  const resetLineCreation = () => {
    setLineStartPoint(null)
    setLineEndPoint(null)
    setIsCreatingLine(false)
    setIsDraggingCurve(false)
    setCurrentCurveAngle(0)
    setPreviewLine(null)
    setPreviewSeats([])
    setPreviewCurvePath("")
  }

  // Cancelar creación de línea
  const cancelLineCreation = () => {
    resetLineCreation()
    toast({
      title: "Creación cancelada",
      description: "Se canceló la creación de la línea de asientos",
    })
  }

  // Manejar clic en asiento existente
  const handleSeatClick = useCallback(
    (event: React.MouseEvent, seatId: string) => {
      event.stopPropagation()
      if (creationMode === "select") {
        setSelectedSeats((prev) => (prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]))
      } else if (creationMode === "edit") {
        const seat = createdSeats.find(s => s.id === seatId)
        if (seat) {
          if (seat.lineId) {
            // Es parte de una línea
            const line = createdLines.find(l => l.id === seat.lineId)
            if (line) {
              setEditingMode("line")
              setEditingLine(line)
              setEditCoordinates({
                x: seat.x,
                y: seat.y,
                startX: line.startX,
                startY: line.startY,
                endX: line.endX,
                endY: line.endY,
                angle: line.angle,
                seatCount: line.seatCount
              })
            }
          } else {
            // Es un asiento individual
            setEditingMode("seat")
            setEditingSeat(seat)
            setEditCoordinates({
              ...editCoordinates,
              x: seat.x,
              y: seat.y
            })
          }
        }
      }
    },
    [creationMode, createdSeats, createdLines, editCoordinates],
  )

  // Eliminar asientos seleccionados
  const deleteSelectedSeats = () => {
    setCreatedSeats((prev) => prev.filter((seat) => !selectedSeats.includes(seat.id)))
    setSelectedSeats([])
    toast({
      title: "Asientos eliminados",
      description: `Se eliminaron ${selectedSeats.length} asientos`,
    })
  }

  // Eliminar línea completa
  const deleteLine = (lineId: string) => {
    setCreatedSeats((prev) => prev.filter((seat) => seat.lineId !== lineId))
    setCreatedLines((prev) => prev.filter((line) => line.id !== lineId))
    setSelectedSeats((prev) =>
      prev.filter((id) => !createdSeats.find((seat) => seat.id === id && seat.lineId === lineId)),
    )
  }

  // Obtener color del asiento
  const getSeatColor = useCallback(
    (seat: CreatedSeat) => {
      if (selectedSeats.includes(seat.id)) return "#EC4899"
      return seat.color
    },
    [selectedSeats],
  )

  // Exportar configuración
  const exportConfiguration = () => {
    const config = {
      venue: palenqueData.venue,
      ruedo: palenqueData.ruedo,
      createdSeats,
      createdLines,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `palenque-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Configuración exportada",
      description: "El archivo JSON se ha descargado correctamente.",
    })
  }

  // Importar configuración
  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)
        if (config.createdSeats && config.createdLines) {
          setCreatedSeats(config.createdSeats)
          setCreatedLines(config.createdLines)
          toast({
            title: "Configuración importada",
            description: "Los asientos se han cargado correctamente.",
          })
        } else {
          throw new Error("Formato inválido")
        }
      } catch (error) {
        toast({
          title: "Error al importar",
          description: "El archivo no tiene un formato válido.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  // Funciones para modo edición
  const updateSeatCoordinates = () => {
    if (!editingSeat) return

    if (!isValidPosition(editCoordinates.x, editCoordinates.y)) {
      toast({
        title: "Posición inválida",
        description: "Las coordenadas están fuera del área permitida",
        variant: "destructive",
      })
      return
    }

    setCreatedSeats(prev => 
      prev.map(seat => 
        seat.id === editingSeat.id 
          ? { ...seat, x: editCoordinates.x, y: editCoordinates.y }
          : seat
      )
    )

    toast({
      title: "Asiento actualizado",
      description: `Asiento ${editingSeat.rowLetter}${editingSeat.seatNumber} movido a (${editCoordinates.x}, ${editCoordinates.y})`,
    })

    setEditingMode(null)
    setEditingSeat(null)
  }

  const updateLineCoordinates = () => {
    if (!editingLine) return

    // Regenerar asientos en la línea con las nuevas coordenadas
    const seats = generateCurvePreview(
      { x: editCoordinates.startX, y: editCoordinates.startY },
      { x: editCoordinates.endX, y: editCoordinates.endY },
      editCoordinates.angle,
      editCoordinates.seatCount
    )

    // Actualizar la línea
    setCreatedLines(prev =>
      prev.map(line =>
        line.id === editingLine.id
          ? {
              ...line,
              startX: editCoordinates.startX,
              startY: editCoordinates.startY,
              endX: editCoordinates.endX,
              endY: editCoordinates.endY,
              angle: editCoordinates.angle,
              seatCount: editCoordinates.seatCount
            }
          : line
      )
    )

    // Actualizar los asientos de la línea
    const lineSeats = createdSeats.filter(seat => seat.lineId === editingLine.id)
    const updatedSeats = seats.map((seat, index) => {
      const originalSeat = lineSeats[index]
      return originalSeat ? {
        ...originalSeat,
        x: seat.x,
        y: seat.y
      } : null
    }).filter(Boolean) as CreatedSeat[]

    setCreatedSeats(prev => [
      ...prev.filter(seat => seat.lineId !== editingLine.id),
      ...updatedSeats
    ])

    toast({
      title: "Línea actualizada",
      description: `Línea ${editingLine.name} actualizada con ${editCoordinates.seatCount} asientos`,
    })

    setEditingMode(null)
    setEditingLine(null)
  }

  const cancelEdit = () => {
    setEditingMode(null)
    setEditingSeat(null)
    setEditingLine(null)
    setEditCoordinates({
      x: 0,
      y: 0,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      angle: 0,
      seatCount: 5
    })
  }

  // Limpiar todo
  const clearAll = () => {
    setCreatedSeats([])
    setCreatedLines([])
    setSelectedSeats([])
    resetLineCreation()
    cancelEdit()
    toast({
      title: "Configuración limpiada",
      description: "Todos los asientos han sido eliminados.",
    })
  }

  // Parsear viewBox actual
  const currentViewBox = useMemo(() => {
    try {
      const parts = viewBox.split(" ").map(Number)
      if (parts.length === 4) {
        return {
          x: parts[0],
          y: parts[1],
          width: parts[2],
          height: parts[3],
        }
      }
      return { x: 0, y: 0, width: svgWidth, height: svgHeight }
    } catch (error) {
      console.error("Error al parsear viewBox:", error)
      return { x: 0, y: 0, width: svgWidth, height: svgHeight }
    }
  }, [viewBox, svgWidth, svgHeight])

  // Memorizar los asientos visibles
  const visibleSeats = useMemo(() => {
    return createdSeats.filter((seat) => isSeatInViewport(seat, currentViewBox))
  }, [createdSeats, currentViewBox])

  // Memorizar el cálculo de asientos por fila
  const seatsByRow = useMemo(() => {
    return createdSeats.reduce(
      (acc, seat) => {
        if (!acc[seat.rowLetter]) acc[seat.rowLetter] = []
        acc[seat.rowLetter].push(seat)
        return acc
      },
      {} as Record<string, CreatedSeat[]>,
    )
  }, [createdSeats])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Panel lateral izquierdo */}
      <div className="w-96 bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Creador de Mapas de Asientos</h1>
          <p className="text-gray-600 text-sm">Haz clic en el canvas para agregar asientos</p>
        </div>

        {/* Modos de creación */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-800 mb-4">Modo de Creación</h3>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant={creationMode === "single" ? "default" : "outline"}
              onClick={() => {
                setCreationMode("single")
                resetLineCreation()
                cancelEdit()
              }}
              className="justify-start"
            >
              <MousePointer className="w-4 h-4 mr-2" />
              Asiento Individual
            </Button>
            <Button
              variant={creationMode === "line" ? "default" : "outline"}
              onClick={() => {
                setCreationMode("line")
                setSelectedSeats([])
                cancelEdit()
              }}
              className="justify-start"
            >
              <Move3D className="w-4 h-4 mr-2" />
              Línea de Asientos
            </Button>
            <Button
              variant={creationMode === "select" ? "default" : "outline"}
              onClick={() => {
                setCreationMode("select")
                resetLineCreation()
                cancelEdit()
              }}
              className="justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Seleccionar/Editar
            </Button>
            <Button
              variant={creationMode === "edit" ? "default" : "outline"}
              onClick={() => {
                setCreationMode("edit")
                resetLineCreation()
                setSelectedSeats([])
              }}
              className="justify-start"
            >
              <MousePointer className="w-4 h-4 mr-2" />
              Modo Edición
            </Button>
          </div>

          {/* Cancelar línea si está en progreso */}
          {isCreatingLine && (
            <Button variant="outline" onClick={cancelLineCreation} className="w-full mt-3">
              Cancelar Línea
            </Button>
          )}
        </div>

        {/* Modo Edición */}
        {creationMode === "edit" && (
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-800 mb-4">Modo Edición</h3>
            
            {editingMode === null && (
              <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                Haz clic en un asiento para editarlo. Si pertenece a una línea, podrás editar toda la línea.
              </div>
            )}

            {/* Editar Asiento Individual */}
            {editingMode === "seat" && editingSeat && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">
                  Editando Asiento {editingSeat.rowLetter}{editingSeat.seatNumber}
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-x">Coordenada X</Label>
                    <Input
                      id="edit-x"
                      type="number"
                      value={editCoordinates.x}
                      onChange={(e) => setEditCoordinates(prev => ({ ...prev, x: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-y">Coordenada Y</Label>
                    <Input
                      id="edit-y"
                      type="number"  
                      value={editCoordinates.y}
                      onChange={(e) => setEditCoordinates(prev => ({ ...prev, y: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={updateSeatCoordinates} className="flex-1">
                    Aplicar Cambios
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Editar Línea de Asientos */}
            {editingMode === "line" && editingLine && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">
                  Editando {editingLine.name}
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startX">Coordenada X Inicio</Label>
                    <Input
                      id="edit-startX"
                      type="number"
                      value={editCoordinates.startX}
                      onChange={(e) => setEditCoordinates(prev => ({ ...prev, startX: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-startY">Coordenada Y Inicio</Label>
                    <Input
                      id="edit-startY"
                      type="number"
                      value={editCoordinates.startY}
                      onChange={(e) => setEditCoordinates(prev => ({ ...prev, startY: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-endX">Coordenada X Fin</Label>
                    <Input
                      id="edit-endX"
                      type="number"
                      value={editCoordinates.endX}
                      onChange={(e) => setEditCoordinates(prev => ({ ...prev, endX: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endY">Coordenada Y Fin</Label>
                    <Input
                      id="edit-endY"
                      type="number"
                      value={editCoordinates.endY}
                      onChange={(e) => setEditCoordinates(prev => ({ ...prev, endY: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-angle">Ángulo</Label>
                    <Input
                      id="edit-angle"
                      type="number"
                      min={-60}
                      max={60}
                      step="0.1"
                      value={editCoordinates.angle}
                      onChange={(e) => setEditCoordinates(prev => ({ ...prev, angle: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-seatCount">Número de Asientos</Label>
                    <Input
                      id="edit-seatCount"
                      type="number"
                      min="2"
                      max="20"
                      value={editCoordinates.seatCount}
                      onChange={(e) => setEditCoordinates(prev => ({ ...prev, seatCount: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={updateLineCoordinates} className="flex-1">
                    Aplicar Cambios
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuración */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-800 mb-4">Configuración</h3>
          <div className="space-y-4">
            {/* Selector de zona */}
            <div className="space-y-2">
              <Label htmlFor="zone-select">Zona para nuevos asientos</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {palenqueData.zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                        {zone.name} - ${zone.price}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de fila */}
            <div className="space-y-2">
              <Label htmlFor="row-select">Letra de fila</Label>
              <Select value={selectedRowLetter} onValueChange={setSelectedRowLetter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rowOptions.map((letter) => (
                    <SelectItem key={letter} value={letter}>
                      Fila {letter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Configuración específica para líneas */}
            {creationMode === "line" && (
              <div className="space-y-2">
                <Label htmlFor="seat-count">Número de asientos</Label>
                <Input
                  id="seat-count"
                  type="number"
                  min="2"
                  max="20"
                  value={seatCount}
                  onChange={(e) => setSeatCount(e.target.value)}
                  placeholder="5"
                />
                <p className="text-xs text-gray-500">
                  Los asientos se numerarán consecutivamente en la fila {selectedRowLetter}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Asientos creados */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Asientos Creados ({createdSeats.length})</h3>
            <div className="flex gap-2">
              {selectedSeats.length > 0 && (
                <Button variant="destructive" size="sm" onClick={deleteSelectedSeats}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearAll}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Asientos seleccionados */}
          {selectedSeats.length > 0 && (
            <div className="mb-4 p-3 bg-pink-50 rounded-lg">
              <p className="text-sm font-medium text-pink-800 mb-2">
                {selectedSeats.length} asiento(s) seleccionado(s)
              </p>
              <Button variant="destructive" size="sm" onClick={deleteSelectedSeats} className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Seleccionados
              </Button>
            </div>
          )}

          {/* Lista de líneas */}
          {createdLines.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-700">Líneas</h4>
              {createdLines.map((line) => (
                <div key={line.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="text-sm">
                    <div className="font-medium">{line.name}</div>
                    <div className="text-gray-500">{line.seatCount} asientos</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLine(line.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Lista de asientos agrupados por fila */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(seatsByRow)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([rowLetter, seats]) => (
                <div key={rowLetter} className="p-2 bg-gray-50 rounded">
                  <div className="text-sm font-medium mb-1">
                    Fila {rowLetter} ({seats.length} asientos)
                  </div>
                  <div className="text-xs text-gray-500">
                    Asientos:{" "}
                    {seats
                      .map((s) => s.seatNumber)
                      .sort((a, b) => a - b)
                      .join(", ")}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="p-6">
          <div className="space-y-3">
            <Button onClick={exportConfiguration} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exportar Configuración
            </Button>

            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Importar Configuración
            </Button>

            <input ref={fileInputRef} type="file" accept=".json" onChange={importConfiguration} className="hidden" />
          </div>

          <div className="mt-6 text-xs text-gray-500 space-y-1">
            <p>
              • Área válida: {(ruedo.radius * 2 + 50).toFixed(0)}px - {(maxRadius - 50).toFixed(0)}px del centro
            </p>
            <p>
              • Centro SVG: ({centerX}, {centerY})
            </p>
            <p>• Asientos creados: {createdSeats.length}</p>
            <p>• Ángulo máximo de curvatura: ±{maxCurveAngle}°</p>
            {selectedSeats.length > 0 && <p>• Seleccionados: {selectedSeats.length}</p>}
            <p>• Zoom: {(zoomLevel * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Canvas del mapa - reducir padding */}
      <div className="flex-1 p-2 overflow-auto">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Canvas del Palenque</CardTitle>
          </CardHeader>
          <CardContent className="h-full p-2">
            <div className="flex justify-center h-full relative">
              {/* Controles de navegación y zoom */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {/* Controles de navegación */}
                <div className="bg-white rounded-lg shadow-md p-2">
                  <div className="grid grid-cols-3 gap-1">
                    <div></div>
                    <Button variant="outline" size="sm" onClick={panUp} className="h-8 w-8 p-0">
                      ↑
                    </Button>
                    <div></div>
                    <Button variant="outline" size="sm" onClick={panLeft} className="h-8 w-8 p-0">
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetView}
                      className="h-8 w-8 p-0"
                      title="Centrar vista"
                    >
                      ⌂
                    </Button>
                    <Button variant="outline" size="sm" onClick={panRight} className="h-8 w-8 p-0">
                      →
                    </Button>
                    <div></div>
                    <Button variant="outline" size="sm" onClick={panDown} className="h-8 w-8 p-0">
                      ↓
                    </Button>
                    <div></div>
                  </div>
                </div>

                {/* Controles de zoom */}
                <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1">
                  <Button variant="outline" size="sm" onClick={zoomIn} className="h-8 w-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={zoomOut} className="h-8 w-8 p-0">
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Información de zoom y posición */}
                <div className="bg-black/80 text-white text-xs p-2 rounded">
                  <div>Zoom: {(zoomLevel * 100).toFixed(0)}%</div>
                  <div>
                    Pan: ({panX}, {panY})
                  </div>
                </div>
              </div>

              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={viewBox}
                className={`border rounded-lg bg-gray-50 ${
                  creationMode === "single" || creationMode === "line" 
                    ? "cursor-crosshair" 
                    : "cursor-pointer"
                }`}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {/* Círculo de área máxima permitida */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={maxRadius}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="4"
                  strokeDasharray="10,10"
                />

                {/* Área mínima (ruedo + buffer) */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={ruedo.radius * 2 + 40}
                  fill="none"
                  stroke="#FCA5A5"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />

                {/* Ruedo central - usar nuevas coordenadas */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={ruedo.radius * 2} // Duplicar el radio del ruedo
                  fill="#1F2937"
                  stroke="#374151"
                  strokeWidth="6"
                />
                <text x={centerX} y={centerY - 20} textAnchor="middle" fill="white" fontSize="36" fontWeight="bold">
                  RUEDO
                </text>
                <text x={centerX} y={centerY + 30} textAnchor="middle" fill="white" fontSize="28">
                  PALENQUE
                </text>

                {/* Líneas de referencia */}
                <line x1="0" y1={centerY} x2={svgWidth} y2={centerY} stroke="#F3F4F6" strokeWidth="2" />
                <line x1={centerX} y1="0" x2={centerX} y2={svgHeight} stroke="#F3F4F6" strokeWidth="2" />

                {/* Preview de línea recta */}
                {previewLine && !isDraggingCurve && (
                  <line
                    x1={previewLine.x1}
                    y1={previewLine.y1}
                    x2={previewLine.x2}
                    y2={previewLine.y2}
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}

                {/* Preview de curva */}
                {previewCurvePath && isDraggingCurve && (
                  <path d={previewCurvePath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" />
                )}

                {/* Punto inicial de línea */}
                {lineStartPoint && (
                  <circle
                    cx={lineStartPoint.x}
                    cy={lineStartPoint.y}
                    r="8"
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="2"
                  />
                )}

                {/* Punto final de línea (durante arrastre) */}
                {lineEndPoint && isDraggingCurve && (
                  <circle cx={lineEndPoint.x} cy={lineEndPoint.y} r="6" fill="#10B981" stroke="white" strokeWidth="2" />
                )}

                {/* Preview de asientos en curva */}
                {previewSeats.map((seat, index) => (
                  <circle
                    key={`preview-${index}`}
                    cx={seat.x}
                    cy={seat.y}
                    r="5"
                    fill="#3B82F6"
                    fillOpacity="0.6"
                    stroke="#1E40AF"
                    strokeWidth="1"
                  />
                ))}

                {/* Asientos creados - reducir radio */}
                {visibleSeats.map((seat) => (
                  <g key={seat.id}>
                    <circle
                      cx={seat.x}
                      cy={seat.y}
                      r="4"
                      fill={getSeatColor(seat)}
                      stroke={selectedSeats.includes(seat.id) ? "#BE185D" : "#374151"}
                      strokeWidth="1.5"
                      className={`transition-all duration-200 ${
                        creationMode === "select" || creationMode === "edit"
                          ? "cursor-pointer hover:stroke-gray-400 hover:stroke-3"
                          : "pointer-events-none"
                      }`}
                      onClick={(e) => handleSeatClick(e, seat.id)}
                      onMouseEnter={() => setHoveredSeat(seat)}
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
                ))}

                {/* Tooltip para asiento hover */}
                {hoveredSeat && (
                  <g>
                    <rect x="50" y="520" width="250" height="70" fill="rgba(0,0,0,0.9)" rx="8" />
                    <text x="60" y="540" fill="white" fontSize="13" fontWeight="bold">
                      {hoveredSeat.zoneName} - Asiento {hoveredSeat.rowLetter}
                      {hoveredSeat.seatNumber}
                    </text>
                    <text x="60" y="555" fill="white" fontSize="12">
                      Posición: ({hoveredSeat.x}, {hoveredSeat.y})
                    </text>
                    <text x="60" y="570" fill="#10B981" fontSize="12" fontWeight="bold">
                      ${hoveredSeat.price.toFixed(2)} MXN
                    </text>
                    {hoveredSeat.lineId && (
                      <text x="60" y="585" fill="#9CA3AF" fontSize="11">
                        Línea {hoveredSeat.lineIndex! + 1}
                      </text>
                    )}
                  </g>
                )}

                {/* Información de curvatura durante arrastre */}
                {isDraggingCurve && (
                  <g>
                    <rect x="550" y="20" width="200" height="50" fill="rgba(0,0,0,0.8)" rx="8" />
                    <text x="560" y="40" fill="white" fontSize="12" fontWeight="bold">
                      Ángulo: {currentCurveAngle.toFixed(1)}°
                    </text>
                    <text x="560" y="55" fill="#9CA3AF" fontSize="10">
                      Asientos: {seatCount}
                    </text>
                  </g>
                )}

                {/* Coordenadas del centro para referencia */}
                <text x={centerX + 10} y={centerY - 10} fill="#6B7280" fontSize="10">
                  ({centerX}, {centerY})
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
