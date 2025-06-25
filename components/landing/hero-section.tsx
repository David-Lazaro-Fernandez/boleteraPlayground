import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const categories = [
    { name: "Deportes", icon: "⚽" },
    { name: "Teatro", icon: "🎭" },
    { name: "Conciertos", icon: "🎵" },
  ];

  const inputs = [
    {
      name: "Busca tu evento",
      placeholder: "Cartel De Santa",
      type: "text",
      key: "event",
    },
    { name: "Lugar", placeholder: "Monterrey", type: "text", key: "location" },
  ];

  return (
    <section className="bg-gradient-to-br from-gradient-end to-gradient-start text-white py-12">
      <div className="mx-auto px-6 lg:px-8 max-w-7xl">
        {/* Category Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {categories.map((category) => (
            <SectionButton
              key={category.name}
              name={category.name}
              icon={category.icon}
            />
          ))}
        </div>

        {/* Main Hero Content */}
        <div className="flex justify-center items-center">
          <div className="w-full ">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-8 mb-8">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-06-21%20at%207.39.03%E2%80%AFp.m.-SPcOVHWlRxnHHzkqjPr4iSyY5PyMMp.png"
                alt="Cartel de Santa Concert"
                className="w-full rounded-lg"
              />
            </div>

            {/* Search Form */}
            <div className="bg-section-bg backdrop-blur-sm rounded-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
                {inputs.map((input) => (
                  <InputElement key={input.key} input={input} />
                ))}
                <div className="mt-4 md:mt-0">
                  <Button className="w-full bg-primary-button hover:bg-primary-button/80 text-white h-10">
                    Buscar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InputElement({
  input,
}: {
  input: { name: string; placeholder: string; type: string; key: string };
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{input.name}</label>
      <Input
        key={input.key}
        placeholder={input.placeholder}
        type={input.type}
        className={cn(`
          bg-transparent text-white placeholder:text-white placeholder:text-xl placeholder:font-bold  border-b-[1px] border-input-border border-t-0 border-l-0 border-r-0 rounded-none
          focus-visible:outline-none
          focus-visible:ring-0
          focus-visible:ring-offset-0
          focus-visible:shadow-none
          `)}
      />
    </div>
  );
}

function SectionButton({ name, icon }: { name: string; icon: string }) {
  return (
    <Button
      variant="outline"
      className={cn(`
        px-6 py-2
        bg-section-bg border-white rounded-full text-white hover:bg-white hover:text-black
        `)}
    >
      <span className="mr-3">{icon}</span>
      {name}
    </Button>
  );
}
