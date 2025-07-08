import { Button } from "@/components/ui/button";

interface ZoneConfig {
  name: string;
  price: number;
  color: string;
  selectable: boolean;
  component: React.ComponentType<any>;
}

interface ZonePricesProps {
  zoneConfig: Record<string, ZoneConfig>;
  onAddGeneralTicket: () => void;
}

export function ZonePrices({ zoneConfig, onAddGeneralTicket }: ZonePricesProps) {
  return (
    <>
      <div className="p-6 border-b flex flex-col bg-white w-full">
        <h3 className="font-semibold text-gray-800 mb-4">Precios por Zona</h3>
        <div className="space-y-3">
          {/* General */}
          <div className="flex items-center p-3 rounded-lg border bg-gray-50">
            <div className="flex-1">
              <div className="font-medium text-gray-800">General</div>
              <div className="text-green-600 font-semibold">
                ${zoneConfig["General"].price.toFixed(2)} MXN
              </div>
            </div>
          </div>

          {/* Oro */}
          <div className="flex items-center p-3 rounded-lg border bg-gray-50">
            <div className="flex-1">
              <div className="font-medium text-gray-800">Oro</div>
              <div className="text-green-600 font-semibold">
                ${zoneConfig["Oro 1"].price.toFixed(2)} MXN
              </div>
            </div>
          </div>

          {/* VIP */}
          <div className="flex items-center p-3 rounded-lg border bg-gray-50">
            <div className="flex-1">
              <div className="font-medium text-gray-800">VIP</div>
              <div className="text-green-600 font-semibold">
                ${zoneConfig["VIP 1"].price.toFixed(2)} MXN
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón para zona general */}
      <div className="p-6 border-b hidden md:block">
        <Button
          onClick={onAddGeneralTicket}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Agregar Boleto General - $300 MXN
        </Button>
      </div>
    </>
  );
} 