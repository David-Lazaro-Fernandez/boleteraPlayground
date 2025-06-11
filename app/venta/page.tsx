'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Venta } from '@/components/palenque/venta'
import type { CreatedSeat } from '@/types/seat'

export default function VentaPage() {
  const searchParams = useSearchParams()
  const [selectedSeats, setSelectedSeats] = useState<CreatedSeat[]>([])
  const [generalTickets, setGeneralTickets] = useState<any[]>([])

  useEffect(() => {
    const selectedSeatsParam = searchParams.get('selectedSeats')
    const generalTicketsParam = searchParams.get('generalTickets')

    if (selectedSeatsParam) {
      setSelectedSeats(JSON.parse(selectedSeatsParam))
    }
    if (generalTicketsParam) {
      setGeneralTickets(JSON.parse(generalTicketsParam))
    }
  }, [searchParams])

  if (!searchParams.get('selectedSeats') && !searchParams.get('generalTickets')) {
    return <div>Cargando...</div>
  }

  return <Venta selectedSeats={selectedSeats} generalTickets={generalTickets} />
} 