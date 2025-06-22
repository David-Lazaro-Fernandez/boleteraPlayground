import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Facebook, Twitter, Linkedin } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-[#4A5568] text-white">
        <div className="container mx-auto px-6 lg:px-8 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-[#4A5568] font-bold text-sm">🎫</span>
              </div>
              <span className="text-xl font-bold">Boletera</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="hover:text-gray-300 transition-colors">
                Eventos
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                Conciertos
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                Bailes
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                Contacto
              </a>
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-[#4A5568]">
                Login
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#4A5568] to-[#2D3748] text-white py-12">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          {/* Category Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-[#4A5568]"
            >
              ⚽ Deportes
            </Button>
            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-[#4A5568]"
            >
              🎭 Teatro
            </Button>
            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-[#4A5568]"
            >
              🎵 Conciertos
            </Button>
          </div>

          {/* Main Hero Content */}
          <div className="flex justify-center items-center">
            <div className="w-full max-w-4xl">
              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-8 mb-8">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-06-21%20at%207.39.03%E2%80%AFp.m.-SPcOVHWlRxnHHzkqjPr4iSyY5PyMMp.png"
                  alt="Cartel de Santa Concert"
                  className="w-full rounded-lg"
                />
              </div>

              {/* Search Form */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Busca tu evento</label>
                    <Input placeholder="Cartel De Santa" className="bg-white text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Lugar</label>
                    <Input placeholder="Monterrey" className="bg-white text-black" />
                  </div>
                </div>
                <Button className="w-full bg-[#E53E3E] hover:bg-[#C53030] text-white">Buscar</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h2 className="text-3xl font-bold text-[#2D3748] mb-4 md:mb-0">Próximos Eventos</h2>

            <div className="flex flex-wrap gap-4">
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Días" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concert">Concierto</SelectItem>
                  <SelectItem value="theater">Teatro</SelectItem>
                  <SelectItem value="sports">Deportes</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-32">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Event Card 1 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-r from-cyan-400 to-blue-500 relative">
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white text-black">
                    ABR
                  </Badge>
                  <div className="text-white font-bold text-2xl">14</div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">Tampico Fest 2025</h3>
                <p className="text-gray-600 text-sm">
                  Sumérgete en la energía tropical de Tampico con música en vivo, gastronomía local y activ...
                </p>
              </CardContent>
            </Card>

            {/* Event Card 2 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-r from-orange-400 to-red-500 relative">
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white text-black">
                    AGO
                  </Badge>
                  <div className="text-white font-bold text-2xl">20</div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">Otaku & Toys Festival</h3>
                <p className="text-gray-600 text-sm">Directly seated and inside for you to enjoy the show...</p>
              </CardContent>
            </Card>

            {/* Event Card 3 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-r from-purple-400 to-pink-500 relative">
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white text-black">
                    SEP
                  </Badge>
                  <div className="text-white font-bold text-2xl">18</div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">Edgar Oceransky Gira Volver a Abrir la Puerta</h3>
                <p className="text-gray-600 text-sm">
                  El trovador regresa con su gira más íntima y emotiva. Canciones...
                </p>
              </CardContent>
            </Card>

            {/* Event Card 4 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-r from-pink-400 to-purple-500 relative">
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white text-black">
                    ABR
                  </Badge>
                  <div className="text-white font-bold text-2xl">14</div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">Pandora & Flans Inesperado Tour</h3>
                <p className="text-gray-600 text-sm">
                  Las leyendas del pop mexicano unen fuerzas para una noche nostálgica...
                </p>
              </CardContent>
            </Card>

            {/* Event Card 5 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-r from-green-400 to-blue-500 relative">
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white text-black">
                    AGO
                  </Badge>
                  <div className="text-white font-bold text-2xl">20</div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">La Pensión - en Vivo</h3>
                <p className="text-gray-600 text-sm">
                  Los mismos del mediodía pero en versión Podcast, actualizados y reanimados creando...
                </p>
              </CardContent>
            </Card>

            {/* Event Card 6 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-r from-blue-400 to-indigo-500 relative">
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white text-black">
                    SEP
                  </Badge>
                  <div className="text-white font-bold text-2xl">18</div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">EL LAGO DE LOS CISNES ROYAL UKRAINIAN BALLET</h3>
                <p className="text-gray-600 text-sm">
                  Una interpretación magistral del clásico de Tchaikovsky, presen...
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button variant="outline" className="border-[#4A5568] text-[#4A5568] hover:bg-[#4A5568] hover:text-white">
              Ver más
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative">
              <div className="w-full max-w-md mx-auto">
                <svg viewBox="0 0 400 300" className="w-full h-auto">
                  {/* Illustration placeholder - simplified version */}
                  <rect x="50" y="100" width="300" height="150" rx="20" fill="#4A5568" />
                  <circle cx="120" cy="80" r="30" fill="#48BB78" />
                  <circle cx="280" cy="80" r="30" fill="#ED8936" />
                  <rect x="150" y="130" width="100" height="60" rx="10" fill="#E2E8F0" />
                  <circle cx="80" cy="200" r="40" fill="#38B2AC" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-[#2D3748] mb-4">Agenda tu evento con nosotros</h2>
              <p className="text-gray-600 mb-6 text-lg">
                ¿Tienes un concierto, feria o espectáculo en puerta? Únete a nuestra plataforma y llega a miles de
                personas listas para vivir una experiencia inolvidable.
              </p>
              <Button className="bg-[#E53E3E] hover:bg-[#C53030] text-white px-8 py-3 text-lg">Agenda Ahora</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2D3748] text-white py-12">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-[#2D3748] font-bold text-sm">🎫</span>
                </div>
                <span className="text-xl font-bold">Boletera</span>
              </div>
              <p className="text-gray-300 text-sm">
                Boletera es una plataforma global de venta de boletos de autoservicio para espectáculos en vivo que
                permite a cualquier persona crear, compartir, encontrar y asistir a eventos que alimenten sus pasiones y
                enriquezcan sus vidas.
              </p>
            </div>

            {/* Planear Eventos */}
            <div>
              <h3 className="font-bold mb-4">Planear Eventos</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Crear y Configurar
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Vender Boletos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Promoción de
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Asistencia en Línea (RSVP)
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Eventos en Línea
                  </a>
                </li>
              </ul>
            </div>

            {/* Boletera */}
            <div>
              <h3 className="font-bold mb-4">Boletera</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Prensa
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contáctanos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    ¿Cómo funciona?
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Términos
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-bold mb-4">Mantente Al Tanto</h3>
              <p className="text-gray-300 text-sm mb-4">
                Únete a nuestra lista de correo para estar al tanto de nuestros eventos y conciertos más recientes.
              </p>
              <div className="flex gap-2">
                <Input placeholder="Correo Electrónico" className="bg-white text-black flex-1" />
                <Button className="bg-[#E53E3E] hover:bg-[#C53030]">Suscribirse</Button>
              </div>

              {/* Social Media */}
              <div className="flex space-x-4 mt-6">
                <a
                  href="#"
                  className="w-10 h-10 bg-[#4267B2] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-[#1DA1F2] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-[#0077B5] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                >
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
