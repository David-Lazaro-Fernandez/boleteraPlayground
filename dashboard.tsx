"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, DollarSignIcon, TicketIcon, UsersIcon, TrendingUpIcon, DownloadIcon } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { MainLayout } from "@/components/layout/main-layout"
import { getDashboardStats, DashboardStats } from "@/lib/firebase/transactions"
import { format } from "date-fns"

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 15)), // últimos 15 días
    end: new Date()
  })

  useEffect(() => {
    loadDashboardData()
  }, [dateRange])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const data = await getDashboardStats(dateRange.start, dateRange.end)
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
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {format(dateRange.start, "MMM dd, yyyy")} - {format(dateRange.end, "MMM dd, yyyy")}
            </span>
          </div>
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
                <CardTitle>Resumen</CardTitle>
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
                        <p className="text-sm font-medium leading-none">Boleto vendido de forma presencial</p>
                        <p className="text-sm text-gray-500">Venta Fisica</p>
                      </div>
                      <div className="ml-auto font-medium">{formatCurrency(venta.monto)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}
