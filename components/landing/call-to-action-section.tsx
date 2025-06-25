import { Button } from "@/components/ui/button";

export function CallToActionSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-gradient-start to-gradient-end">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="relative">
            <div className="w-full max-w-md mx-auto">
              <svg viewBox="0 0 400 300" className="w-full h-auto">
                <rect
                  x="50"
                  y="100"
                  width="300"
                  height="150"
                  rx="20"
                  fill="#23265D"
                />
                <circle cx="120" cy="80" r="30" fill="#48BB78" />
                <circle cx="280" cy="80" r="30" fill="#ED8936" />
                <rect
                  x="150"
                  y="130"
                  width="100"
                  height="60"
                  rx="10"
                  fill="#E2E8F0"
                />
                <circle cx="80" cy="200" r="40" fill="#38B2AC" />
              </svg>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-text-light mb-4">
              Agenda tu evento con nosotros
            </h2>
            <p className="text-text-light/80 mb-6 text-lg">
              ¿Tienes un concierto, feria o espectáculo en puerta? Únete a
              nuestra plataforma y llega a miles de personas listas para vivir
              una experiencia inolvidable.
            </p>
            <Button className="bg-primary-button hover:bg-primary-button/90 text-white px-8 py-3 text-lg">
              Agenda Ahora
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
