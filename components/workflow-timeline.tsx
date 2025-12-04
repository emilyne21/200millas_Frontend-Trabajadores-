"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import type { WorkflowStep } from "@/lib/types"

interface WorkflowTimelineProps {
  orderId: string
}

export function WorkflowTimeline({ orderId }: WorkflowTimelineProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Carga inicial
    loadWorkflowSteps()

    // 2. Conexión WebSocket (Tiempo Real)
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    let socket: WebSocket | null = null

    if (wsUrl) {
      try {
        socket = new WebSocket(wsUrl)

        socket.onopen = () => {
          console.log(`🟢 Timeline conectado a WS para pedido: ${orderId}`)
          // Opcional: Suscribirse a este orderId si el backend lo requiere
          // socket.send(JSON.stringify({ action: "subscribe", orderId }))
        }

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            console.log("📩 Notificación recibida:", message)
            
            // Si el mensaje es sobre ESTE pedido, recargamos los pasos
            // (Ajusta 'message.orderId' según cómo responda tu backend real)
            if (message.orderId === orderId || message.detail?.orderId === orderId) {
                loadWorkflowSteps() 
            }
          } catch (e) {
            console.error("Error procesando mensaje WS", e)
          }
        }

        socket.onerror = (error) => console.error("🔴 Error WS:", error)

      } catch (err) {
        console.error("No se pudo conectar al WebSocket", err)
      }
    }

    // 3. Fallback: Polling cada 15s (por si el WebSocket falla o se desconecta)
    const interval = setInterval(loadWorkflowSteps, 15000)

    // Limpieza al desmontar
    return () => {
      clearInterval(interval)
      if (socket) socket.close()
    }
  }, [orderId])

  const loadWorkflowSteps = async () => {
    try {
      const data = await apiClient.workflow.getSteps(orderId)
      setSteps(data || [])
    } catch (error) {
      console.error("Error loading workflow steps:", error)
      // Mock data as fallback (Mantenemos tu mock por seguridad)
      setSteps([
        { id: "1", orderId, stepType: "cooking", status: "completed", startTime: new Date().toISOString() },
        { id: "2", orderId, stepType: "packing", status: "in_progress", startTime: new Date().toISOString() },
        { id: "3", orderId, stepType: "delivery", status: "pending" },
      ] as any) 
    } finally {
      setLoading(false)
    }
  }

  const stepLabels: Record<string, string> = {
    cooking: "👨‍🍳 Cocinando",
    packing: "📦 Empacando",
    delivery: "🛵 Entregando",
    review: "✅ Revisión"
  }

  if (loading) {
    return (
        <div className="flex items-center gap-2 text-sm text-blue-800 bg-blue-50 p-3 rounded-lg animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-blue-800 border-t-transparent animate-spin"></div>
            Sincronizando estados...
        </div>
    )
  }

  if (steps.length === 0) return null

  return (
    <div className="space-y-0 relative">
      {/* Línea vertical conectora de fondo */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 -z-10"></div>

      {steps.map((step, index) => {
        const isCompleted = step.status === "completed"
        const isInProgress = step.status === "in_progress"
        
        return (
            <div key={step.id || index} className="flex gap-4 relative bg-white/50 backdrop-blur-sm p-2 rounded-lg transition-all hover:bg-white">
            <div className="flex flex-col items-center">
                <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-all duration-500 ${
                    isCompleted
                    ? "bg-green-500 scale-100"
                    : isInProgress
                        ? "bg-blue-600 scale-110 ring-4 ring-blue-100"
                        : "bg-slate-300 scale-90"
                }`}
                >
                {isCompleted ? "✓" : index + 1}
                </div>
            </div>
            
            <div className="pb-4 flex-1">
                <div className="flex justify-between items-start">
                    <p className={`font-bold text-sm ${isInProgress ? 'text-blue-700' : 'text-slate-700'}`}>
                        {stepLabels[step.stepType] || step.stepType}
                    </p>
                    {isInProgress && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                            EN PROCESO
                        </span>
                    )}
                </div>
                
                <p className="text-xs text-slate-500 capitalize mb-1">
                    {step.status === 'in_progress' ? 'En progreso' : step.status === 'completed' ? 'Completado' : 'Pendiente'}
                </p>
                
                {step.assignedTo && (
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                        👤 {step.assignedTo}
                    </p>
                )}
                
                <div className="flex gap-3 mt-1 text-[10px] text-slate-400 font-mono">
                    {step.startTime && (
                        <span>Inicio: {new Date(step.startTime).toLocaleTimeString("es-PE", {hour: '2-digit', minute:'2-digit'})}</span>
                    )}
                </div>
            </div>
            </div>
        )
      })}
    </div>
  )
}