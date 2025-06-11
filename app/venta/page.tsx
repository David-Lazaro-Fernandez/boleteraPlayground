"use client"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Venta } from "@/components/palenque/venta"
import type { CreatedSeat } from "@/types/seat"
import { dazzleUnicase, gontserrat } from '@/lib/fonts'

// Create a client component that uses useSearchParams
function VentaContent() {
  const searchParams = useSearchParams()
  const [selectedSeats, setSelectedSeats] = useState<CreatedSeat[]>([])
  const [generalTickets, setGeneralTickets] = useState<any[]>([])

  useEffect(() => {
    const selectedSeatsParam = searchParams.get("selectedSeats")
    const generalTicketsParam = searchParams.get("generalTickets")

    if (selectedSeatsParam) {
      setSelectedSeats(JSON.parse(selectedSeatsParam))
    }
    if (generalTicketsParam) {
      setGeneralTickets(JSON.parse(generalTicketsParam))
    }
  }, [searchParams])

  if (!searchParams.get("selectedSeats") && !searchParams.get("generalTickets")) {
    return <div>Cargando...</div>
  }

  return (
    <div className={`${dazzleUnicase.variable} ${gontserrat.variable}`}>
      <Venta selectedSeats={selectedSeats} generalTickets={generalTickets} />
    </div>
  )
}

// Main page component with Suspense boundary
export default function VentaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando datos...</div>}>
      <VentaContent />
    </Suspense>
  )
}
