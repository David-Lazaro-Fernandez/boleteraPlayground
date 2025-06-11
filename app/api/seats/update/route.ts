import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const { selectedSeats } = await request.json()

    // Leer el archivo JSON actual
    const filePath = path.join(process.cwd(), 'data', 'seats-data-palenque-victoria.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const venueData = JSON.parse(fileContent)

    // Actualizar el estado de los asientos seleccionados
    venueData.createdSeats = venueData.createdSeats.map((seat: any) => {
      if (selectedSeats.some((selectedSeat: any) => selectedSeat.id === seat.id)) {
        return { ...seat, status: 'occupied' }
      }
      return seat
    })

    // Guardar el archivo actualizado
    await fs.writeFile(filePath, JSON.stringify(venueData, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al actualizar los asientos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar los asientos' },
      { status: 500 }
    )
  }
}
