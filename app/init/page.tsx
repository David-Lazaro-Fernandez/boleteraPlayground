"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createVenue, createEvent, createTicket, createSale, cleanAllCollections } from '@/lib/firebase/transactions'

export default function InitPage() {
  const [loading, setLoading] = useState(false)
  const [cleaningData, setCleaningData] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setLog(prev => [...prev, message])
  }

  const initializeData = async () => {
    try {
      setLoading(true)
      addLog('Iniciando inicialización de datos...')

      // 1. Crear venues
      addLog('Creando venues...')
      const venueIds = await Promise.all([
        createVenue({
          nombre: "Arena Potosí",
          direccion: "Av. Principal #123",
          ciudad: "San Luis Potosí",
          estado: "San Luis Potosí",
          pais: "México"
        }),
        createVenue({
          nombre: "Palenque Victoria",
          direccion: "Carretera 57 #789",
          ciudad: "Victoria",
          estado: "Tamaulipas",
          pais: "México"
        }),
        createVenue({
          nombre: "Auditorio Municipal",
          direccion: "Calle Centro #456",
          ciudad: "San Luis Potosí",
          estado: "San Luis Potosí",
          pais: "México"
        })
      ])
      addLog(`Venues creados: ${venueIds.length}`)

      // 2. Crear eventos
      addLog('Creando eventos...')
      const eventIds = await Promise.all([
        createEvent({
          nombre: "Concierto de Rock en Vivo",
          descripcion: "El mejor concierto de rock del año",
          fecha: new Date("2024-06-15"),
          hora: "20:00",
          lugar_id: venueIds[0],
          estado_venta: "activo",
          venta_en_linea: true,
          imagen_url: "https://picsum.photos/200"
        }),
        createEvent({
          nombre: "Festival de Jazz",
          descripcion: "Una noche de jazz inolvidable",
          fecha: new Date("2024-07-22"),
          hora: "19:00",
          lugar_id: venueIds[1],
          estado_venta: "en_preventa",
          venta_en_linea: true,
          imagen_url: "https://picsum.photos/200"
        }),
        createEvent({
          nombre: "Obra de Teatro: Romeo y Julieta",
          descripcion: "Clásico de Shakespeare",
          fecha: new Date("2024-08-05"),
          hora: "18:30",
          lugar_id: venueIds[2],
          estado_venta: "activo",
          venta_en_linea: true,
          imagen_url: "https://picsum.photos/200"
        })
      ])
      addLog(`Eventos creados: ${eventIds.length}`)

      // 3. Crear boletos
      addLog('Creando boletos...')
      const ticketIds = await Promise.all([
        // Boletos para el primer evento
        createTicket({
          fila: "A",
          asiento: 1,
          zona: "VIP"
        }),
        createTicket({
          fila: "A",
          asiento: 2,
          zona: "VIP"
        }),
        createTicket({
          fila: "B",
          asiento: 1,
          zona: "Preferente"
        })
      ])
      addLog(`Boletos creados: ${ticketIds.length}`)

      // 4. Crear una venta de ejemplo
      addLog('Creando venta de ejemplo...')
      const saleId = await createSale(
        {
          fecha: new Date(),
          subtotal: 1500,
          cargo_servicio: 150,
          total: 1650,
          tipo_pago: 'efectivo'
        },
        [
          {
            ticket: {
              fila: "A",
              asiento: 1,
              zona: "VIP"
            },
            precio: 800
          },
          {
            ticket: {
              fila: "A",
              asiento: 2,
              zona: "VIP"
            },
            precio: 700
          }
        ]
      )
      addLog(`Venta creada con ID: ${saleId}`)

      addLog('¡Inicialización completada con éxito!')
    } catch (error) {
      console.error('Error durante la inicialización:', error)
      addLog(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const cleanData = async () => {
    try {
      setCleaningData(true)
      addLog('Iniciando limpieza de datos...')
      
      await cleanAllCollections()
      
      addLog('¡Limpieza de datos completada con éxito!')
    } catch (error) {
      console.error('Error durante la limpieza:', error)
      addLog(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setCleaningData(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inicialización de Base de Datos</h1>
      
      <div className="flex gap-4 mb-8">
        <Button 
          onClick={initializeData} 
          disabled={loading || cleaningData}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Inicializando...' : 'Inicializar Datos'}
        </Button>

        <Button 
          onClick={cleanData} 
          disabled={loading || cleaningData}
          variant="destructive"
        >
          {cleaningData ? 'Limpiando...' : 'Limpiar Datos'}
        </Button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Log de operaciones:</h2>
        <div className="space-y-1">
          {log.map((message, index) => (
            <p key={index} className="text-sm font-mono">
              {message}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
