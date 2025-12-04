"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Great_Vibes, Montserrat } from "next/font/google"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"] })
const montserrat = Montserrat({ subsets: ["latin"] })

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  
  const [showRegister, setShowRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("chef")
  
  // Obtener el tipo de usuario del contexto para ocultar registro si es admin
  const { user } = useAuth()
  const isAdmin = user?.role === "admin" || (user as any)?.user_type === "admin" 

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Completa los campos")
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      // ✅ SOLO mostrar el toast si el login fue exitoso
      toast.success("¡Bienvenido!")
      router.push("/")
      
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error("Credenciales incorrectas o usuario no encontrado")
      setIsLoading(false)
    }
  }

  // --- REGISTRO ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !password) {
      toast.error("Completa todos los campos")
      return
    }
    
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    console.log("📝 Starting registration...")
    console.log("📋 Data:", { name, email, role })
    
    setIsLoading(true)

    try {
      const backendUserType = role === "chef" ? "chef" : "driver"
      console.log("🔄 Mapped role:", role, "→", backendUserType)
      
      console.log("📤 Calling register API...")
      const response = await apiClient.auth.register(name, email, password, backendUserType)
      console.log("📥 Register response:", response)
      
      toast.success("¡Cuenta creada! Ahora inicia sesión")
      
      // Limpiar formulario
      setName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setRole("chef")
      
      // Cambiar a vista de login
      setShowRegister(false)

    } catch (error: any) {
      console.error("❌ Registration error:", error)
      console.error("📋 Error details:", error.message)
      toast.error("Error al crear cuenta. Intenta con otro correo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden flex justify-center items-center font-sans ${montserrat.className}`}>
      
      <style jsx global>{`
        .bg-base { background: url('/fondo_login.png') no-repeat center center/cover; }
        .glass-panel-dark {
            background: rgba(16, 20, 40, 0.75);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .input-pill-transparent {
            background: transparent !important;
            border: 2px solid white !important;
            border-radius: 9999px !important;
            color: white !important;
            padding: 0 1.5rem !important;
            height: 3.5rem !important;
        }
        .input-pill-transparent::placeholder { color: rgba(255, 255, 255, 0.9) !important; }
        .input-dark-glass {
            background: rgba(255,255,255,0.05) !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
            color: white !important;
        }
      `}</style>

      <div className={`absolute inset-0 z-0 bg-base transition-all duration-1000 ${showRegister ? 'brightness-50' : 'brightness-100'}`} />

      {/* LOGO */}
      <div className="absolute top-8 left-10 z-50">
        <img src="/logo-200millas.svg" alt="Logo" className="w-40 drop-shadow-lg" />
      </div>

      <div className="relative w-full max-w-[1200px] h-screen flex justify-center items-center">
        <img 
          src="/DAP-Photoroom.png" 
          alt="Ceviche" 
          className={`absolute z-20 transition-all duration-1000 drop-shadow-2xl ${
            showRegister 
              ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-90 opacity-100' 
              : 'left-[5%] top-1/2 -translate-y-1/2 scale-90 opacity-100 w-[45%] max-w-[550px]'
          }`} 
        />

        {/* --- LOGIN FORM --- */}
        <div className={`absolute z-30 p-10 w-[400px] transition-all duration-700 ease-in-out ${
          showRegister 
            ? 'opacity-0 translate-x-20 pointer-events-none' 
            : 'right-[10%] opacity-100 translate-x-0'
        }`}>
            <h1 className={`${greatVibes.className} text-6xl text-white mb-2 text-center`}>
              Iniciar sesión
            </h1>
            <form onSubmit={handleLogin} className="space-y-6 mt-8">
                <input 
                  type="email" 
                  placeholder="Correo" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full input-pill-transparent outline-none" 
                />
                <input 
                  type="password" 
                  placeholder="Contraseña" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full input-pill-transparent outline-none" 
                />
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-white text-[#1000a3] hover:bg-white/90 rounded-full py-7 font-bold text-lg mt-4 shadow-lg hover:scale-105 transition-transform"
                >
                    {isLoading ? "Iniciando..." : "INICIAR SESIÓN"}
                </Button>
            </form>
            <p className="text-white/80 mt-8 text-center text-sm">
                ¿No tienes cuenta?{" "}
                <button 
                  onClick={() => setShowRegister(true)} 
                  className="text-white font-bold hover:underline"
                >
                  Regístrate aquí
                </button>
                <br />
                <span className="text-xs text-white/60 mt-2 block">
                  (Solo para chefs y repartidores)
                </span>
            </p>
        </div>

        {/* --- REGISTER FORM --- */}
        <div className={`absolute z-40 p-10 w-[450px] rounded-[30px] glass-panel-dark transition-all duration-700 flex flex-col items-center ${
          showRegister 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
        }`}>
            <h1 className={`${greatVibes.className} text-5xl text-white mb-6`}>
              Registro
            </h1>
            <form onSubmit={handleRegister} className="w-full space-y-4">
                <Input 
                  placeholder="NOMBRE" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="input-dark-glass rounded-full py-5 px-6" 
                />
                <Input 
                  type="email"
                  placeholder="CORREO" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="input-dark-glass rounded-full py-5 px-6" 
                />
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="input-dark-glass rounded-full py-5 px-6 text-white">
                      <SelectValue placeholder="ROL" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="chef">Chef</SelectItem>
                        <SelectItem value="repartidor">Repartidor</SelectItem>
                    </SelectContent>
                </Select>
                <Input 
                  type="password" 
                  placeholder="CONTRASEÑA" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="input-dark-glass rounded-full py-5 px-6" 
                />
                <Input 
                  type="password" 
                  placeholder="CONFIRMAR" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="input-dark-glass rounded-full py-5 px-6" 
                />
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-white text-[#1000a3] rounded-full py-6 font-bold mt-4 hover:scale-105 transition-transform"
                >
                    {isLoading ? "Creando cuenta..." : "CREAR CUENTA"}
                </Button>
            </form>
            <p className="text-white/60 mt-4 text-sm">
                ¿Ya tienes cuenta?{" "}
                <button 
                  onClick={() => setShowRegister(false)} 
                  className="text-white font-bold hover:underline"
                >
                  Inicia sesión
                </button>
            </p>
        </div>
      </div>
    </div>
  )
}