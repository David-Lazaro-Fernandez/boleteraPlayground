"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowUpDown,
  Search,
  FilterIcon,
  CreditCard,
  Banknote,
  Globe,
  Calendar as CalendarIcon,
  DollarSignIcon,
  Copy,
  Check,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getMovements } from "@/lib/firebase/transactions";

interface Movement {
  id: string;
  fecha: Date;
  total: number;
  subtotal: number;
  cargo_servicio: number;
  tipo_pago: "efectivo" | "tarjeta" | "cortesia";
  card_brand?: "visa" | "mastercard" | "amex" | "other";
  buyer_email?: string;
  buyer_name?: string;
  numero_boletos: number;
  payment_method?: string; // Agregamos el campo payment_method
}

export default function ReportView() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMovements();
  }, [selectedDate]);

  const loadMovements = async () => {
    try {
      setIsLoading(true);
      const data = await getMovements(
        startOfDay(selectedDate),
        endOfDay(selectedDate)
      );
      setMovements(data);
    } catch (error) {
      console.error("Error loading movements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const sortMovements = (a: Movement, b: Movement) => {
    if (sortBy === "price") {
      return sortOrder === "asc" ? a.total - b.total : b.total - a.total;
    } else {
      return sortOrder === "asc"
        ? a.fecha.getTime() - b.fecha.getTime()
        : b.fecha.getTime() - a.fecha.getTime();
    }
  };

  const filterMovements = (movement: Movement) => {
    const matchesPaymentType =
      paymentFilter === "all" || movement.tipo_pago === paymentFilter;
    const matchesSearch =
      searchTerm === "" ||
      movement.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.buyer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPaymentType && matchesSearch;
  };

  const getPaymentIcon = (tipo_pago: string) => {
    switch (tipo_pago) {
      case "tarjeta":
        return <CreditCard className="h-4 w-4" />;
      case "efectivo":
        return <Banknote className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPaymentBadgeColor = (tipo_pago: string) => {
    switch (tipo_pago) {
      case "tarjeta":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "efectivo":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "cortesia":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const copyToClipboard = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast({
        description: "ID copiado al portapapeles",
        duration: 2000,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        description: "Error al copiar el ID",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reporte de Movimientos</CardTitle>
            <CardDescription>
              Lista detallada de todas las transacciones realizadas
            </CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumen de Totales */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total
              </CardTitle>
              <DollarSignIcon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? "..."
                  : formatCurrency(
                      movements.reduce((acc, mov) => acc + mov.total, 0)
                    )}
              </div>
              <p className="text-xs text-gray-500">
                {movements.length} movimientos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Efectivo
              </CardTitle>
              <Banknote className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? "..."
                  : formatCurrency(
                      movements
                        .filter((mov) => mov.tipo_pago === "efectivo")
                        .reduce((acc, mov) => acc + mov.total, 0)
                    )}
              </div>
              <p className="text-xs text-gray-500">
                {movements.filter((mov) => mov.tipo_pago === "efectivo").length}{" "}
                pagos en efectivo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tarjetas
              </CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? "..."
                  : formatCurrency(
                      movements
                        .filter((mov) => mov.tipo_pago === "tarjeta")
                        .reduce((acc, mov) => acc + mov.total, 0)
                    )}
              </div>
              <p className="text-xs text-gray-500">
                {movements.filter((mov) => mov.tipo_pago === "tarjeta").length}{" "}
                pagos con tarjeta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                En Línea
              </CardTitle>
              <Globe className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? "..."
                  : formatCurrency(
                      movements
                        .filter((mov) => mov.payment_method !== undefined)
                        .reduce((acc, mov) => acc + mov.total, 0)
                    )}
              </div>
              <p className="text-xs text-gray-500">
                {movements.filter((mov) => mov.payment_method !== undefined).length}{" "}
                pagos en línea
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select
            value={paymentFilter}
            onValueChange={(value) => setPaymentFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="tarjeta">Tarjeta</SelectItem>
              <SelectItem value="cortesia">Cortesía</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              if (sortBy === "price") {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortBy("price");
                setSortOrder("desc");
              }
            }}
          >
            Precio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (sortBy === "date") {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortBy("date");
                setSortOrder("desc");
              }
            }}
          >
            Fecha
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de Pago</TableHead>
                <TableHead>Boletos</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Cargo Servicio</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Cargando movimientos...
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No hay movimientos para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                movements
                  .filter(filterMovements)
                  .sort(sortMovements)
                  .map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(movement.id)}
                                className="font-mono text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
                              >
                                {movement.id.substring(0, 8)}...
                                {copiedId === movement.id ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copiar al portapapeles</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {format(movement.fecha, "dd MMM yyyy HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movement.buyer_name}</p>
                          <p className="text-sm text-gray-500">
                            {movement.buyer_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`flex items-center gap-1 cursor-default transition-none ${getPaymentBadgeColor(
                            movement.tipo_pago
                          )}`}
                        >
                          {getPaymentIcon(movement.tipo_pago)}
                          <span className="capitalize">{movement.tipo_pago}</span>
                          {movement.card_brand && (
                            <span className="uppercase ml-1">
                              ({movement.card_brand})
                            </span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.numero_boletos}</TableCell>
                      <TableCell>{formatCurrency(movement.subtotal)}</TableCell>
                      <TableCell>
                        {formatCurrency(movement.cargo_servicio)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(movement.total)}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 