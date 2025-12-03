"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronLeft, Clock, MapPin, Phone, AlertCircle, ChefHat, Truck, CheckCircle2, Package, ArrowRight, UtensilsCrossed } from "lucide-react"
import Header from "@/components/header"

// Colores Smartech
// Bg: #F2EEE9
// Text: #00408C
// Accent 1: #E85234 (Red)
// Accent 2: #96ADD6 (Blue Light)

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-[#E85234]", icon: Clock },
  cooking: { label: "En Cocina", color: "bg-[#E85234]", icon: ChefHat },
  ready: { label: "Listo", color: "bg-[#96ADD6]", icon: CheckCircle2 },
  dispatched: { label: "En Ruta", color: "bg-[#00408C]", icon: Truck },
  delivered: { label: "Entregado", color: "bg-gray-500", icon: Package },
}

export default function PedidosPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState("")

  // Lógica de Roles
  const userRole = user?.role?.toLowerCase() || ""
  const isDelivery = userRole.includes("repartidor") || userRole.includes("delivery") || userRole === "driver"
  const isChef = userRole.includes("chef") || userRole.includes("cocina")

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
        { value: "ready", label: "Listos" },
        { value: "dispatched", label: "En Ruta" },
        { value: "delivered", label: "Entregados" }
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

  useEffect(() => {
    if (isAuthenticated) {
      loadMockData()
    }
  }, [isAuthenticated])

  const loadMockData = () => {
    setDataLoading(true)
    setTimeout(() => {
      if (isDelivery) {
        // DATOS MOCK REPARTIDOR
        setOrders([
          {
            id: "4821", restaurant: "200 Millas", status: "ready",
            deliveryAddress: "Calle Mayor 45, San Isidro", estimatedTime: "12 min",
            createdAt: new Date(Date.now() - 1800000).toISOString(), customer: "Juan Pérez", phone: "+51 999 888 777",
            items: [{ qty: 2, name: "Ceviche Clásico" }, { qty: 1, name: "Arroz con Mariscos" }], total: 45.50
          },
          {
            id: "4820", restaurant: "200 Millas", status: "dispatched",
            deliveryAddress: "Av. Arequipa 123, Miraflores", estimatedTime: "25 min",
            createdAt: new Date(Date.now() - 3600000).toISOString(), customer: "María García", phone: "+51 999 777 666",
            items: [{ qty: 1, name: "Lomo Saltado" }, { qty: 2, name: "Causa Limeña" }], total: 38.00
          },
          {
            id: "4819", restaurant: "200 Millas", status: "delivered",
            deliveryAddress: "Calle Berlin 78, Miraflores", estimatedTime: null,
            createdAt: new Date(Date.now() - 7200000).toISOString(), customer: "Carlos López", phone: "+51 999 666 555",
            items: [{ qty: 3, name: "Pollo a la Brasa" }], total: 42.00
          }
        ])
      } else if (isChef) {
         // DATOS MOCK CHEF - Pedidos completados (Mis Pedidos)
         setOrders([
            {
              id: "ORD010", restaurant: "200 Millas", status: "ready",
              deliveryAddress: "Mesa 5", estimatedTime: null,
              createdAt: new Date(Date.now() - 3600000).toISOString(), customer: "Carlos Mendoza", phone: "+51 999 111 222",
              items: [{ qty: 1, name: "Ceviche Mixto" }, { qty: 2, name: "Chicha Morada" }], total: 42.00
            },
            {
              id: "ORD009", restaurant: "200 Millas", status: "dispatched",
              deliveryAddress: "Mesa 12", estimatedTime: null,
              createdAt: new Date(Date.now() - 7200000).toISOString(), customer: "Ana López", phone: "+51 999 333 444",
              items: [{ qty: 2, name: "Arroz con Mariscos" }, { qty: 1, name: "Tiradito" }], total: 55.50
            },
            {
              id: "ORD008", restaurant: "200 Millas", status: "delivered",
              deliveryAddress: "Mesa 3", estimatedTime: null,
              createdAt: new Date(Date.now() - 10800000).toISOString(), customer: "Roberto Silva", phone: "+51 999 555 666",
              items: [{ qty: 1, name: "Lomo Saltado" }, { qty: 1, name: "Causa Limeña" }], total: 38.00
            },
            {
              id: "ORD007", restaurant: "200 Millas", status: "ready",
              deliveryAddress: "Mesa 7", estimatedTime: null,
              createdAt: new Date(Date.now() - 5400000).toISOString(), customer: "Laura Fernández", phone: "+51 999 777 888",
              items: [{ qty: 1, name: "Ceviche Clásico" }], total: 28.00
            }
         ])
      } else {
         // Otros roles
         setOrders([
            {
              id: "ORD001", restaurant: "200 Millas", status: "pending",
              deliveryAddress: "Mesa 4", estimatedTime: "15 min",
              createdAt: new Date().toISOString(), customer: "Juan Pérez", phone: "+51 999 888 777",
              items: [{ qty: 2, name: "Ceviche Clásico" }, { qty: 1, name: "Arroz con Mariscos" }], total: 45.50
            }
         ])
      }
      setDataLoading(false)
    }, 500)
  }

  const filteredOrders = orders.filter((order) => {
    return filter === "all" || order.status === filter
  })

  // --- PANTALLA DE CARGA FINAL ---
  if (isLoading || dataLoading) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F2EEE9]">
          <div className="flex items-center gap-4">
            {/* Logo Rojo Girando */}
            <div className="relative w-20 h-20">
               <img 
                 src="/loguito-200millas-Photoroom.png" 
                 alt="Cargando"
                 className="w-full h-full object-contain animate-spin" 
                 style={{ animationDuration: '3s' }}
               />
            </div>
            {/* Texto Cargando . . . */}
            <h1 className="text-5xl font-black text-[#1a1a1a] uppercase animate-pulse" 
                style={{ fontFamily: 'Impact, sans-serif' }}>
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
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        
        {error && (
          <div className="bg-[#E85234]/10 border border-[#E85234]/30 rounded-2xl p-4 mb-6 flex gap-3 text-[#E85234]">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

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
            // Helper para etiquetas
            const getStatusLabel = (status: string) => {
                switch(status) {
                    case "ready": return "Listo";
                    case "dispatched": return "En Ruta";
                    case "delivered": return "Entregado";
                    default: return statusConfig[status]?.label || status;
                }
            };

            const statusInfo = statusConfig[order.status] || { label: order.status, color: "bg-gray-500", icon: Clock }
            const StatusIcon = statusInfo.icon
            const isDelivered = order.status === "delivered"
            
            return (
              <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white rounded-[2rem] overflow-hidden group">
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
                                <h3 className="text-xl font-bold text-[#00408C]">Pedido #{order.id}</h3>
                                <p className="text-sm text-[#00408C]/60 font-medium">{order.customer}</p>
                            </div>
                            <span className="text-lg font-bold text-[#E85234]">S/. {order.total.toFixed(2)}</span>
                        </div>

                        <div className="flex items-start gap-3 bg-[#F2EEE9] p-3 rounded-xl">
                            <MapPin className="w-5 h-5 text-[#00408C] shrink-0 mt-0.5" />
                            <p className="text-sm text-[#00408C] font-medium leading-snug">{order.deliveryAddress}</p>
                        </div>

                        <div className="flex gap-4 text-xs font-medium text-[#00408C]/50 uppercase tracking-wide">
                            <div className="flex items-center gap-1">
                                <UtensilsCrossed className="w-3 h-3" /> {order.items.length} Items
                            </div>
                            {order.estimatedTime && !isDelivered && (
                                <div className="flex items-center gap-1 text-[#E85234]">
                                    <Clock className="w-3 h-3" /> {order.estimatedTime}
                                </div>
                            )}
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="flex md:flex-col gap-3 w-full md:w-auto md:border-l md:border-[#F2EEE9] md:pl-6">
                        {!isDelivered && (
                            <>
                                {/* Botón Ver Detalles con Link */}
                                <Link href={`/pedidos/${order.id}`} className="flex-1 w-full">
                                    <Button className="w-full bg-[#00408C] hover:bg-[#00408C]/90 text-white rounded-xl h-10 shadow-sm">
                                        Ver Detalles <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                                
                                <a href={`tel:${order.phone}`} className="w-full">
                                    <Button variant="outline" className="w-full border-2 border-[#F2EEE9] text-[#00408C] hover:bg-[#F2EEE9] rounded-xl h-10">
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                </a>
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

        {filteredOrders.length === 0 && (
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