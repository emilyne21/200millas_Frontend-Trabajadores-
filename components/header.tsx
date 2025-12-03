"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, Menu, X, ChefHat, Truck, LayoutDashboard, Package, MapPin, Loader2 } from "lucide-react" // Agregado Loader2
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  // Nuevo estado para controlar la carga del logout
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true) // 1. Activa el estado de carga inmediatamente
    
    try {
      // Intentamos el logout
      await logout()
      // 2. Usamos replace para que no puedan volver atrás con el botón "Atrás" del navegador
      router.replace("/login")
    } catch (error) {
      console.error("Error al salir:", error)
      setIsLoggingOut(false) // Solo desactivamos si falló, si tuvo éxito nos vamos de la página
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const userRole = user?.role?.toLowerCase() || ""
  const isChef = userRole === "cook" || userRole.includes("chef") || userRole.includes("cocina")
  const isDelivery = userRole.includes("repartidor") || userRole.includes("delivery") || userRole === "driver"

  const getRoleIcon = () => {
    if (isChef) return <ChefHat className="w-5 h-5" />
    if (isDelivery) return <Truck className="w-5 h-5" />
    return <Package className="w-5 h-5" />
  }

  const getRoleBadge = () => {
    if (isChef) return "bg-orange-500"
    if (isDelivery) return "bg-blue-500"
    return "bg-slate-500"
  }

  return (
    <header className="sticky top-0 z-50 text-white shadow-lg" style={{ backgroundColor: '#202090' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3">
            <img
              src="https://quickeat-api.s3.amazonaws.com/media/200millas/ux_web/base_assets/200millas_header_logo_img_05062025_17_55_47.svgxml"
              alt="200 Millas Logo"
              className="h-10 w-auto"
            />
            <div className="hidden md:block h-6 w-px bg-white/30"></div>
            <div className="hidden md:flex items-center gap-2">
              {getRoleIcon()}
              <span className="text-sm font-medium">Panel Operativo</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:text-[#e2e200] transition font-medium px-3 py-2 rounded-md hover:bg-white/10"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link 
              href="/pedidos" 
              className="flex items-center gap-2 hover:text-[#e2e200] transition font-medium px-3 py-2 rounded-md hover:bg-white/10"
            >
              <Package className="w-4 h-4" />
              Mis Pedidos
            </Link>
            {isDelivery && (
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 hover:text-[#e2e200] transition font-medium px-3 py-2 rounded-md hover:bg-white/10"
              >
                <MapPin className="w-4 h-4" />
                Mapa
              </Link>
            )}
          </nav>

          {/* User Info and Logout */}
          <div className="hidden md:flex gap-4 items-center">
            <div className="text-right border-r border-white/30 pr-4">
              <p className="text-sm font-medium">{user?.name || "Trabajador"}</p>
              <Badge className={`${getRoleBadge()} text-white text-xs mt-1`}>
                {isChef ? "👨‍🍳 Chef" : isDelivery ? "🚗 Repartidor" : user?.role || "Usuario"}
              </Badge>
            </div>
            
            {/* BOTÓN DESKTOP MODIFICADO */}
            <Button 
              onClick={handleLogout} 
              disabled={isLoggingOut} // Deshabilita mientras carga
              variant="ghost" 
              className="text-white hover:bg-white/10 hover:text-[#e2e200]" 
              size="sm"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              {isLoggingOut ? "Saliendo..." : "Salir"}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-2 backdrop-blur-sm" style={{ backgroundColor: '#202090' }}>
            <Link 
              href="/" 
              className="flex items-center gap-3 text-white hover:text-[#e2e200] px-4 py-3 hover:bg-white/10 transition"
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link 
              href="/pedidos" 
              className="flex items-center gap-3 text-white hover:text-[#e2e200] px-4 py-3 hover:bg-white/10 transition"
              onClick={() => setIsOpen(false)}
            >
              <Package className="w-5 h-5" />
              Mis Pedidos
            </Link>
            {isDelivery && (
              <Link 
                href="/dashboard" 
                className="flex items-center gap-3 text-white hover:text-[#e2e200] px-4 py-3 hover:bg-white/10 transition"
                onClick={() => setIsOpen(false)}
              >
                <MapPin className="w-5 h-5" />
                Mapa
              </Link>
            )}
            <div className="px-4 py-3 border-t border-white/20 mt-2">
              <div className="mb-3">
                <p className="text-sm font-medium text-white mb-1">{user?.name || "Trabajador"}</p>
                <Badge className={`${getRoleBadge()} text-white text-xs`}>
                  {isChef ? "👨‍🍳 Chef" : isDelivery ? "🚗 Repartidor" : user?.role || "Usuario"}
                </Badge>
              </div>
              
              {/* BOTÓN MOBILE MODIFICADO */}
              <Button
                onClick={() => {
                  // No cerramos el menú inmediatamente (isOpen) para que se vea el estado de carga
                  handleLogout()
                }}
                disabled={isLoggingOut}
                variant="ghost"
                className="text-white hover:bg-white/10 w-full justify-start"
                size="sm"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                {isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}