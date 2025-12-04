"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import Header from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, Truck, AlertCircle, CheckCircle2, Package, Timer, Flame, UtensilsCrossed, MapPin, Phone, ArrowRight, Navigation, RefreshCw, Wifi, WifiOff, XCircle } from "lucide-react"
import Link from "next/link"

// Colores basados en la paleta proporcionada:
// Fondo: #F2EEE9 (Cream)
// Texto Principal: #00408C (Dark Blue)
// Acento Rojo: #E85234 (Red)
// Acento Azul Claro: #96ADD6 (Blue)
// Acento Peach: #F9B8AF

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user, token } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [inTransitOrders, setInTransitOrders] = useState<any[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    cooking: 0,
    ready: 0,
    dispatched: 0,
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  
  // Ref para WebSocket (solo para Chef)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log("🏠 Page check - isLoading:", isLoading, "isAuthenticated:", isAuthenticated)
    if (!isLoading && !isAuthenticated) {
      console.log("🚪 Redirecting to login...")
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Agregamos (user as any) para que TypeScript deje de quejarse
  const userRole = user?.role?.toLowerCase() || (user as any)?.user_type?.toLowerCase() || ""
  const isChef = userRole === "cook" || userRole === "chef" || userRole.includes("chef") || userRole.includes("cocina")
  const isDelivery = userRole === "driver" || userRole.includes("repartidor") || userRole.includes("delivery")

  // --- WEBSOCKET PARA CHEF CON MANEJO ROBUSTO DE ERRORES ---
  useEffect(() => {
    if (!isAuthenticated || !isChef || !token) return

    // Cargar datos iniciales
    loadOrdersData()

    // Función para conectar WebSocket
    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
      
      // Si no hay URL de WebSocket configurada, solo usar polling
      if (!wsUrl) {
        console.log("⚠️ WebSocket URL no configurada, usando solo polling")
        return
      }

      // Si ya hay una conexión activa, no crear otra
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        return
      }

      try {
        const userId = (user as any)?.user_id || (user as any)?.email?.split('@')[0] || 'chef'
        const ws = new WebSocket(`${wsUrl}?token=${token}&user_id=${userId}&user_type=chef`)
        socketRef.current = ws

        // Timeout para detectar si la conexión falla rápidamente
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.log("⏱️ Timeout de conexión WebSocket - usando polling")
            ws.close()
          }
        }, 5000)

        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          setWsConnected(true)
          console.log("🟢 Chef: Conectado a WebSocket en tiempo real")
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            console.log("📩 Notificación recibida:", message)
            
            // Recargar pedidos cuando hay cambios
            if (message.type === 'order_update' || message.action === 'new_order') {
              console.log("🔄 Actualizando pedidos...")
              loadOrdersData(true) // Recarga silenciosa
            }
          } catch (err) {
            console.error("Error procesando mensaje WS:", err)
          }
        }

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout)
          // No mostrar error si simplemente no está disponible
          console.log("⚠️ WebSocket no disponible - usando polling como respaldo")
        }

        ws.onclose = () => {
          clearTimeout(connectionTimeout)
          setWsConnected(false)
          socketRef.current = null
          
          // No intentar reconectar automáticamente si el servidor no existe
          // El polling se encargará de mantener los datos actualizados
          console.log("🔵 WebSocket cerrado - continuando con polling")
        }
      } catch (error) {
        console.log("⚠️ No se pudo conectar a WebSocket - usando polling")
      }
    }

    // Intentar conectar WebSocket (fallará silenciosamente si no está disponible)
    connectWebSocket()

    // Polling de respaldo cada 15 segundos (más frecuente si no hay WS)
    const pollingInterval = setInterval(() => {
      if (isChef) {
        loadOrdersData(true) // Recarga silenciosa
      }
    }, 15000)

    // Cleanup
    return () => {
      clearInterval(pollingInterval)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [isAuthenticated, isChef, token])

  // Cargar datos cuando es repartidor
  useEffect(() => {
    if (isAuthenticated && isDelivery) {
      loadOrdersData()
      
      // Polling cada 15 segundos para repartidor
      const pollingInterval = setInterval(() => {
        loadOrdersData(true)
      }, 15000)
      
      return () => clearInterval(pollingInterval)
    }
  }, [isAuthenticated, isDelivery])

  const loadOrdersData = async (silent = false) => {
    if (!silent) setDataLoading(true)
    setError(null)
    
    try {
      console.log("📡 Cargando pedidos desde API...")
      
      if (isChef) {
        // Chef: usar endpoint normal
        const data = await apiClient.orders.getAll()
        const ordersArray = Array.isArray(data) ? data : (data.items || data.orders || data.data || [])
        
        console.log("📦 Pedidos recibidos:", ordersArray.length)
        
        // Filtrar solo pedidos relevantes para el chef (pending, cooking)
        const chefOrders = ordersArray.filter((o: any) => 
          ['pending', 'cooking', 'in_progress'].includes(o.status)
        )
        setOrders(chefOrders)
        
        // Calcular stats
        setStats({
          pending: chefOrders.filter((o: any) => o.status === 'pending').length,
          cooking: chefOrders.filter((o: any) => ['cooking', 'in_progress'].includes(o.status)).length,
          ready: ordersArray.filter((o: any) => o.status === 'ready').length,
          dispatched: 0,
        })
        
        console.log("👨‍🍳 Chef - Pedidos activos:", chefOrders.length)
        
      } else if (isDelivery) {
        // Driver: usar endpoints específicos de driver
        const [availableData, assignedData] = await Promise.all([
          apiClient.driver.getAvailable(),
          apiClient.driver.getAssigned(),
        ])
        
        const availableOrders = Array.isArray(availableData) ? availableData : (availableData.items || availableData.orders || [])
        const assignedOrders = Array.isArray(assignedData) ? assignedData : (assignedData.items || assignedData.orders || [])
        
        setOrders(availableOrders)
        setInTransitOrders(assignedOrders)
        setStats({
          pending: 0,
          cooking: 0,
          ready: availableOrders.length,
          dispatched: assignedOrders.length,
        })
        
        console.log("🚚 Delivery - Disponibles:", availableOrders.length, "Asignados:", assignedOrders.length)
      }
      
    } catch (err: any) {
      console.error("❌ Error cargando pedidos:", err)
      setError(err.message || "Error al cargar los pedidos")
    } finally {
      if (!silent) setDataLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`🔄 Actualizando pedido ${orderId} a estado: ${newStatus}`)
      
      // Chef: usar endpoint normal
      if (isChef) {
        await apiClient.orders.updateStatus(orderId, newStatus)
      }
      
      console.log("✅ Estado actualizado exitosamente")
      
      // Recargar datos para reflejar cambios
      loadOrdersData(true)
      
    } catch (error: any) {
      console.error("❌ Error actualizando estado del pedido:", error)
      setError("Error al actualizar el pedido")
      
      // Volver a cargar para asegurar consistencia
      setTimeout(() => loadOrdersData(true), 1000)
    }
  }

  // Función para que el driver recoja un pedido
  const handlePickupOrder = async (orderId: string) => {
    try {
      console.log(`📦 Driver recogiendo pedido: ${orderId}`)
      await apiClient.driver.pickup(orderId)
      console.log("✅ Pedido recogido exitosamente")
      loadOrdersData(true)
    } catch (error: any) {
      console.error("❌ Error al recoger pedido:", error)
      setError("Error al recoger el pedido")
      setTimeout(() => loadOrdersData(true), 1000)
    }
  }

  // Función para completar entrega
  const handleCompleteDelivery = async (orderId: string) => {
    try {
      console.log(`✅ Driver completando entrega: ${orderId}`)
      await apiClient.driver.complete(orderId)
      console.log("✅ Entrega completada exitosamente")
      loadOrdersData(true)
    } catch (error: any) {
      console.error("❌ Error al completar entrega:", error)
      setError("Error al completar la entrega")
      setTimeout(() => loadOrdersData(true), 1000)
    }
  }

  // Función para cancelar entrega
  const handleCancelDelivery = async (orderId: string) => {
    if (!confirm("¿Estás seguro de cancelar esta entrega?")) return
    
    try {
      console.log(`❌ Driver cancelando entrega: ${orderId}`)
      await apiClient.driver.cancel(orderId)
      console.log("✅ Entrega cancelada exitosamente")
      loadOrdersData(true)
    } catch (error: any) {
      console.error("❌ Error al cancelar entrega:", error)
      setError("Error al cancelar la entrega")
      setTimeout(() => loadOrdersData(true), 1000)
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
                {isDelivery ? "Gestiona tus entregas y rutas" : isChef ? "Pedidos actualizados automáticamente" : "Bienvenido al sistema 200 Millas"}
             </p>
             {isChef && (
               <div className="flex items-center gap-2 mt-1">
                 {wsConnected ? (
                   <p className="text-xs text-green-600 flex items-center gap-1">
                     <Wifi className="w-3 h-3" />
                     Tiempo real activo
                   </p>
                 ) : (
                   <p className="text-xs text-[#00408C]/60 flex items-center gap-1">
                     <RefreshCw className="w-3 h-3" />
                     Auto-actualización cada 15s
                   </p>
                 )}
               </div>
             )}
          </div>
          
          <div className="flex gap-3">
             {/* Stats Cards pequeñas estilo pill */}
             <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#E85234]"></div>
                <span className="font-bold">{isDelivery ? stats.ready : stats.pending}</span>
                <span className="text-xs opacity-70 uppercase">{isDelivery ? "Disponibles" : "Pendientes"}</span>
             </div>
             {isDelivery && (
                <div className="bg-[#00408C] text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                    <Truck className="w-3 h-3" />
                    <span className="font-bold">{stats.dispatched}</span>
                    <span className="text-xs opacity-90 uppercase">Mis Entregas</span>
                </div>
             )}
             <Button
               onClick={() => loadOrdersData()}
               variant="outline"
               size="sm"
               className="rounded-full border-[#00408C]/20 hover:bg-[#00408C]/5"
               title="Actualizar pedidos"
             >
               <RefreshCw className="w-4 h-4" />
             </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-800 flex-1">{error}</p>
            <Button
              onClick={() => {
                setError(null)
                loadOrdersData()
              }}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* --- VISTA REPARTIDOR --- */}
        {isDelivery && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Columna Izquierda: Pedidos En Tránsito (Mis Entregas) */}
            <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Truck className="w-5 h-5" /> Mis Entregas
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
                            <p className="font-medium">No tienes entregas activas</p>
                            <p className="text-sm mt-1">Recoge un pedido para comenzar</p>
                        </div>
                    </Card>
                ) : (
                    inTransitOrders.map(order => (
                        <Card key={order.id || order.order_id} className="border-none shadow-md rounded-[2rem] bg-white overflow-hidden relative group">
                            {/* Accent Bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#00408C]"></div>
                            
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className="bg-[#00408C] hover:bg-[#00408C]/90 text-white border-none px-3 py-1">En Ruta</Badge>
                                            <span className="text-sm font-bold text-[#00408C]">{order.id || order.order_id}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#E85234]">{order.customer || order.customer_name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-[#00408C]">{order.deliveryTime || order.estimated_time || '20'} min</p>
                                        <p className="text-xs text-[#00408C]/60">Estimado</p>
                                    </div>
                                </div>

                                <div className="bg-[#F2EEE9] rounded-2xl p-4 mb-4 flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-[#E85234] mt-1 shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-[#00408C] leading-tight">{order.deliveryAddress || order.delivery_address || 'Dirección no disponible'}</p>
                                        <p className="text-sm text-[#00408C]/60 mt-1">Distancia: {order.distance || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <Button 
                                        className="col-span-2 bg-[#E85234] hover:bg-[#E85234]/90 text-white rounded-xl h-12 font-semibold shadow-md shadow-red-200"
                                        onClick={() => handleCompleteDelivery(order.id || order.order_id)}
                                    >
                                        <CheckCircle2 className="w-5 h-5 mr-2" /> Completar
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        className="border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-xl h-12"
                                        onClick={() => handleCancelDelivery(order.id || order.order_id)}
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </Button>
                                </div>

                                <a href={`tel:${order.phone || order.customer_phone}`} className="mt-2 block">
                                    <Button variant="ghost" className="w-full text-[#00408C] hover:bg-[#96ADD6]/10 rounded-xl h-10">
                                        <Phone className="w-4 h-4 mr-2" /> Llamar Cliente
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Columna Derecha: Pedidos Disponibles para Recoger */}
            <div className="lg:col-span-5 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 pl-2">
                    <Package className="w-5 h-5" /> Disponibles para Recoger
                </h2>

                <div className="space-y-4">
                    {orders.length === 0 ? (
                         <div className="text-center py-12 opacity-50">
                            <Package className="w-12 h-12 mx-auto mb-3 text-[#00408C]" />
                            <p className="font-medium">No hay pedidos disponibles</p>
                            <p className="text-sm mt-1">Espera a que cocina termine los pedidos</p>
                         </div>
                    ) : (
                        orders.map(order => (
                            <Card key={order.id || order.order_id} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-[1.5rem] bg-white/60 backdrop-blur-sm">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-center mb-3">
                                        <Badge className="bg-[#96ADD6] text-[#00408C] hover:bg-[#96ADD6] border-none">Listo</Badge>
                                        <span className="font-bold text-[#00408C]">{order.id || order.order_id}</span>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <p className="font-bold text-lg text-[#00408C]">{order.deliveryAddress || order.delivery_address || 'Dirección no disponible'}</p>
                                        <p className="text-sm text-[#00408C]/60">{(order.items || []).length} items • {order.paymentMethod || order.payment_method || 'Efectivo'}</p>
                                    </div>

                                    <Button 
                                        className="w-full bg-[#00408C] hover:bg-[#00408C]/90 text-white rounded-xl h-10 font-medium"
                                        onClick={() => handlePickupOrder(order.id || order.order_id)}
                                    >
                                        Recoger Pedido <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

          </div>
        )}

        {/* --- VISTA CHEF --- */}
        {isChef && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Flame className="w-6 h-6 text-[#E85234]" />
              Pedidos Activos
            </h2>
            {orders.length === 0 ? (
              <Card className="border-none shadow-none bg-[#96ADD6]/20 rounded-3xl h-48 flex items-center justify-center border-2 border-dashed border-[#96ADD6]">
                <div className="text-center opacity-60">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-[#00408C]" />
                  <p className="font-medium">No hay pedidos activos</p>
                  <p className="text-sm mt-1">Los nuevos pedidos aparecerán aquí automáticamente</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map(order => (
                  <Card key={order.id} className="border-none shadow-md rounded-[2rem] bg-white relative overflow-hidden hover:shadow-lg transition-shadow">
                    <div className={`absolute left-0 top-0 w-2 h-full ${(order.status === 'cooking' || order.status === 'in_progress') ? 'bg-[#E85234]' : 'bg-[#96ADD6]'}`}></div>
                    <CardContent className="p-6 pl-8">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-[#00408C]/50">MESA / CLIENTE</span>
                        <span className="font-mono text-[#E85234] font-bold">{order.estimatedTime || order.estimated_time || '15'}m</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#00408C] mb-4">{order.customer || order.customer_name || 'Cliente'}</h3>
                      <div className="space-y-2 mb-6">
                        {(order.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center border-b border-[#F2EEE9] pb-1">
                            <span className="font-medium text-[#00408C]">{item.name || item.product_name}</span>
                            <Badge variant="outline" className="border-[#00408C]/20 text-[#00408C]">x{item.qty || item.quantity || 1}</Badge>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/pedidos/${order.id}`} className="flex-1">
                          <Button className="w-full bg-[#F2EEE9] text-[#00408C] hover:bg-[#e6dfd6] rounded-xl font-bold border-none">
                            Detalles
                          </Button>
                        </Link>
                        <Button 
                          className={`flex-1 rounded-xl font-bold border-none text-white ${(order.status === 'cooking' || order.status === 'in_progress') ? 'bg-[#E85234] hover:bg-[#E85234]/90' : 'bg-[#00408C] hover:bg-[#00408C]/90'}`}
                          onClick={() => updateOrderStatus(order.id, (order.status === 'cooking' || order.status === 'in_progress') ? 'ready' : 'cooking')}
                        >
                          {(order.status === 'cooking' || order.status === 'in_progress') ? 'Terminar' : 'Cocinar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}