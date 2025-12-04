"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, ChefHat, Truck, Package, BarChart3, TrendingUp, Activity, Eye, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

interface AdminDashboardProps {
  orders: any[]
  stats: {
    pending: number
    cooking: number
    ready: number
    dispatched: number
  }
  onRefresh: () => void
}

export default function AdminDashboard({ orders, stats, onRefresh }: AdminDashboardProps) {
  const router = useRouter()
  const [chefs, setChefs] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "staff" | "users">("overview")

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [chefsData, driversData, dashboardSummary] = await Promise.all([
        apiClient.admin.getChefs(),
        apiClient.admin.getDrivers(),
        apiClient.dashboard.getSummary(),
      ])

      setChefs(chefsData.chefs || [])
      setDrivers(driversData.drivers || [])
      setDashboardData(dashboardSummary)
    } catch (error: any) {
      console.error("Error loading admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      cooking: "bg-orange-100 text-orange-800",
      packing: "bg-purple-100 text-purple-800",
      ready: "bg-green-100 text-green-800",
      in_delivery: "bg-indigo-100 text-indigo-800",
      dispatched: "bg-indigo-100 text-indigo-800",
      delivered: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      cooking: "Cocinando",
      packing: "Empaquetando",
      ready: "Listo",
      in_delivery: "En Entrega",
      dispatched: "En Ruta",
      delivered: "Entregado",
      cancelled: "Cancelado",
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <img src="/loguito-200millas-Photoroom.png" alt="Cargando" className="w-full h-full object-contain animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <p className="text-[#00408C]">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#F2EEE9]">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "overview"
              ? "text-[#00408C] border-b-2 border-[#00408C]"
              : "text-[#00408C]/60 hover:text-[#00408C]"
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "orders"
              ? "text-[#00408C] border-b-2 border-[#00408C]"
              : "text-[#00408C]/60 hover:text-[#00408C]"
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Pedidos ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "staff"
              ? "text-[#00408C] border-b-2 border-[#00408C]"
              : "text-[#00408C]/60 hover:text-[#00408C]"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Personal ({chefs.length + drivers.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-md rounded-[2rem] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#00408C]/60 font-medium">Total Pedidos</p>
                    <p className="text-3xl font-bold text-[#00408C] mt-1">
                      {dashboardData?.total_orders || orders.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#00408C]/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-[#00408C]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-[2rem] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#00408C]/60 font-medium">En Proceso</p>
                    <p className="text-3xl font-bold text-[#E85234] mt-1">
                      {stats.pending + stats.cooking}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#E85234]/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-[#E85234]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-[2rem] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#00408C]/60 font-medium">Listos</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {stats.ready}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-[2rem] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#00408C]/60 font-medium">Ingresos</p>
                    <p className="text-3xl font-bold text-[#00408C] mt-1">
                      S/. {dashboardData?.total_revenue?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#00408C]/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#00408C]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card className="border-none shadow-md rounded-[2rem] bg-white">
            <CardHeader>
              <CardTitle className="text-[#00408C] flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estado de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <p className="text-2xl font-bold text-yellow-700">{dashboardData?.pending || 0}</p>
                  <p className="text-sm text-yellow-600 mt-1">Pendientes</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <p className="text-2xl font-bold text-orange-700">{dashboardData?.cooking || 0}</p>
                  <p className="text-sm text-orange-600 mt-1">Cocinando</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-700">{dashboardData?.ready || 0}</p>
                  <p className="text-sm text-green-600 mt-1">Listos</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <p className="text-2xl font-bold text-indigo-700">{dashboardData?.in_delivery || 0}</p>
                  <p className="text-sm text-indigo-600 mt-1">En Entrega</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-md rounded-[2rem] bg-white">
              <CardHeader>
                <CardTitle className="text-[#00408C] flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  Chefs ({chefs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chefs.slice(0, 5).map((chef: any) => (
                    <div key={chef.email} className="flex items-center justify-between p-2 bg-[#F2EEE9] rounded-lg">
                      <div>
                        <p className="font-medium text-[#00408C]">{chef.name}</p>
                        <p className="text-xs text-[#00408C]/60">{chef.email}</p>
                      </div>
                    </div>
                  ))}
                  {chefs.length > 5 && (
                    <p className="text-sm text-[#00408C]/60 text-center mt-2">
                      +{chefs.length - 5} más
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-[2rem] bg-white">
              <CardHeader>
                <CardTitle className="text-[#00408C] flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Repartidores ({drivers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {drivers.slice(0, 5).map((driver: any) => (
                    <div key={driver.email} className="flex items-center justify-between p-2 bg-[#F2EEE9] rounded-lg">
                      <div>
                        <p className="font-medium text-[#00408C]">{driver.name}</p>
                        <p className="text-xs text-[#00408C]/60">{driver.email}</p>
                      </div>
                    </div>
                  ))}
                  {drivers.length > 5 && (
                    <p className="text-sm text-[#00408C]/60 text-center mt-2">
                      +{drivers.length - 5} más
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card className="border-none shadow-none bg-[#96ADD6]/20 rounded-3xl h-48 flex items-center justify-center border-2 border-dashed border-[#96ADD6]">
              <div className="text-center opacity-60">
                <Package className="w-12 h-12 mx-auto mb-3 text-[#00408C]" />
                <p className="font-medium">No hay pedidos</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order: any) => {
                const orderId = order.order_id || order.id
                const orderStatus = order.status || "pending"
                
                return (
                  <Card key={orderId} className="border-none shadow-md rounded-[2rem] bg-white hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm font-bold text-[#00408C]/50">Pedido #{orderId?.slice(-8) || orderId}</p>
                          <p className="text-lg font-bold text-[#00408C] mt-1">
                            {order.customer_name || order.customer_id || order.customer || "Cliente"}
                          </p>
                        </div>
                        <Badge className={getStatusColor(orderStatus)}>
                          {getStatusLabel(orderStatus)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        {(order.items || []).slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm text-[#00408C]">
                            <span>{item.quantity || 1}x {item.name || item.item_id}</span>
                            <span className="font-medium">S/. {((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                          </div>
                        ))}
                        {(order.items || []).length > 3 && (
                          <p className="text-xs text-[#00408C]/60">+{(order.items || []).length - 3} más</p>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-[#F2EEE9]">
                        <p className="font-bold text-[#00408C]">
                          Total: S/. {typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}
                        </p>
                        <Link href={`/pedidos/${orderId}`}>
                          <Button variant="outline" size="sm" className="text-[#00408C] border-[#00408C]/20">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === "staff" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-md rounded-[2rem] bg-white">
            <CardHeader>
              <CardTitle className="text-[#00408C] flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Chefs ({chefs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chefs.length === 0 ? (
                  <p className="text-center text-[#00408C]/60 py-8">No hay chefs registrados</p>
                ) : (
                  chefs.map((chef: any) => (
                    <div key={chef.email} className="p-4 bg-[#F2EEE9] rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#00408C]">{chef.name}</p>
                          <p className="text-sm text-[#00408C]/60">{chef.email}</p>
                          {chef.created_at && (
                            <p className="text-xs text-[#00408C]/40 mt-1">
                              Registrado: {new Date(chef.created_at * 1000).toLocaleDateString("es-PE")}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-[#E85234] text-white">Chef</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-[2rem] bg-white">
            <CardHeader>
              <CardTitle className="text-[#00408C] flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Repartidores ({drivers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {drivers.length === 0 ? (
                  <p className="text-center text-[#00408C]/60 py-8">No hay repartidores registrados</p>
                ) : (
                  drivers.map((driver: any) => (
                    <div key={driver.email} className="p-4 bg-[#F2EEE9] rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#00408C]">{driver.name}</p>
                          <p className="text-sm text-[#00408C]/60">{driver.email}</p>
                          {driver.created_at && (
                            <p className="text-xs text-[#00408C]/40 mt-1">
                              Registrado: {new Date(driver.created_at * 1000).toLocaleDateString("es-PE")}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-[#00408C] text-white">Driver</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

