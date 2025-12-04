"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import Header from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, ChefHat, Truck, CheckCircle2, Package, Timer, MapPin, Phone, User, UtensilsCrossed, Calendar, CreditCard, History } from "lucide-react"
import Link from "next/link"

// Status configuration
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-[#E85234]", icon: Clock },
  cooking: { label: "En Cocina", color: "bg-[#E85234]", icon: ChefHat },
  in_progress: { label: "En Proceso", color: "bg-[#E85234]", icon: ChefHat },
  ready: { label: "Listo", color: "bg-[#96ADD6]", icon: CheckCircle2 },
  dispatched: { label: "En Ruta", color: "bg-[#00408C]", icon: Truck },
  delivered: { label: "Entregado", color: "bg-gray-500", icon: Package },
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Lógica de Roles
  const userRole = user?.role?.toLowerCase() || (user as any)?.user_type?.toLowerCase() || ""
  const isDelivery = userRole.includes("repartidor") || userRole.includes("delivery") || userRole === "driver"
  const isChef = userRole.includes("chef") || userRole.includes("cocina") || userRole === "cook"

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (params.id) {
      loadOrderDetails(params.id as string)
    }
  }, [params.id])

  const loadOrderDetails = async (orderId: string) => {
    setLoading(true)
    
    try {
      if (isDelivery) {
        // Driver: Usar endpoint /driver/timeline/{order_id}
        console.log(`📡 [Driver] Cargando timeline del pedido ${orderId}`)
        const timelineData = await apiClient.driver.getTimeline(orderId)
        
        // El timeline puede incluir el pedido completo o solo eventos
        if (timelineData.order) {
          setOrder(timelineData.order)
        } else {
          setOrder(timelineData)
        }
        
        // Eventos del timeline
        if (timelineData.events || timelineData.timeline) {
          setTimeline(timelineData.events || timelineData.timeline || [])
        }
        
        console.log("📊 Timeline cargado:", timelineData)
      } else {
        // Chef u otros: usar endpoint genérico
        const data = await apiClient.orders.getById(orderId)
        setOrder(data)
      }
    } catch (err: any) {
      console.error("Error fetching order details:", err)
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F2EEE9] flex items-center justify-center text-[#00408C]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <img src="/loguito-200millas-Photoroom.png" alt="Cargando" className="w-full h-full object-contain animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <p>Cargando detalles...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F2EEE9] text-[#00408C]">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Card className="border-none shadow-md rounded-[2rem] p-8 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-[#00408C]/30" />
            <h2 className="text-2xl font-bold mb-2">Pedido no encontrado</h2>
            <p className="text-[#00408C]/60 mb-6">No se pudo cargar la información del pedido</p>
            <Link href="/pedidos">
              <Button className="bg-[#00408C] hover:bg-[#00408C]/90 text-white rounded-xl">
                Volver a Pedidos
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    )
  }

  const statusInfo = statusConfig[order.status] || { label: order.status, color: "bg-gray-500", icon: Clock }
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-[#F2EEE9] text-[#00408C]">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Breadcrumb / Back */}
        <div className="mb-6">
            <Button 
                variant="ghost" 
                onClick={() => router.back()} 
                className="text-[#00408C] hover:bg-[#00408C]/5 hover:text-[#00408C] pl-0 gap-2 font-medium"
            >
                <ArrowLeft className="w-5 h-5" /> Volver a pedidos
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMNA IZQUIERDA: Detalles Principales */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Header Card */}
                <Card className="border-none shadow-md rounded-[2.5rem] bg-white overflow-hidden">
                    <div className={`h-3 w-full ${statusInfo.color}`}></div>
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-[#00408C]">Pedido #{order.id || order.order_id}</h1>
                                    <Badge className={`${statusInfo.color} text-white border-none px-3 py-1 text-sm`}>
                                        <StatusIcon className="w-3 h-3 mr-1" /> {statusInfo.label}
                                    </Badge>
                                </div>
                                <p className="text-[#00408C]/60 flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(order.createdAt || order.created_at || Date.now()).toLocaleString("es-PE", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-[#00408C]/60 font-medium uppercase tracking-wide">Total</p>
                                <p className="text-3xl font-bold text-[#E85234]">
                                  S/. {typeof order.total === 'number' ? order.total.toFixed(2) : '--'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Cliente */}
                            <div className="bg-[#F2EEE9]/50 p-4 rounded-[1.5rem] border border-[#F2EEE9]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-[#00408C]/10 flex items-center justify-center text-[#00408C]">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#00408C]/50 uppercase">Cliente</p>
                                        <p className="font-bold text-[#00408C]">{order.customer || order.customer_name}</p>
                                    </div>
                                </div>
                                {(order.phone || order.customer_phone) && (
                                  <a href={`tel:${order.phone || order.customer_phone}`}>
                                      <Button variant="outline" className="w-full border-[#96ADD6] text-[#00408C] hover:bg-[#96ADD6]/10 rounded-xl h-10 text-sm">
                                          <Phone className="w-4 h-4 mr-2" /> {order.phone || order.customer_phone}
                                      </Button>
                                  </a>
                                )}
                            </div>

                            {/* Entrega */}
                            <div className="bg-[#F2EEE9]/50 p-4 rounded-[1.5rem] border border-[#F2EEE9]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-[#E85234]/10 flex items-center justify-center text-[#E85234]">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#00408C]/50 uppercase">Dirección</p>
                                        <p className="font-bold text-[#00408C] line-clamp-1" title={order.deliveryAddress || order.delivery_address}>
                                          {order.deliveryAddress || order.delivery_address || "Para llevar"}
                                        </p>
                                    </div>
                                </div>
                                <Button className="w-full bg-[#00408C] hover:bg-[#00408C]/90 text-white rounded-xl h-10 text-sm">
                                    Ver en Mapa
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Items */}
                <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[#00408C] flex items-center gap-2">
                            <UtensilsCrossed className="w-5 h-5" /> Detalles del Pedido
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <div className="divide-y divide-[#F2EEE9]">
                            {(order.items || []).map((item: any, idx: number) => (
                                <div key={idx} className="py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-[#F2EEE9] flex items-center justify-center font-bold text-[#00408C] text-sm">
                                            {item.qty || item.quantity || 1}x
                                        </div>
                                        <span className="font-medium text-[#00408C]">{item.name || item.product_name}</span>
                                    </div>
                                    <span className="font-bold text-[#00408C]">
                                      S/. {((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 pt-6 border-t-2 border-dashed border-[#F2EEE9] flex justify-between items-center">
                            <span className="text-[#00408C]/60 font-medium">Total a cobrar</span>
                            <span className="text-2xl font-bold text-[#00408C]">
                              S/. {typeof order.total === 'number' ? order.total.toFixed(2) : '--'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline para Driver */}
                {isDelivery && timeline.length > 0 && (
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                      <CardHeader className="pb-2">
                          <CardTitle className="text-[#00408C] flex items-center gap-2">
                              <History className="w-5 h-5" /> Historial del Pedido
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-2">
                          <div className="space-y-4">
                              {timeline.map((event: any, idx: number) => (
                                  <div key={idx} className="flex gap-4">
                                      <div className="flex flex-col items-center">
                                          <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-[#E85234]' : 'bg-[#96ADD6]'}`}></div>
                                          {idx < timeline.length - 1 && (
                                              <div className="w-0.5 h-full bg-[#F2EEE9] my-1"></div>
                                          )}
                                      </div>
                                      <div className="flex-1 pb-4">
                                          <p className="font-bold text-[#00408C]">{event.status || event.action}</p>
                                          <p className="text-sm text-[#00408C]/60">
                                              {new Date(event.timestamp || event.created_at).toLocaleString("es-PE", { 
                                                  day: "numeric", 
                                                  month: "short", 
                                                  hour: "2-digit", 
                                                  minute: "2-digit" 
                                              })}
                                          </p>
                                          {event.note && (
                                              <p className="text-sm text-[#00408C]/80 mt-1">{event.note}</p>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </CardContent>
                  </Card>
                )}

            </div>

            {/* COLUMNA DERECHA: Resumen y Acciones */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Tarjeta de Tiempos */}
                <Card className="border-none shadow-sm rounded-[2rem] bg-[#00408C] text-white">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Timer className="w-5 h-5 text-[#96ADD6]" /> Tiempos
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl">
                                <span className="text-sm opacity-80">Estimado</span>
                                <span className="font-bold text-lg">{order.estimatedTime || order.estimated_time || 30} min</span>
                            </div>
                            
                            {order.timeElapsed && (
                                <div>
                                    <div className="flex justify-between text-sm mb-1 opacity-80">
                                        <span>Transcurrido</span>
                                        <span>{order.timeElapsed} min</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#E85234]" 
                                            style={{ width: `${Math.min((order.timeElapsed / (order.estimatedTime || 30)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tarjeta de Pago */}
                <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-[#00408C] mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" /> Pago
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-[#F2EEE9] rounded-xl">
                            <div className={`w-2 h-10 rounded-full ${(order.paymentMethod || order.payment_method) === "Efectivo" ? "bg-[#22c55e]" : "bg-[#3b82f6]"}`}></div>
                            <div>
                                <p className="font-bold text-[#00408C]">{order.paymentMethod || order.payment_method || "No especificado"}</p>
                                <p className="text-xs text-[#00408C]/60">Método de pago</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Botón de Acción Principal */}
                {order.status === "ready" && isDelivery && (
                    <Button 
                      className="w-full h-14 rounded-[1.5rem] bg-[#E85234] hover:bg-[#E85234]/90 text-white text-lg font-bold shadow-lg shadow-red-200"
                      onClick={() => {
                        // Aquí podrías llamar a apiClient.driver.pickup(order.id)
                        console.log("Iniciando entrega...")
                      }}
                    >
                        <Truck className="w-6 h-6 mr-2" /> Iniciar Entrega
                    </Button>
                )}
                
            </div>

        </div>
      </main>
    </div>
  )
}