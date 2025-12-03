"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Header from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, ArrowLeft, Truck, Store, Package, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

const LIMA_CENTER = { lat: -12.0464, lng: -77.0428 }

const STORE_LOCATIONS = [
  { id: 1, name: "San Isidro", address: "Av. Paseo de la República N° 3220, local LPC-12", coords: { lat: -12.0955, lng: -77.0255 }, phone: "996819390" },
  { id: 2, name: "S.J.M. (Atocongo)", address: "Av. Circunvalación 1801, local LC-06", coords: { lat: -12.1558, lng: -76.9812 }, phone: "996819390" },
  { id: 3, name: "Ica", address: "Av. Los Maestros 206, Ica", coords: { lat: -14.0753, lng: -75.7346 }, phone: "996819390" },
  { id: 4, name: "Santa Anita", address: "Av. Carretera Central N°111, local FC-05", coords: { lat: -12.0563, lng: -76.9717 }, phone: "996819390" },
  { id: 5, name: "Comas", address: "Av. Los Ángeles 602, Patio de comidas nivel 3", coords: { lat: -11.9367, lng: -77.0657 }, phone: "996819390" },
  { id: 6, name: "S.J.L. (Zárate)", address: "Av. Lurigancho, Sub Lote No. 2 Mz A", coords: { lat: -12.0020, lng: -77.0080 }, phone: "996819390" },
  { id: 7, name: "Iquitos", address: "Av. Capitan Jose Abelardo Quiñones 1050", coords: { lat: -3.7683, lng: -73.2759 }, phone: "996819390" },
  { id: 8, name: "Surco (Benavides)", address: "Av. Benavides 3863, local 1", coords: { lat: -12.1286, lng: -76.9936 }, phone: "996819390" }
]

const addressToCoords: Record<string, { lat: number; lng: number }> = {
  "Av. Principal 123, San Isidro": { lat: -12.0960, lng: -77.0330 },
  "Jr. Los Olivos 456, Miraflores": { lat: -12.1200, lng: -77.0300 },
  "Av. Larco 789, San Borja": { lat: -12.0850, lng: -77.0030 },
  "Calle Mayor 45, San Isidro": { lat: -12.0900, lng: -77.0400 },
}

const geocodeAddress = (address: string) => {
  return addressToCoords[address] || {
    lat: LIMA_CENTER.lat + (Math.random() - 0.5) * 0.02,
    lng: LIMA_CENTER.lng + (Math.random() - 0.5) * 0.02
  }
}

declare global {
  interface Window { google: any; initMap?: () => void }
}

