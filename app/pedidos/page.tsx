"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronLeft, Clock, MapPin, Phone, AlertCircle, ChefHat, Truck, CheckCircle2, Package, ArrowRight, UtensilsCrossed, TrendingUp } from "lucide-react"
import Header from "@/components/header"

// Colores Smartech
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-[#E85234]", icon: Clock },
  cooking: { label: "En Cocina", color: "bg-[#E85234]", icon: ChefHat },
  in_progress: { label: "En Proceso", color: "bg-[#E85234]", icon: ChefHat },
  ready: { label: "Listo", color: "bg-[#96ADD6]", icon: CheckCircle2 },
  dispatched: { label: "En Ruta", color: "bg-[#00408C]", icon: Truck },
  delivered: { label: "Entregado", color: "bg-gray-500", icon: Package },
}

export default function PedidosPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState("all")
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState("")
  
  const socketRef = useRef<WebSocket | null>(null)

  // Lógica de Roles
  const userRole = user?.role?.toLowerCase() || (user as any)?.user_type?.toLowerCase() || ""
  const isDelivery = userRole.includes("repartidor") || userRole.includes("delivery") || userRole === "driver"
  const isChef = userRole.includes("chef") || userRole.includes("cocina") || userRole === "cook"

  // Filtros dinámicos según rol
  const currentFilters = isDelivery 
    ? [
        { value: "all", label: "Todos" },
        { value: "ready", label: "Listo" },
        { value: "dispatched", label: "En Ruta" },
        { value: "delivered", label: "Entregados" }
      ]
    : isChef
    ? [
        { value: "all", label: "Todos" },
        { value: "pending", label: "Pendientes" },
        { value: "cooking", label: "En Cocina" },
        { value: "ready", label: "Listos" }
      ]
    : [
        { value: "all", label: "Todos" },
        { value: "pending", label: "Pendientes" },
        { value: "cooking", label: "En Cocina" }
      ]

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Carga de datos y WebSocket
  useEffect(() => {
    if (!isAuthenticated) return

    fetchOrders()

    // WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    
    if (wsUrl && !socketRef.current) {
        try {
            const socket = new WebSocket(wsUrl)
            socketRef.current = socket

            socket.onopen = () => console.log("🟢 Pedidos: Conectado a WS")
            
            socket.onmessage = (event) => {
                console.log("📩 Cambio en pedidos detectado, actualizando...")
                fetchOrders(true)
            }

            socket.onclose = () => { socketRef.current = null }
        } catch (e) {
            console.error("Error WS", e)
        }
    }

    const interval = setInterval(() => fetchOrders(true), 15000)

    return () => {
        clearInterval(interval)
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }
    }
  }, [isAuthenticated])

  const fetchOrders = async (silent = false) => {
    if (!silent) setDataLoading(true)
    setError("")
    
    try {
        let ordersData
        
        if (isDelivery) {
          // Driver: Usar endpoint específico /driver/assigned
          console.log("📡 [Driver] Cargando pedidos asignados desde /driver/assigned")
          ordersData = await apiClient.driver.getAssigned()
          
          // Cargar stats del driver también
          try {
            const driverStats = await apiClient.driver.getStats()
            setStats(driverStats)
            console.log("📊 Stats del driver:", driverStats)
          } catch (err) {
            console.warn("No se pudieron cargar las estadísticas del driver")
          }
        } else {
          // Chef u otros roles: usar endpoint genérico
          ordersData = await apiClient.orders.getAll()
        }
        
        const ordersArray = Array.isArray(ordersData) ? ordersData : (ordersData.items || ordersData.orders || ordersData.data || [])
        setOrders(ordersArray)
        
        console.log(`📦 Pedidos cargados: ${ordersArray.length}`)

    } catch (err: any) {
        console.error("Error fetching orders:", err)
        if (!silent) {
            setError("Error al cargar pedidos")
        }
    } finally {
        if (!silent) setDataLoading(false)
    }
  }

  // Lógica de filtrado
  const filteredOrders = orders.filter((order) => {
    let orderStatus = order.status
    if (orderStatus === 'in_progress') orderStatus = 'cooking'

    if (filter === "all") {
        if (isChef && orderStatus === "delivered") return false
        return true
    }
    
    if (filter === "cooking" && orderStatus === "in_progress") return true
    
    return orderStatus === filter
  })

  // Renderizado
  if (isLoading || (dataLoading && orders.length === 0)) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F2EEE9]">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
               <img src="/loguito-200millas-Photoroom.png" alt="Cargando" className="w-full h-full object-contain animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-5xl font-black text-[#1a1a1a] uppercase animate-pulse" style={{ fontFamily: 'Impact, sans-serif' }}>
              Cargando . . .
            </h1>
          </div>
        </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#F2EEE9] text-[#00408C]">
      <Header />
      
      {/* Top Bar */}
      <div className="bg-[#00408C] text-white px-6 py-8 rounded-b-[2.5rem] shadow-lg mb-8 relative overflow-hidden">
         <div className="absolute top-[-20%] right-[-5%] w-40 h-40 bg-[#96ADD6]/20 rounded-full blur-2xl"></div>
         <div className="absolute bottom-[-10%] left-10 w-20 h-20 bg-[#E85234]/20 rounded-full blur-xl"></div>

         <div className="max-w-7xl mx-auto flex items-center gap-4 relative z-10">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/10 h-10 w-10 p-0 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                {isDelivery ? <Truck className="w-6 h-6 text-[#96ADD6]" /> : <UtensilsCrossed className="w-6 h-6 text-[#96ADD6]" />}
                <h1 className="text-3xl font-bold tracking-tight">Mis Pedidos</h1>
              </div>
              <p className="text-[#96ADD6]/80 text-sm">
                {isChef && "Panel de Cocina • Gestión de preparación"}
                {isDelivery && "Panel de Reparto • Gestión de rutas"}
                {!isChef && !isDelivery && `Historial de pedidos`}
              </p>
            </div>
            
            {/* Stats para Driver */}
            {isDelivery && stats && (
              <div className="hidden md:flex gap-3">
                <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-[#96ADD6]" />
                    <span className="text-xs opacity-80">Entregas Hoy</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.deliveries_today || 0}</p>
                </div>
                <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-[#96ADD6]" />
                    <span className="text-xs opacity-80">En Ruta</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.active_deliveries || 0}</p>
                </div>
              </div>
            )}
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        
        {/* FILTROS */}
        <div className="mb-8 flex gap-2 flex-wrap">
            {currentFilters.map((opt) => (
              <Button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`rounded-full px-6 h-10 font-medium transition-all ${
                  filter === opt.value 
                    ? "bg-[#00408C] hover:bg-[#00408C]/90 text-white shadow-md" 
                    : "bg-white text-[#00408C] hover:bg-[#00408C]/5 border border-transparent"
                }`}
              >
                {opt.label}
              </Button>
            ))}
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const getStatusLabel = (status: string) => {
                switch(status) {
                    case "ready": return "Listo";
                    case "dispatched": return "En Ruta";
                    case "delivered": return "Entregado";
                    case "in_progress": return "En Cocina";
                    default: return statusConfig[status]?.label || status;
                }
            };

            const statusInfo = statusConfig[order.status] || statusConfig["pending"]
            const StatusIcon = statusInfo.icon
            const isDelivered = order.status === "delivered"
            
            return (
              <Card key={order.id || order.order_id || Math.random()} className="border-none shadow-sm hover:shadow-md transition-all bg-white rounded-[2rem] overflow-hidden group">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  
                  {/* Status Strip */}
                  <div className={`md:w-20 p-4 flex md:flex-col items-center justify-center gap-3 md:gap-6 ${statusInfo.color} text-white`}>
                     <StatusIcon className="w-6 h-6" />
                     <span className="text-[10px] font-bold uppercase tracking-wider md:rotate-[-90deg] md:whitespace-nowrap">
                        {getStatusLabel(order.status)}
                     </span>
                  </div>

                  {/* Info del Pedido */}
                  <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                      
                      <div className="flex-1 space-y-3">
                         <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-[#00408C]">Pedido #{order.id || order.order_id}</h3>
                                <p className="text-sm text-[#00408C]/60 font-medium">{order.customer || order.customer_name || "Cliente Web"}</p>
                            </div>
                            <span className="text-lg font-bold text-[#E85234]">
                                {typeof order.total === 'number' ? `S/. ${order.total.toFixed(2)}` : 'S/. --'}
                            </span>
                        </div>

                        <div className="flex items-start gap-3 bg-[#F2EEE9] p-3 rounded-xl">
                            <MapPin className="w-5 h-5 text-[#00408C] shrink-0 mt-0.5" />
                            <p className="text-sm text-[#00408C] font-medium leading-snug">{order.deliveryAddress || order.delivery_address || "Para llevar"}</p>
                        </div>

                        <div className="flex gap-4 text-xs font-medium text-[#00408C]/50 uppercase tracking-wide">
                            <div className="flex items-center gap-1">
                                <UtensilsCrossed className="w-3 h-3" /> {order.items?.length || 0} Items
                            </div>
                            {order.estimatedTime && !isDelivered && (
                                <div className="flex items-center gap-1 text-[#E85234]">
                                    <Clock className="w-3 h-3" /> {order.estimatedTime}m
                                </div>
                            )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-3 w-full md:w-auto md:border-l md:border-[#F2EEE9] md:pl-6">
                        {!isDelivered && (
                            <>
                                <Link href={`/pedidos/${order.id || order.order_id}`} className="flex-1 w-full">
                                    <Button className="w-full bg-[#00408C] hover:bg-[#00408C]/90 text-white rounded-xl h-10 shadow-sm">
                                        Ver Detalles <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                                
                                {(order.phone || order.customer_phone) && (
                                    <a href={`tel:${order.phone || order.customer_phone}`} className="w-full">
                                        <Button variant="outline" className="w-full border-2 border-[#F2EEE9] text-[#00408C] hover:bg-[#F2EEE9] rounded-xl h-10">
                                            <Phone className="w-4 h-4" />
                                        </Button>
                                    </a>
                                )}
                            </>
                        )}
                        {isDelivered && (
                            <Button variant="outline" disabled className="w-full border-none bg-[#F2EEE9] text-[#00408C]/50 rounded-xl h-10">
                                Completado
                            </Button>
                        )}
                      </div>

                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredOrders.length === 0 && !dataLoading && (
          <Card className="border-none shadow-none bg-transparent mt-12">
            <CardContent className="text-center opacity-50">
              <Package className="w-16 h-16 mx-auto mb-4 text-[#00408C]" />
              <p className="text-[#00408C] text-lg">No se encontraron pedidos con este filtro</p>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  )
}