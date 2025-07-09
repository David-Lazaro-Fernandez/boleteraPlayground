import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Logo } from "@/components/prueba-boleto/logo";

export function Footer() {
  return (
    <footer className="bg-card-bg text-text-light py-12">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Logo className="w-24 fill-white" />
            </div>
            <p className="text-text-light/80 text-sm w-48">
              Astral Tickets es una plataforma nacional de venta de boletos de
              autoservicio para espectáculos en vivo que permite a cualquier
              persona crear, compartir, encontrar y asistir a eventos que
              alimenten sus pasiones y enriquezcan sus vidas.
            </p>
          </div>

          {/* Planear Eventos */}
          <div>
            <h3 className="font-bold mb-4">Planear Eventos</h3>
            <ul className="space-y-2 text-sm text-text-light/80">
              <li>
                <a href="#" className="hover:text-text-light transition-colors">
                  Vender Boletos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text-light transition-colors">
                  Asistencia en Línea (RSVP)
                </a>
              </li>
              <li>
                <a href="eventos@astraltickets.com" className="hover:text-text-light transition-colors">
                  Eventos en Línea
                </a>
              </li>
            </ul>
          </div>

          {/* Boletera */}
          <div>
            <h3 className="font-bold mb-4">Boletera</h3>
            <ul className="space-y-2 text-sm text-text-light/80">
              <li>
                <a href="#" className="hover:text-text-light transition-colors">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text-light transition-colors">
                  Prensa
                </a>
              </li>
              <li>
                <a href="mailto:contacto@astraltickets.com" className="hover:text-text-light transition-colors">
                  Contáctanos
                </a>
              </li>
              <li>
                <a href="mailto:ayuda@astraltickets.com" className="hover:text-text-light transition-colors">
                  Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text-light transition-colors">
                  ¿Cómo funciona?
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text-light transition-colors">
                  Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-text-light transition-colors">
                  Términos
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold mb-4">Mantente Al Tanto</h3>
            <p className="text-text-light/80 text-sm mb-4">
              Únete a nuestra lista de correo para estar al tanto de nuestros
              eventos y conciertos más recientes.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Correo Electrónico"
                className="bg-white text-black border-input-border flex-1"
              />
              <Button className="bg-primary-button hover:bg-primary-button/90">
                Suscribirse
              </Button>
            </div>

            {/* Social Media */}
            <div className="flex space-x-4 mt-6">
              <a
                href="https://www.facebook.com/astraltickets"
                className="w-10 h-10 bg-[#4267B2] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://x.com/astraltickets"
                className="w-10 h-10 bg-[#1DA1F2] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://www.instagram.com/astraltickets/"
                className="w-10 h-10 bg-[#0077B5] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}