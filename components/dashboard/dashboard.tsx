"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, DollarSignIcon, TicketIcon, UsersIcon, TrendingUpIcon, DownloadIcon } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { MainLayout } from "@/components/layout/main-layout"
import { getDashboardStats, DashboardStats } from "@/lib/firebase/transactions"
import { format, startOfDay, endOfDay } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    loadDashboardData()
  }, [selectedDate])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const data = await getDashboardStats(
        startOfDay(selectedDate),
        endOfDay(selectedDate)
      )
      setStats(data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  return (
    <MainLayout activePage="inicio">
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
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Seleccionar fecha</span>}
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
          <TabsTrigger value="resumen" className="data-[state=active]:bg-gray-100">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="analitica">Analítica</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Ventas Totales</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : formatCurrency(stats?.ventasTotales || 0)}
                </div>
                <p className="text-xs text-green-600">+20.1% comparado al mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Boletos Vendidos</CardTitle>
                <TicketIcon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : `+${stats?.boletosVendidos || 0}`}
                </div>
                <p className="text-xs text-green-600">+180.1% comparado al mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Ventas</CardTitle>
                <UsersIcon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : `+${stats?.totalMovimientos || 0}`}
                </div>
                <p className="text-xs text-green-600">+19% comparado al mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Activos ahora</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : `+${stats?.activosAhora || 0}`}
                </div>
                <p className="text-xs text-green-600">+201 en la última hora</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Recent Sales */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Resumen de Ventas</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={{
                    sales: {
                      label: "Ventas",
                      color: "#3B82F6",
                    },
                  }}
                  className="h-[350px]"
                >
                  <BarChart data={stats?.ventasPorDia || []}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => format(new Date(value), "dd MMM")}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => typeof value === 'number' ? formatCurrency(value) : ''}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p className="text-sm">{format(new Date(payload[0].payload.date), "dd MMM yyyy")}</p>
                              <p className="text-sm font-bold">{formatCurrency(Number(payload[0].value) || 0)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
                <CardDescription>
                  {isLoading 
                    ? "Cargando ventas..."
                    : `Vendiste ${stats?.boletosVendidos || 0} boletos este mes.`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {stats?.ventasRecientes.map((venta, index) => (
                    <div key={index} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="/placeholder.svg?height=36&width=36" />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <TicketIcon className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Venta {venta.tipo_pago === 'cortesia' ? 'de cortesía' : `en ${venta.tipo_pago}`}
                        </p>
                        <p className="text-sm text-gray-500">{format(venta.fecha, "dd MMM yyyy HH:mm")}</p>
                      </div>
                      <div className="ml-auto font-medium">{formatCurrency(venta.monto)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nuevos gráficos */}
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            {/* Corte al Día */}
            <Card>
              <CardHeader>
                <CardTitle>Corte al Día - {format(selectedDate, "dd MMM yyyy")}</CardTitle>
                <CardDescription>Ventas por tipo de pago</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p>Cargando datos...</p>
                  </div>
                ) : stats?.ventasPorTipoPago && (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Efectivo', value: stats.ventasPorTipoPago.efectivo },
                            { name: 'Tarjeta', value: stats.ventasPorTipoPago.tarjeta },
                            { name: 'Cortesía', value: stats.ventasPorTipoPago.cortesia }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border rounded shadow">
                                  <p className="text-sm font-bold">{payload[0].name}</p>
                                  <p className="text-sm">{formatCurrency(Number(payload[0].value) || 0)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Boletos por Zona */}
            <Card>
              <CardHeader>
                <CardTitle>Boletos por Zona - {format(selectedDate, "dd MMM yyyy")}</CardTitle>
                <CardDescription>Cantidad de boletos vendidos por zona</CardDescription>
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
                                  <p className="text-sm font-bold">{payload[0].payload.zona}</p>
                                  <p className="text-sm">{payload[0].value} boletos</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="cantidad" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nuevo gráfico: Boletos por Tipo de Pago */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Boletos por Tipo de Pago - {format(selectedDate, "dd MMM yyyy")}</CardTitle>
                <CardDescription>Cantidad de boletos vendidos por método de pago</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p>Cargando datos...</p>
                  </div>
                ) : stats?.boletosPorTipoPago && (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Efectivo', cantidad: stats.boletosPorTipoPago.efectivo },
                          { name: 'Tarjeta', cantidad: stats.boletosPorTipoPago.tarjeta },
                          { name: 'Cortesía', cantidad: stats.boletosPorTipoPago.cortesia }
                        ]}
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
                        <Bar
                          dataKey="cantidad"
                          radius={[4, 4, 0, 0]}
                        >
                          <Cell fill="#22c55e" /> {/* Efectivo */}
                          <Cell fill="#3b82f6" /> {/* Tarjeta */}
                          <Cell fill="#f59e0b" /> {/* Cortesía */}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabla de Movimientos */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Movimientos Recientes</CardTitle>
                <CardDescription>Detalle de los últimos movimientos realizados</CardDescription>
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
                          <th scope="col" className="px-6 py-3">Fecha</th>
                          <th scope="col" className="px-6 py-3">Tipo de Pago</th>
                          <th scope="col" className="px-6 py-3">Boletos</th>
                          <th scope="col" className="px-6 py-3">Subtotal</th>
                          <th scope="col" className="px-6 py-3">Cargo Servicio</th>
                          <th scope="col" className="px-6 py-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.ventasRecientes.map((venta, index) => (
                          <tr key={index} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">
                              {format(venta.fecha, "dd MMM yyyy HH:mm")}
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
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}
