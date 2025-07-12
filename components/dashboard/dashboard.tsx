"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  DollarSignIcon,
  TicketIcon,
  UsersIcon,
  TrendingUpIcon,
  DownloadIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MainLayout } from "@/components/dashboardLayout/main-layout";
import {
  getDashboardStats,
  DashboardStats,
} from "@/lib/firebase/transactions";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ReportView from "./report-view";
import TicketSearchView from "./ticket-search-view";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardStats(startOfDay(selectedDate), endOfDay(selectedDate));
      setStats(data);
      console.log(data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
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

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
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
          <Button className="bg-blue-600 hover:bg-blue-700">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumen" className="mb-6">
        <TabsList className="bg-white">
          <TabsTrigger
            value="resumen"
            className="data-[state=active]:bg-gray-100"
          >
            Resumen
          </TabsTrigger>
          <TabsTrigger value="analitica">Analítica</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="buscar-boletos">Buscar Boletos</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
        </TabsList>

        {/* Contenido de Resumen */}
        <TabsContent value="resumen" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Ventas Totales
                </CardTitle>
                <DollarSignIcon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading
                    ? "..."
                    : formatCurrency(stats?.ventasTotales || 0)}
                </div>
                <p className="text-xs text-green-600">
                  +20.1% comparado al mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Boletos Vendidos
                </CardTitle>
                <TicketIcon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : `+${stats?.boletosVendidos || 0}`}
                </div>
                <p className="text-xs text-green-600">
                  +180.1% comparado al mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Ventas
                </CardTitle>
                <UsersIcon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : `+${stats?.totalMovimientos || 0}`}
                </div>
                <p className="text-xs text-green-600">
                  +19% comparado al mes anterior
                </p>
              </CardContent>
            </Card>
          </div>

          

          {/* Nuevos gráficos */}
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            {/* Boletos por Zona (ahora ocupa todo el espacio) */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>
                  Boletos por Zona - {format(selectedDate, "dd MMM yyyy")}
                </CardTitle>
                <CardDescription>
                  Cantidad de boletos vendidos por zona
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p>Cargando datos...</p>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.ventasPorZona || []}>
                        <XAxis
                          dataKey="zona"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border rounded shadow">
                                  <p className="text-sm font-bold">
                                    {payload[0].payload.zona}
                                  </p>
                                  <p className="text-sm">
                                    {payload[0].value} boletos
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="cantidad"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nuevo gráfico: Boletos por Tipo de Pago */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>
                  Boletos por Tipo de Pago - {format(selectedDate, "dd MMM yyyy")}
                </CardTitle>
                <CardDescription>
                  Cantidad de boletos vendidos por método de pago
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p>Cargando datos...</p>
                  </div>
                ) : (
                  stats?.boletosPorTipoPago && (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              name: "Efectivo",
                              cantidad: stats.boletosPorTipoPago.efectivo,
                            },
                            {
                              name: "Tarjeta",
                              cantidad: stats.boletosPorTipoPago.other,
                            },
                            {
                              name: "En Línea",
                              cantidad: stats.boletosEnLinea,
                            },
                          ].filter(item => item.cantidad > 0)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-2 border rounded shadow">
                                    <p className="text-sm font-bold">{payload[0].payload.name}</p>
                                    <p className="text-sm">{payload[0].value} boletos</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                            {[
                              "#22c55e", // Efectivo
                              "#3b82f6", // Tarjeta
                              "#8b5cf6", // En Línea
                            ].map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Nuevo gráfico: Boletos por Hora */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>
                  Boletos por Hora - {format(selectedDate, "dd MMM yyyy")}
                </CardTitle>
                <CardDescription>
                  Cantidad de boletos vendidos por hora (7am - 7pm)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p>Cargando datos...</p>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats?.ventasPorHora || []}>
                        <XAxis
                          dataKey="hora"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}:00`}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border rounded shadow">
                                  <p className="text-sm font-bold">{`${payload[0].payload.hora}:00`}</p>
                                  <p className="text-sm">{`${payload[0].value} boletos`}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="cantidad"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Movimientos */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Movimientos Recientes</CardTitle>
              <CardDescription>
                Detalle de los últimos movimientos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <p>Cargando movimientos...</p>
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Fecha
                        </th>
                        <th scope="col" className="px-6 py-3">
                          ID
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Tipo de Pago
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Boletos
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Subtotal
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Cargo Servicio
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.ventasRecientes.map((venta, index) => (
                        <tr
                          key={index}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            {format(venta.fecha, "dd MMM yyyy HH:mm")}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {venta.id}
                          </td>
                          <td className="px-6 py-4 capitalize">
                            {venta.tipo_pago}
                          </td>
                          <td className="px-6 py-4">
                            {venta.numero_boletos}
                          </td>
                          <td className="px-6 py-4">
                            {formatCurrency(venta.subtotal)}
                          </td>
                          <td className="px-6 py-4">
                            {formatCurrency(venta.cargo_servicio)}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {formatCurrency(venta.monto)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenido de Analítica */}
        <TabsContent value="analitica">
          <Card>
            <CardHeader>
              <CardTitle>Analítica</CardTitle>
              <CardDescription>
                Esta sección está en desarrollo
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        {/* Contenido de Reportes */}
        <TabsContent value="reportes">
          <ReportView />
        </TabsContent>

        {/* Contenido de Búsqueda de Boletos */}
        <TabsContent value="buscar-boletos">
          <TicketSearchView />
        </TabsContent>

        {/* Contenido de Notificaciones */}
        <TabsContent value="notificaciones">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Esta sección está en desarrollo
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
