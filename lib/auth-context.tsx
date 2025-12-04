"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiClient, setAuthToken } from "./api"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  tenantId: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tenantId, setTenantId] = useState(process.env.NEXT_PUBLIC_TENANT_ID || "200millas")

  useEffect(() => {
    // 🔥 RECUPERAR TOKEN AL CARGAR
    const checkAuth = async () => {
      try {
        console.log("🔍 Checking auth...")
        const savedToken = localStorage.getItem("auth_token")
        const savedUser = localStorage.getItem("auth_user")
        
        console.log("📦 Token found:", !!savedToken)
        console.log("👤 User found:", !!savedUser)
        
        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser)
          console.log("✅ Setting user:", parsedUser)
          setToken(savedToken)
          setUser(parsedUser)
          setAuthToken(savedToken)
        } else {
          console.log("❌ No saved credentials")
        }
      } catch (error) {
        console.error("💥 Error checking auth:", error)
      } finally {
        console.log("⏹️ Setting isLoading to false")
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("🔐 Login attempt for:", email)
      setIsLoading(true)
      const response = await apiClient.auth.login(email, password)
      
      console.log("📥 Login response:", response)
      
      if (response.user && response.token) {
        // Usar 'as any' para evitar errores de TypeScript con propiedades dinámicas
        const backendUser = response.user as any
        
        const normalizedUser = {
          ...backendUser,
          role: backendUser.role || backendUser.user_type || "chef",
          user_type: backendUser.user_type || backendUser.role || "chef"
        }
        
        console.log("💾 Saving to localStorage:", normalizedUser)
        
        // 🔥 GUARDAR EN LOCALSTORAGE
        localStorage.setItem("auth_token", response.token)
        localStorage.setItem("auth_user", JSON.stringify(normalizedUser))
        
        setUser(normalizedUser)
        setToken(response.token)
        setAuthToken(response.token)
        
        // Manejar tenantId opcional
        const userTenantId = backendUser.tenantId || backendUser.tenant_id || "200millas"
        setTenantId(userTenantId)
        
        console.log("✅ Login successful, state updated")
      }
    } catch (error) {
      console.error("❌ Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log("🚪 Logging out...")
      if (token) {
        await apiClient.auth.logout()
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // 🔥 LIMPIAR LOCALSTORAGE
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_user")
      
      setUser(null)
      setToken(null)
      setAuthToken(null)
      
      console.log("✅ Logged out and localStorage cleared")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        tenantId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}