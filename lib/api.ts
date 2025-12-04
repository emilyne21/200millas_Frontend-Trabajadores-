const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ebd7lodar7.execute-api.us-east-1.amazonaws.com/dev"
const WS_BASE_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://prb3gpi5hk.execute-api.us-east-1.amazonaws.com/dev"

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn("NEXT_PUBLIC_API_URL no está definida en las variables de entorno, usando URL por defecto")
}

// Token almacenado en memoria (no localStorage)
let authToken: string | null = null

// Función para establecer el token desde el contexto de auth
export const setAuthToken = (token: string | null) => {
  authToken = token
}

// Función para obtener headers de autenticación
const getAuthHeaders = () => {
  // 🔥 RECUPERAR TOKEN DEL LOCALSTORAGE SI NO ESTÁ EN MEMORIA
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem("auth_token")
    console.log("🔑 Token recovered from localStorage:", authToken ? "✅ Found" : "❌ Not found")
  }
  
  const headers = {
    "Content-Type": "application/json",
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
  }
  
  console.log("📤 Headers being sent:", { 
    hasAuth: !!headers.Authorization,
    tokenPreview: authToken ? authToken.substring(0, 20) + "..." : "none"
  })
  
  return headers
}

export const apiClient = {
  // Orders endpoints
  orders: {
    create: async (orderData: any) => {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData),
      })
      if (!response.ok) throw new Error("Failed to create order")
      return response.json()
    },
    
    getById: async (orderId: string) => {
      console.log("📤 [Orders] Getting order by ID:", orderId)
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch order")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    getAll: async (filters?: any) => {
      console.log("📤 [Orders] Getting all orders")
      const params = filters ? new URLSearchParams(filters) : ""
      const url = params ? `${API_BASE_URL}/orders?${params}` : `${API_BASE_URL}/orders`
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch orders")
      const data = await response.json()
      // El backend devuelve { success: true, data: { orders: [...], count: ... } }
      const extracted = data.body_json?.data || data.data || data
      return extracted.orders || extracted || []
    },
    
    updateStatus: async (orderId: string, status: string) => {
      console.log(`📤 [Orders] Updating order ${orderId} status to:`, status)
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, updatedAt: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error("Failed to update order status")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
  },

  // Driver endpoints
  driver: {
    // GET /driver/available - Pedidos disponibles para recoger
    getAvailable: async () => {
      console.log("📤 [Driver] Obteniendo pedidos disponibles")
      const response = await fetch(`${API_BASE_URL}/driver/available`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch available orders")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },

    // GET /driver/assigned - Pedidos asignados al driver (en tránsito)
    getAssigned: async () => {
      console.log("📤 [Driver] Obteniendo pedidos asignados")
      const response = await fetch(`${API_BASE_URL}/driver/assigned`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch assigned orders")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },

    // GET /driver/orders/{order_id} - Detalle de un pedido específico
    getOrderById: async (orderId: string) => {
      console.log(`📤 [Driver] Obteniendo detalle del pedido ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/driver/orders/${orderId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch order")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },

    // GET /driver/timeline/{order_id} - Timeline/historial de un pedido
    getTimeline: async (orderId: string) => {
      console.log(`📤 [Driver] Obteniendo timeline del pedido ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/driver/timeline/${orderId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch order timeline")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },

    // GET /driver/stats - Estadísticas del driver
    getStats: async () => {
      console.log("📤 [Driver] Obteniendo estadísticas")
      const response = await fetch(`${API_BASE_URL}/driver/stats`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch driver stats")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },

    // POST /driver/pickup/{order_id} - Recoger un pedido
    pickup: async (orderId: string) => {
      console.log(`📦 [Driver] Recogiendo pedido ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/driver/pickup/${orderId}`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to pickup order")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },

    // POST /driver/complete/{order_id} - Completar entrega
    complete: async (orderId: string) => {
      console.log(`✅ [Driver] Completando entrega ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/driver/complete/${orderId}`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to complete delivery")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },

    // POST /driver/cancel/{order_id} - Cancelar entrega
    cancel: async (orderId: string) => {
      console.log(`❌ [Driver] Cancelando entrega ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/driver/cancel/${orderId}`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to cancel pickup")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    // POST /driver/availability - Reportar disponibilidad (available/busy/offline)
    reportAvailability: async (status: "available" | "busy" | "offline") => {
      console.log(`📤 [Driver] Reportando disponibilidad: ${status}`)
      const response = await fetch(`${API_BASE_URL}/driver/availability`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Failed to report availability")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    // GET /driver/available-list - Ver lista de drivers disponibles
    getAvailableList: async () => {
      console.log("📤 [Driver] Obteniendo lista de drivers disponibles")
      const response = await fetch(`${API_BASE_URL}/driver/available-list`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch available drivers")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
  },

  // Menu endpoints
  menu: {
    getCategories: async () => {
      console.log("📤 [Menu] Getting categories")
      const response = await fetch(`${API_BASE_URL}/menu/categories`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    getItems: async (categoryId?: string) => {
      console.log("📤 [Menu] Getting items", categoryId ? `for category: ${categoryId}` : "")
      const url = categoryId 
        ? `${API_BASE_URL}/menu/items?category=${categoryId}` 
        : `${API_BASE_URL}/menu/items`
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch menu items")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
  },

  // Workflow endpoints
  workflow: {
    getSteps: async (orderId: string) => {
      console.log(`📤 [Workflow] Getting steps for order: ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/workflow${orderId ? `/${orderId}/steps` : ""}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch workflow steps")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    updateStep: async (orderId: string, stepId: string, stepData: any) => {
      console.log(`📤 [Workflow] Updating step ${stepId} for order: ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/workflow/${orderId}/steps/${stepId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...stepData,
          updatedAt: new Date().toISOString(),
        }),
      })
      if (!response.ok) throw new Error("Failed to update workflow step")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
  },

  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      if (!API_BASE_URL) {
        throw new Error("API URL no configurada. Por favor configura NEXT_PUBLIC_API_URL en tu archivo .env.local")
      }
      
      console.log("📤 [Auth] Attempting login for:", email)
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      
      if (!response.ok) {
        let errorMessage = "Email o password incorrecto"
        try {
          const errorData = await response.json()
          // El backend puede devolver error en diferentes formatos
          if (errorData.body_json && errorData.body_json.error) {
            errorMessage = errorData.body_json.error
          } else if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
        }
        throw new Error(errorMessage)
      }
      
      let result
      try {
        const responseText = await response.text()
        if (!responseText || responseText.trim() === '') {
          throw new Error("Respuesta vacía del servidor")
        }
        result = JSON.parse(responseText)
      } catch (parseError: any) {
        throw new Error("Respuesta inválida del servidor: no se pudo parsear la respuesta JSON")
      }
      
      console.log("📥 Login response received:", result)
      
      // El backend devuelve: { success: true, data: { token, email, name, user_type, expires_in } }
      // O puede venir envuelto en body_json si es respuesta de Lambda
      let actualBody = result
      if (result.body_json && typeof result.body_json === 'object') {
        actualBody = result.body_json
      } else if (result.body && typeof result.body === 'string') {
        try {
          actualBody = JSON.parse(result.body)
        } catch (e) {
          throw new Error("Respuesta inválida del servidor: no se pudo parsear el body")
        }
      } else if (result.statusCode && result.body) {
        try {
          actualBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body
        } catch (e) {
          throw new Error("Respuesta inválida del servidor: formato de respuesta no reconocido")
        }
      }
      
      // Verificar si es un error
      if (actualBody && actualBody.success === false) {
        const errorMsg = actualBody.error || actualBody.message || "Error de autenticación"
        throw new Error(errorMsg)
      }
      
      // Extraer datos - el backend devuelve { success: true, data: {...} }
      const data = actualBody.data || actualBody
      
      if (!data || !data.token) {
        throw new Error("Respuesta inválida del servidor: no se recibió token de autenticación")
      }
      
      return {
        token: data.token,
        user: {
          id: data.email?.split('@')[0] || data.email,
          email: data.email,
          name: data.name,
          user_type: data.user_type,
          role: data.user_type, // Agregar role también para compatibilidad
          tenantId: "200millas"
        }
      }
    },
    
    register: async (name: string, email: string, password: string, userType: "driver" | "chef") => {
      if (!API_BASE_URL) {
        throw new Error("API URL no configurada. Por favor configura NEXT_PUBLIC_API_URL en tu archivo .env.local")
      }
      
      console.log("📤 [Auth] Attempting registration for:", email, "as", userType)
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password,
          user_type: userType
        }),
      })
      
      if (!response.ok) {
        let errorMessage = "Error al crear cuenta"
        try {
          const errorData = await response.json()
          if (errorData.body_json && errorData.body_json.error) {
            errorMessage = errorData.body_json.error
          } else if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          // Si no se puede parsear, usar el mensaje por defecto
        }
        console.log("❌ Registration error:", errorMessage)
        throw new Error(errorMessage)
      }
      
      let result
      try {
        const responseText = await response.text()
        result = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error("Respuesta inválida del servidor: no se pudo parsear la respuesta JSON")
      }
      
      // El backend devuelve: { success: true, data: { message, user: {...} } }
      let actualBody = result
      if (result.body_json && typeof result.body_json === 'object') {
        actualBody = result.body_json
      } else if (result.body && typeof result.body === 'string') {
        try {
          actualBody = JSON.parse(result.body)
        } catch (e) {
          throw new Error("Respuesta inválida del servidor: no se pudo parsear el body")
        }
      } else if (result.statusCode && result.body) {
        try {
          actualBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body
        } catch (e) {
          throw new Error("Respuesta inválida del servidor: formato de respuesta no reconocido")
        }
      }
      
      if (actualBody && actualBody.success === false) {
        const errorMsg = actualBody.error || actualBody.message || "Error al crear cuenta"
        throw new Error(errorMsg)
      }
      
      return actualBody.data || actualBody
    },
    
    logout: async () => {
      console.log("📤 [Auth] Logging out")
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Logout failed")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
  },

  // Chef endpoints
  chef: {
    getAssignedOrders: async () => {
      console.log("📤 [Chef] Obteniendo pedidos asignados")
      const response = await fetch(`${API_BASE_URL}/chef/assigned`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch assigned orders")
      const data = await response.json()
      // El backend devuelve { success: true, data: { orders: [...], count: ... } }
      const extracted = data.body_json?.data || data.data || data
      return extracted.orders || extracted || []
    },
    
    getOrderDetail: async (orderId: string) => {
      console.log(`📤 [Chef] Obteniendo detalle del pedido ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/chef/orders/${orderId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch order detail")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    completeCooking: async (orderId: string, notes?: string) => {
      console.log(`📤 [Chef] Completando cocción del pedido ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/chef/complete-cooking/${orderId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: notes || "" }),
      })
      if (!response.ok) throw new Error("Failed to complete cooking")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    completePacking: async (orderId: string, notes?: string) => {
      console.log(`📤 [Chef] Completando empaquetado del pedido ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/chef/complete-packing/${orderId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: notes || "" }),
      })
      if (!response.ok) throw new Error("Failed to complete packing")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    // POST /chef/availability - Reportar disponibilidad (available/busy/offline)
    reportAvailability: async (status: "available" | "busy" | "offline") => {
      console.log(`📤 [Chef] Reportando disponibilidad: ${status}`)
      const response = await fetch(`${API_BASE_URL}/chef/availability`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Failed to report availability")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    // GET /chef/available - Ver todos los chefs y su estado
    getAvailableChefs: async () => {
      console.log("📤 [Chef] Obteniendo lista de chefs disponibles")
      const response = await fetch(`${API_BASE_URL}/chef/available`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch available chefs")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
  },

  // Admin endpoints
  admin: {
    // GET /admin/chefs - Listar todos los chefs
    getChefs: async () => {
      console.log("📤 [Admin] Obteniendo lista de chefs")
      const response = await fetch(`${API_BASE_URL}/admin/chefs`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch chefs")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    // GET /admin/drivers - Listar todos los drivers
    getDrivers: async () => {
      console.log("📤 [Admin] Obteniendo lista de drivers")
      const response = await fetch(`${API_BASE_URL}/admin/drivers`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch drivers")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    // GET /admin/users - Listar todos los usuarios
    getUsers: async (userType?: string) => {
      console.log("📤 [Admin] Obteniendo lista de usuarios", userType ? `filtrado por: ${userType}` : "")
      const url = userType 
        ? `${API_BASE_URL}/admin/users?user_type=${userType}`
        : `${API_BASE_URL}/admin/users`
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
  },

  // Dashboard endpoints
  dashboard: {
    getSummary: async () => {
      console.log("📤 [Dashboard] Getting summary")
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch dashboard summary")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    getMetrics: async (dateRange?: any) => {
      console.log("📤 [Dashboard] Getting metrics")
      const params = dateRange ? new URLSearchParams(dateRange) : ""
      const url = params ? `${API_BASE_URL}/dashboard/metrics?${params}` : `${API_BASE_URL}/dashboard/metrics`
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch metrics")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    getTimeline: async (orderId: string) => {
      console.log(`📤 [Dashboard] Getting timeline for order: ${orderId}`)
      const response = await fetch(`${API_BASE_URL}/dashboard/timeline/${orderId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch timeline")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
    
    getStaffPerformance: async () => {
      console.log("📤 [Dashboard] Getting staff performance")
      const response = await fetch(`${API_BASE_URL}/dashboard/staff-performance`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch staff performance")
      const data = await response.json()
      return data.body_json?.data || data.data || data
    },
  },
}

/**
 * WebSocket helper function
 * Creates a WebSocket connection for real-time notifications
 * 
 * @param token - JWT token for authentication
 * @param userId - User ID
 * @param userType - User type (e.g., 'cook', 'driver')
 * @param onMessage - Callback for received messages
 * @param onError - Callback for errors
 * @returns WebSocket instance
 */
export const createWebSocketConnection = (
  token: string,
  userId: string,
  userType: string,
  onMessage?: (event: MessageEvent) => void,
  onError?: (error: Event) => void
): WebSocket => {
  if (!WS_BASE_URL) {
    throw new Error("WebSocket URL no configurada")
  }
  
  const wsUrl = `${WS_BASE_URL}?token=${token}&user_id=${userId}&user_type=${userType}`
  console.log("🔌 Creating WebSocket connection for:", userType)
  
  const ws = new WebSocket(wsUrl)

  if (onMessage) {
    ws.onmessage = onMessage
  }

  if (onError) {
    ws.onerror = onError
  }

  ws.onopen = () => {
    console.log("🟢 WebSocket connected")
  }

  ws.onclose = () => {
    console.log("🔴 WebSocket disconnected")
  }

  return ws
}

/**
 * Subscribe to order updates via WebSocket
 */
export const subscribeToOrder = (ws: WebSocket, orderId: string) => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log(`📡 Subscribing to order: ${orderId}`)
    ws.send(JSON.stringify({
      action: 'subscribe_order',
      order_id: orderId
    }))
  } else {
    console.warn("⚠️ WebSocket not open, cannot subscribe")
  }
}

/**
 * Unsubscribe from order updates via WebSocket
 */
export const unsubscribeFromOrder = (ws: WebSocket, orderId: string) => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log(`📡 Unsubscribing from order: ${orderId}`)
    ws.send(JSON.stringify({
      action: 'unsubscribe_order',
      order_id: orderId
    }))
  } else {
    console.warn("⚠️ WebSocket not open, cannot unsubscribe")
  }
}