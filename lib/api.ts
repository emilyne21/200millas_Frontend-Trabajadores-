const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
const WS_BASE_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL

if (!API_BASE_URL) {
  console.warn("NEXT_PUBLIC_API_URL no está definida en las variables de entorno")
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
      return data.body_json?.data || data.data || data
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
        const error = await response.json().catch(() => ({ message: "Login failed" }))
        throw new Error(error.message || "Login failed")
      }
      
      const result = await response.json()
      console.log("📥 Login response received")
      
      // Parsear la estructura del backend
      const data = result.body_json?.data || result.data || result
      
      return {
        token: data.token,
        user: {
          email: data.email,
          name: data.name,
          user_type: data.user_type,
          role: data.user_type // Agregar role también para compatibilidad
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
        const error = await response.json().catch(() => ({ message: "Registration failed" }))
        console.log("❌ Registration error:", error)
        throw new Error(error.message || "Registration failed")
      }
      
      const data = await response.json()
      return data.body_json?.data || data.data || data
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