export default function MapPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showStores, setShowStores] = useState(false) // Estado para el desplegable
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const userRole = user?.role?.toLowerCase() || ""
  const isChef = userRole === "cook" || userRole.includes("chef") || userRole.includes("cocina")
  const isDelivery = userRole.includes("repartidor") || userRole.includes("delivery") || userRole === "driver"

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login")
  }, [isAuthenticated, isLoading, router])

  // Redirigir cocineros a la página principal - solo repartidores pueden ver el mapa
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isDelivery) {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, isDelivery, router])

  // 1. Cargar Datos Mock
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true)
      setTimeout(() => {
        const mockOrders = [
          {
            id: "ORD005", customer: "Roberto Silva", status: "dispatched",
            deliveryAddress: "Jr. Los Olivos 456, Miraflores", total: 48.00,
            driverName: isDelivery ? user?.name : "Luis Ramírez"
          },
          {
             id: "ORD021", customer: "Juan Pérez", status: "dispatched",
             deliveryAddress: "Calle Mayor 45, San Isidro", total: 45.50,
             driverName: isDelivery ? user?.name : "Luis Ramírez"
          },
          ...(isChef ? [{
               id: "ORD007", customer: "Carla Diaz", status: "dispatched",
               deliveryAddress: "Av. Principal 123, San Isidro", total: 120.00,
               driverName: "Carlos Mendoza"
          }] : [])
        ]
        setOrders(mockOrders)
        setLoading(false)
      }, 500)
    }
  }, [isAuthenticated, isChef, isDelivery, user?.name])

  // 2. Init Map (Memoizado)
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return
    if (googleMapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: LIMA_CENTER,
      zoom: 11,
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
      disableDefaultUI: false,
      zoomControl: true,
    })
    
    googleMapRef.current = map
    const bounds = new window.google.maps.LatLngBounds()

    // A: DIBUJAR LOCALES
    const flagSvg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="2" height="30" fill="#333333" />
        <path d="M4 2 H30 L25 10 L30 18 H4 V2 Z" fill="#D32F2F" />
      </svg>
    `
    const flagIconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(flagSvg);

    STORE_LOCATIONS.forEach((store) => {
        const marker = new window.google.maps.Marker({
            position: store.coords,
            map: map,
            title: store.name,
            icon: {
                url: flagIconUrl,
                scaledSize: new window.google.maps.Size(50, 50),
                labelOrigin: new window.google.maps.Point(15, 10),
            },
            label: { text: store.id.toString(), color: "white", fontWeight: "bold", fontSize: "12px" }
        })

        const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="color:#00408C;padding:5px;font-family:sans-serif;max-width:200px;"><strong style="font-size:14px;color:#D32F2F;">${store.name}</strong><br/><span style="font-size:12px;">${store.address}</span><br/><span style="font-size:11px;color:#666;">📞 ${store.phone}</span></div>`
        })
        marker.addListener("click", () => infoWindow.open(map, marker))
        bounds.extend(store.coords)
    })

    // B: DIBUJAR PEDIDOS
    orders.forEach((order) => {
      const coords = geocodeAddress(order.deliveryAddress)
      const marker = new window.google.maps.Marker({
        position: coords,
        map: map,
        title: order.customer,
        icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#00408C",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
        },
      })
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="color:#00408C;padding:5px;font-family:sans-serif;"><strong style="font-size:14px;">📦 Entrega: ${order.id}</strong><br/><span style="color:#666;">${order.customer}</span><br/><div style="margin-top:4px;font-size:12px;">📍 ${order.deliveryAddress}</div></div>`
      })
      marker.addListener("click", () => infoWindow.open(map, marker))
      bounds.extend(coords)
    })

    if (orders.length > 0 || STORE_LOCATIONS.length > 0) {
        map.fitBounds(bounds)
    }
  }, [orders])

  // 3. Load Script
  useEffect(() => {
    if (!loading && apiKey) {
      if (!window.google) {
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
        script.async = true
        script.defer = true
        script.onload = initMap
        document.head.appendChild(script)
      } else {
        setTimeout(() => initMap(), 100)
      }
    }
  }, [loading, apiKey, initMap])

  // PANTALLA DE CARGA
  if (loading || isLoading) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F2EEE9]">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
               <img src="/loguito-200millas-Photoroom.png" alt="Cargando" className="w-full h-full object-contain animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-5xl font-black text-[#1a1a1a] uppercase animate-pulse" style={{ fontFamily: 'Impact, sans-serif' }}>
              Cargando . . .
            </h1>
          </div>
        </div>
    )
  }

  // Si no está autenticado, no mostrar nada (se redirige en useEffect)
  if (!isAuthenticated) {
    return null
  }

  // Si no es repartidor, no mostrar nada (se redirige en useEffect)
  if (!isDelivery) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F2EEE9] text-[#00408C]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-[#00408C] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                <MapPin className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-3xl font-bold">Mapa de Cobertura</h1>
                <p className="opacity-70">Locales y Rutas Activas</p>
             </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-2 border-[#00408C] text-[#00408C] hover:bg-[#00408C] hover:text-white rounded-xl font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
          </Link>
        </div>

        {/* --- LAYOUT: COLUMNA IZQUIERDA (Listas) Y DERECHA (Mapa) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. COLUMNA IZQUIERDA: Entregas y Locales */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                
                {/* A. Entregas Activas (Siempre visible) */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0 pb-4">
                        <CardTitle className="text-[#00408C] flex items-center gap-2">
                            <Truck className="w-5 h-5" /> Entregas Activas ({orders.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {orders.length === 0 ? (
                            <p className="text-[#00408C]/60 italic pl-2">No hay entregas en ruta actualmente.</p>
                        ) : (
                            orders.map(order => (
                                <div 
                                    key={order.id} 
                                    className="bg-white p-4 rounded-[1.5rem] shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all border border-transparent hover:border-[#00408C]"
                                    onClick={() => {
                                        const coords = geocodeAddress(order.deliveryAddress)
                                        googleMapRef.current?.panTo(coords)
                                        googleMapRef.current?.setZoom(15)
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#00408C]/10 flex items-center justify-center text-[#00408C] shrink-0">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#00408C] text-base">Pedido {order.id}</h4>
                                        <p className="text-sm text-[#00408C]/70">{order.deliveryAddress}</p>
                                        <p className="text-xs text-[#E85234] font-bold mt-1">{order.customer}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* B. Nuestros Locales (DESPLEGABLE) */}
                <Card className="border-none shadow-sm rounded-[1.5rem] bg-white overflow-hidden">
                    <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setShowStores(!showStores)}
                    >
                        <div className="flex items-center gap-2 font-bold text-[#00408C]">
                            <Store className="w-5 h-5" /> 
                            <span>Nuestros Locales</span>
                            <span className="bg-[#E85234] text-white text-xs px-2 py-0.5 rounded-full ml-1">{STORE_LOCATIONS.length}</span>
                        </div>
                        {showStores ? <ChevronUp className="w-5 h-5 text-[#00408C]" /> : <ChevronDown className="w-5 h-5 text-[#00408C]" />}
                    </div>
                    
                    {/* Contenido Desplegable */}
                    {showStores && (
                        <CardContent className="p-4 pt-0 bg-gray-50/50 border-t border-gray-100 max-h-[400px] overflow-y-auto">
                            <div className="space-y-3 mt-3">
                                {STORE_LOCATIONS.map(store => (
                                    <div 
                                        key={store.id} 
                                        className="bg-white p-3 rounded-[1rem] shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-all border border-transparent hover:border-[#E85234]"
                                        onClick={() => {
                                            googleMapRef.current?.panTo(store.coords)
                                            googleMapRef.current?.setZoom(16)
                                        }}
                                    >
                                        <div className="w-8 h-8 rounded-md bg-[#D32F2F] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                                            {store.id}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-[#00408C] text-sm truncate">{store.name}</h4>
                                            <p className="text-xs text-[#00408C]/70 truncate">{store.address}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    )}
                </Card>

            </div>

            {/* 2. COLUMNA DERECHA: Mapa (Más grande) */}
            <div className="lg:col-span-2">
                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden h-[600px] relative bg-white sticky top-24">
                    <div ref={mapRef} className="w-full h-full" />
                    
                    {orders.length > 0 && (
                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-lg border border-white/50 flex justify-between items-center z-10 max-w-2xl mx-auto">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#00408C] w-10 h-10 rounded-full flex items-center justify-center text-white">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#00408C]/50 uppercase">Próximo Destino</p>
                                    <p className="font-bold text-[#00408C] truncate max-w-[150px] md:max-w-sm">{orders[0]?.deliveryAddress}</p>
                                </div>
                            </div>
                            <Button className="bg-[#E85234] hover:bg-[#E85234]/90 text-white rounded-xl font-bold h-10 px-6">
                                Navegar
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>

      </main>
    </div>
  )
}