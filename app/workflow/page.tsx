"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronLeft, User, Clock, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api"
import Header from "@/components/header"

export default function WorkflowPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [workflow, setWorkflow] = useState<any[]>([]) // Tipado básico para evitar errores
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null)
  
  // Ref para controlar si el socket ya está activo y evitar reconexiones dobles
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // --- LÓGICA DE CARGA Y WEBSOCKET ---
  useEffect(() => {
    if (!isAuthenticated) return

    // 1. Carga inicial
    fetchWorkflow()

    // 2. Conexión WebSocket (Para recibir alertas de Step Functions)
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    
    if (wsUrl && !socketRef.current) {
        try {
            const socket = new WebSocket(wsUrl)
            socketRef.current = socket

            socket.onopen = () => {
                console.log("🟢 Workflow Page: Conectado al WebSocket")
            }

            socket.onmessage = (event) => {
                console.log("📩 Actualización recibida:", event.data)
                // Cuando llega CUALQUIER mensaje, recargamos la lista para ver los nuevos estados
                // (Podrías optimizarlo filtrando por ID, pero recargar todo es más seguro por ahora)
                fetchWorkflow(true) // true = recarga silenciosa (sin spinner)
            }

            socket.onerror = (err) => console.error("🔴 Error WS:", err)
            
            socket.onclose = () => {
                console.log("🟡 WS Desconectado")
                socketRef.current = null
            }

        } catch (error) {
            console.error("Error conectando WS:", error)
        }
    }

    // 3. Fallback: Polling cada 10s (Respaldo por si falla el WS)
    const interval = setInterval(() => fetchWorkflow(true), 10000)

    return () => {
        clearInterval(interval)
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }
    }
  }, [isAuthenticated])

  const fetchWorkflow = async (silent = false) => {
    try {
      if (!silent) setDataLoading(true)
      setError("")
      const data = await apiClient.workflow.getSteps("")
      setWorkflow(data || [])
    } catch (err) {
      console.error("[v0] Error fetching workflow:", err)
      if (!silent) setError("Error al cargar el workflow")
    } finally {
      if (!silent) setDataLoading(false)
    }
  }

  const updateWorkflowStep = async (orderId: string, stepId: string, newStatus: string, assignedTo: string) => {
    try {
      setUpdatingStepId(stepId)
      
      // 1. Llamada a la API (Inicia la Step Function o actualiza DB)
      await apiClient.workflow.updateStep(orderId, stepId, {
        status: newStatus,
        assignedTo,
        timestamp: new Date().toISOString(),
      })

      // 2. Actualización Optimista (Para que el usuario vea el cambio ya)
      setWorkflow(
        workflow.map((item) =>
          item.orderId === orderId
            ? {
                ...item,
                steps: item.steps.map((step: any) =>
                  step.id === stepId ? { ...step, status: newStatus, assignedTo } : step,
                ),
              }
            : item,
        ),
      )
      
      // El WebSocket confirmará el cambio real unos milisegundos después

    } catch (err) {
      console.error("[v0] Error updating workflow step:", err)
      setError("Error al actualizar el paso del workflow")
    } finally {
      setUpdatingStepId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200"
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return "✓"
      case "in_progress": return "⏳"
      default: return "○"
    }
  }

  if (isLoading || (dataLoading && workflow.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Conectando con el sistema...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-blue-900 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-blue-800">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Workflow de Pedidos</h1>
              <p className="text-blue-100 mt-1">
                Seguimiento en tiempo real 
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {workflow.map((item) => (
              <Card key={item.orderId} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl text-blue-900">{item.orderId}</CardTitle>
                      <CardDescription className="font-medium text-slate-600">Cliente: {item.customer}</CardDescription>
                    </div>
                    {/* Badge de estado general del pedido */}
                    <Badge variant="outline" className="text-xs">
                        {item.steps?.filter((s:any) => s.status === 'completed').length} / {item.steps?.length} Pasos
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-0 relative pl-2">
                    {/* Línea conectora vertical */}
                    <div className="absolute left-[1.35rem] top-2 bottom-6 w-0.5 bg-slate-200 -z-10"></div>

                    {item.steps?.map((step: any, idx: number) => {
                        const isLast = idx === item.steps.length - 1;
                        return (
                      <div key={idx} className={`flex items-start gap-4 ${!isLast ? 'mb-6' : ''}`}>
                        
                        {/* Círculo indicador */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-all duration-300
                            ${step.status === "completed" ? "bg-green-600 scale-100" : 
                              step.status === "in_progress" ? "bg-blue-600 scale-110 ring-4 ring-blue-50" : "bg-slate-300"}`}
                          >
                            {getStatusIcon(step.status)}
                          </div>
                        </div>

                        {/* Detalles del paso */}
                        <div className="flex-1 pt-1 bg-white/50 rounded-lg p-2 -ml-2">
                          <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                            <div>
                              <p className={`font-bold ${step.status === 'in_progress' ? 'text-blue-700' : 'text-slate-800'}`}>
                                {step.role}
                              </p>
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {step.assignedTo || "Sin asignar"}
                              </p>
                            </div>
                            <Badge className={`${getStatusColor(step.status)} border`}>
                              {step.status === "completed" ? "Completado" : step.status === "in_progress" ? "En Progreso" : "Pendiente"}
                            </Badge>
                          </div>

                          {step.startTime && (
                            <div className="text-xs text-slate-500 flex items-center gap-1 mb-3 font-mono bg-slate-50 w-fit px-2 py-1 rounded">
                              <Clock className="w-3 h-3" />
                              {new Date(step.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                              {step.endTime ? ` - ${new Date(step.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : " ..."}
                            </div>
                          )}

                          {/* Botones de Acción */}
                          <div className="flex gap-2">
                            {step.status === "pending" && (
                                <Button
                                onClick={() => updateWorkflowStep(item.orderId, step.id, "in_progress", "Trabajador")}
                                disabled={updatingStepId === step.id}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 h-8 text-xs shadow-sm"
                                >
                                {updatingStepId === step.id ? "Iniciando..." : "Iniciar Tarea"}
                                </Button>
                            )}
                            {step.status === "in_progress" && (
                                <Button
                                onClick={() => updateWorkflowStep(item.orderId, step.id, "completed", "Trabajador")}
                                disabled={updatingStepId === step.id}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 h-8 text-xs shadow-sm"
                                >
                                {updatingStepId === step.id ? "Finalizando..." : "Completar Tarea"}
                                </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {workflow.length === 0 && !dataLoading && (
            <Card className="border-dashed border-2 bg-slate-50">
              <CardContent className="py-16 text-center">
                <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-600 font-medium">No hay pedidos en el workflow actualmente</p>
                <p className="text-slate-400 text-sm mt-1">Los nuevos pedidos aparecerán aquí automáticamente</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}