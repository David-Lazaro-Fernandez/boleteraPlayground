import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Event, getUpcomingEvents } from "@/lib/firebase/events"
import { getVenue, Venue } from "@/lib/firebase/venues"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function UpcomingEventsSection() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [venues, setVenues] = useState<Record<string, Venue>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        const upcomingEvents = await getUpcomingEvents()
        setEvents(upcomingEvents)

        // Obtener información de los venues
        const venuePromises = upcomingEvents.map(event => getVenue(event.lugar_id))
        const venueResults = await Promise.all(venuePromises)
        
        const venuesMap: Record<string, Venue> = {}
        venueResults.forEach((venue, index) => {
          if (venue) {
            venuesMap[upcomingEvents[index].lugar_id] = venue
          }
        })
        setVenues(venuesMap)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const formatDate = (date: Date) => {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
    return {
      month: months[date.getMonth()],
      day: date.getDate().toString().padStart(2, '0')
    }
  }

  const truncateDescription = (description: string, maxLength: number = 80) => {
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength) + '...'
  }

  const handleEventClick = (eventId: string) => {
    router.push(`/eventos/${eventId}`)
  }

  return (
    <section className="py-16 bg-page-bg">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h2 className="text-3xl font-bold text-heading-text mb-4 md:mb-0">Próximos Eventos</h2>

          <div className="flex flex-wrap gap-4">
            <Select>
              <SelectTrigger className="w-32 bg-filter-bg border-input-border">
                <SelectValue placeholder="Días" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-32 bg-filter-bg border-input-border">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concert">Concierto</SelectItem>
                <SelectItem value="theater">Teatro</SelectItem>
                <SelectItem value="sports">Deportes</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-32 bg-filter-bg border-input-border">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="music">Música</SelectItem>
                <SelectItem value="comedy">Comedia</SelectItem>
                <SelectItem value="family">Familiar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-video bg-gray-200 animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 animate-pulse rounded mb-2" />
                  <div className="h-4 bg-gray-200 animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-2xl font-bold text-heading-text mb-2">
                No hay eventos próximos
              </h3>
              <p className="text-gray-600">
                Actualmente no tenemos próximos eventos disponibles. ¡Mantente al pendiente para nuevas fechas!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {events.map((event, index) => {
              const dateInfo = formatDate(event.fecha)
              const venue = venues[event.lugar_id]
              const gradients = [
                'from-cyan-400 to-blue-500',
                'from-orange-400 to-red-500',
                'from-purple-400 to-pink-500',
                'from-pink-400 to-purple-500',
                'from-green-400 to-blue-500',
                'from-blue-400 to-indigo-500'
              ]
              
              return (
                <Card 
                  key={event.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleEventClick(event.id!)}
                >
                  <div className={`aspect-video bg-gradient-to-r ${gradients[index % gradients.length]} relative`}>
                    {event.imagen_url && event.imagen_url !== "https://picsum.photos/200" ? (
                      <img 
                        src={event.imagen_url} 
                        alt={event.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-white text-black">
                        {dateInfo.month}
                      </Badge>
                      <div className="text-white font-bold text-2xl">{dateInfo.day}</div>
                    </div>
                    {event.estado_venta === 'en_preventa' && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-yellow-500 text-black">
                          Preventa
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{event.nombre}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {truncateDescription(event.descripcion)}
                    </p>
                    {venue && (
                      <p className="text-xs text-gray-500">
                        📍 {venue.nombre}, {venue.ciudad}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      🕒 {event.hora}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className="text-center">
            <Button variant="outline" className="border-heading-text text-heading-text hover:bg-heading-text hover:text-white">
              Ver más
            </Button>
          </div>
        )}
      </div>
    </section>
  )
} 