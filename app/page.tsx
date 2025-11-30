"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Header from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, Truck, AlertCircle, CheckCircle2, Package, Timer, Flame, UtensilsCrossed, MapPin, Phone, ArrowRight, Navigation } from "lucide-react"
import Link from "next/link"

// Colores basados en la paleta proporcionada:
// Fondo: #F2EEE9 (Cream)
// Texto Principal: #00408C (Dark Blue)
// Acento Rojo: #E85234 (Red)
// Acento Azul Claro: #96ADD6 (Blue)
// Acento Peach: #F9B8AF

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [inTransitOrders, setInTransitOrders] = useState<any[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    cooking: 0,
    ready: 0,
    dispatched: 0,
  })
  const [dataLoading, setDataLoading] = useState(true)

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
      const userRole = user?.role?.toLowerCase() || ""
      const isChef = userRole === "cook" || userRole.includes("chef") || userRole.includes("cocina")
      const isDelivery = userRole.includes("repartidor") || userRole.includes("delivery") || userRole === "driver"
      
      if (isChef) {
        // Datos mock Chef (Igual que antes)
        setOrders([
          {
            id: "ORD001", customer: "Juan Pérez", phone: "+51 999 888 777", status: "pending", createdAt: new Date().toISOString(),
            items: [{ qty: 2, name: "Ceviche Clásico" }, { qty: 1, name: "Arroz con Mariscos" }], total: 45.50, estimatedTime: 15, priority: "high"
          },
          {
            id: "ORD002", customer: "María García", phone: "+51 999 777 666", status: "cooking", createdAt: new Date(Date.now() - 300000).toISOString(),
            items: [{ qty: 1, name: "Lomo Saltado" }, { qty: 2, name: "Causa Limeña" }], total: 38.00, estimatedTime: 12, timeElapsed: 5, priority: "medium"
          }
        ])
        setStats({ pending: 1, cooking: 1, ready: 0, dispatched: 0 })
      } else if (isDelivery) {
        // DATOS MOCK REPARTIDOR:
        // Pedidos listos para recoger (status: ready)
        setOrders([
          {
            id: "ORD004", customer: "Ana Martínez", phone: "+51 999 555 444", status: "ready", createdAt: new Date(Date.now() - 1800000).toISOString(),
            items: [{ qty: 1, name: "Ceviche Mixto" }, { qty: 2, name: "Chicha Morada" }], total: 35.00,
            deliveryAddress: "Av. Principal 123, San Isidro", deliveryTime: 15, distance: "2.5 km", paymentMethod: "Efectivo"
          },
          {
            id: "ORD006", customer: "Laura Fernández", phone: "+51 999 333 222", status: "ready", createdAt: new Date(Date.now() - 600000).toISOString(),
            items: [{ qty: 1, name: "Arroz con Mariscos" }], total: 42.50,
            deliveryAddress: "Av. Larco 789, San Borja", deliveryTime: 18, distance: "3.8 km", paymentMethod: "Efectivo"
          }
        ])
        // Pedidos que ya tomó (status: dispatched) - simulación inicial
        setInTransitOrders([
           {
            id: "ORD005", customer: "Roberto Silva", phone: "+51 999 444 333", status: "dispatched", createdAt: new Date(Date.now() - 900000).toISOString(),
            items: [{ qty: 2, name: "Lomo Saltado" }], total: 48.00,
            deliveryAddress: "Jr. Los Olivos 456, Miraflores", deliveryTime: 20, distance: "4.2 km", paymentMethod: "Tarjeta", timeElapsed: 8
          }
        ])
        setStats({ pending: 0, cooking: 0, ready: 2, dispatched: 1 })
      }
      setDataLoading(false)
    }, 500)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const userRole = user?.role?.toLowerCase() || ""
    const isDelivery = userRole.includes("repartidor") || userRole.includes("delivery") || userRole === "driver"
    
    // Lógica para mover de "Listos" a "En Tránsito"
    if (isDelivery && newStatus === "dispatched") {
      const selectedOrder = orders.find((order: any) => order.id === orderId)
      if (selectedOrder) {
        setInTransitOrders([...inTransitOrders, { ...selectedOrder, status: "dispatched", timeElapsed: 0 }])
        setOrders(orders.filter((order: any) => order.id !== orderId))
        setStats({ ...stats, ready: stats.ready - 1, dispatched: stats.dispatched + 1 })
      }
    }
    
    // Lógica para finalizar entrega
    if (isDelivery && newStatus === "delivered") {
      setInTransitOrders(inTransitOrders.filter((order: any) => order.id !== orderId))
      setStats({ ...stats, dispatched: stats.dispatched - 1 })
    }
  }

  // --- PANTALLA DE CARGA PERSONALIZADA ---
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
            {/* Texto Cargando */}
            <h1 className="text-5xl font-black text-[#1a1a1a] uppercase animate-pulse" 
                style={{ fontFamily: 'Impact, sans-serif' }}>
              Cargando . . .
            </h1>
          </div>
        </div>
    )
  }

  if (!isAuthenticated) return null

  const userRole = user?.role?.toLowerCase() || ""
  const isChef = userRole === "cook" || userRole.includes("chef") || userRole.includes("cocina")
  const isDelivery = userRole.includes("repartidor") || userRole.includes("delivery") || userRole === "driver"

  return (
    <div className="min-h-screen bg-[#F2EEE9] text-[#00408C]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
             <h1 className="text-4xl font-bold tracking-tight mb-1">
                {isChef ? "Panel de Cocina" : isDelivery ? "Panel de Reparto" : "Dashboard"}
             </h1>
             <p className="text-[#00408C]/70">
                {isDelivery ? "Gestiona tus entregas y rutas" : "Bienvenido al sistema 200 Millas"}
             </p>
          </div>
          
          <div className="flex gap-3">
             {/* Stats Cards pequeñas estilo pill */}
             <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#E85234]"></div>
                <span className="font-bold">{isDelivery ? stats.ready : stats.pending}</span>
                <span className="text-xs opacity-70 uppercase">{isDelivery ? "Listos" : "Pendientes"}</span>
             </div>
             {isDelivery && (
                <div className="bg-[#00408C] text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                    <Truck className="w-3 h-3" />
                    <span className="font-bold">{stats.dispatched}</span>
                    <span className="text-xs opacity-90 uppercase">En Ruta</span>
                </div>
             )}
          </div>
        </div>

        {/* --- VISTA REPARTIDOR --- */}
        {isDelivery && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Columna Izquierda: Pedidos En Tránsito (Prioridad Alta) */}
            <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Truck className="w-5 h-5" /> En Tránsito
                    </h2>
                    <Link href="/dashboard">
                        <Button variant="link" className="text-[#E85234] p-0 h-auto font-semibold">
                            Ver Mapa <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>

                {inTransitOrders.length === 0 ? (
                    <Card className="border-none shadow-none bg-[#96ADD6]/20 rounded-3xl h-48 flex items-center justify-center border-2 border-dashed border-[#96ADD6]">
                        <div className="text-center opacity-60">
                            <Navigation className="w-10 h-10 mx-auto mb-2 text-[#00408C]" />
                            <p>No tienes pedidos en ruta</p>
                        </div>
                    </Card>
                ) : (
                    inTransitOrders.map(order => (
                        <Card key={order.id} className="border-none shadow-md rounded-[2rem] bg-white overflow-hidden relative group">
                            {/* Accent Bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#00408C]"></div>
                            
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className="bg-[#00408C] hover:bg-[#00408C]/90 text-white border-none px-3 py-1">En Ruta</Badge>
                                            <span className="text-sm font-bold text-[#00408C]">{order.id}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#E85234]">{order.customer}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-[#00408C]">{order.deliveryTime} min</p>
                                        <p className="text-xs text-[#00408C]/60">Estimado</p>
                                    </div>
                                </div>

                                <div className="bg-[#F2EEE9] rounded-2xl p-4 mb-4 flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-[#E85234] mt-1 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-[#00408C] leading-tight">{order.deliveryAddress}</p>
                                        <p className="text-sm text-[#00408C]/60 mt-1">Distancia: {order.distance}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button 
                                        className="w-full bg-[#E85234] hover:bg-[#E85234]/90 text-white rounded-xl h-12 font-semibold shadow-md shadow-red-200"
                                        onClick={() => updateOrderStatus(order.id, "delivered")}
                                    >
                                        <CheckCircle2 className="w-5 h-5 mr-2" /> Entregar
                                    </Button>
                                    <a href={`tel:${order.phone}`} className="w-full">
                                        <Button variant="outline" className="w-full border-2 border-[#96ADD6] text-[#00408C] hover:bg-[#96ADD6]/10 rounded-xl h-12 font-semibold">
                                            <Phone className="w-4 h-4 mr-2" /> Llamar
                                        </Button>
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Columna Derecha: Pedidos Listos (Para recoger) */}
            <div className="lg:col-span-5 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 pl-2">
                    <Package className="w-5 h-5" /> Listos para Recoger
                </h2>

                <div className="space-y-4">
                    {orders.filter(o => o.status === "ready").map(order => (
                        <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-[1.5rem] bg-white/60 backdrop-blur-sm">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-center mb-3">
                                    <Badge className="bg-[#96ADD6] text-[#00408C] hover:bg-[#96ADD6] border-none">Listo</Badge>
                                    <span className="font-bold text-[#00408C]">{order.id}</span>
                                </div>
                                
                                <div className="mb-3">
                                    <p className="font-bold text-lg text-[#00408C]">{order.deliveryAddress}</p>
                                    <p className="text-sm text-[#00408C]/60">{order.items.length} items • {order.paymentMethod}</p>
                                </div>

                                <Button 
                                    className="w-full bg-[#00408C] hover:bg-[#00408C]/90 text-white rounded-xl h-10 font-medium"
                                    onClick={() => updateOrderStatus(order.id, "dispatched")}
                                >
                                    Iniciar Ruta <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    
                    {orders.filter(o => o.status === "ready").length === 0 && (
                         <div className="text-center py-8 opacity-50">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                            <p>No hay pedidos pendientes</p>
                         </div>
                    )}
                </div>
            </div>

          </div>
        )}

        {/* --- VISTA CHEF (Mantenida simple para referencia) --- */}
        {isChef && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Ejemplo de tarjeta estilo Smartech para Chef */}
                {orders.map(order => (
                    <Card key={order.id} className="border-none shadow-md rounded-[2rem] bg-white relative overflow-hidden">
                        <div className={`absolute left-0 top-0 w-2 h-full ${order.status === 'cooking' ? 'bg-[#E85234]' : 'bg-[#96ADD6]'}`}></div>
                        <CardContent className="p-6 pl-8">
                             <div className="flex justify-between mb-2">
                                <span className="text-sm font-bold text-[#00408C]/50">MESA / CLIENTE</span>
                                <span className="font-mono text-[#E85234] font-bold">{order.estimatedTime}m</span>
                             </div>
                             <h3 className="text-xl font-bold text-[#00408C] mb-4">{order.customer}</h3>
                             <div className="space-y-2 mb-6">
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center border-b border-[#F2EEE9] pb-1">
                                        <span className="font-medium text-[#00408C]">{item.name}</span>
                                        <Badge variant="outline" className="border-[#00408C]/20 text-[#00408C]">x{item.qty}</Badge>
                                    </div>
                                ))}
                             </div>
                             <div className="flex gap-2">
                                <Button className="flex-1 bg-[#F2EEE9] text-[#00408C] hover:bg-[#e6dfd6] rounded-xl font-bold border-none">
                                    Detalles
                                </Button>
                                <Button className={`flex-1 rounded-xl font-bold border-none text-white ${order.status === 'cooking' ? 'bg-[#E85234] hover:bg-[#E85234]/90' : 'bg-[#00408C] hover:bg-[#00408C]/90'}`}>
                                    {order.status === 'cooking' ? 'Terminar' : 'Cocinar'}
                                </Button>
                             </div>
                        </CardContent>
                    </Card>
                ))}
             </div>
        )}

      </main>
    </div>
  )
}