"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Great_Vibes, Montserrat } from "next/font/google"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// Fuentes
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"] })
const montserrat = Montserrat({ subsets: ["latin"] })

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  
  // Estados
  const [showRegister, setShowRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("chef")

  // Función para determinar la ruta según el rol
  const getRedirectPath = (userRole: string): string => {
    const role = userRole?.toLowerCase() || ""
    
    if (role === "admin") {
      return "/dashboard"
    } else if (role === "customer") {
      return "/pedidos"
    } else if (role === "cook" || role === "dispatcher" || role === "driver") {
      return "/dashboard" // Dashboard principal para trabajadores
    }
    return "/dashboard" // Por defecto, dashboard
  }

  // --- LÓGICA DE NEGOCIO ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("Por favor completa todos los campos")
      return
    }

    setIsLoading(true)

    try {
      // Intentar login con la API
      try {
        await login(email, password)
        
        // Obtener el usuario del localStorage después del login
        const storedUser = localStorage.getItem("user")
        const user = storedUser ? JSON.parse(storedUser) : null
        
        toast.success("¡Bienvenido de nuevo!")
        const redirectPath = getRedirectPath(user?.role || "")
        console.log("Redirigiendo a:", redirectPath, "con rol:", user?.role)
        
        // Usar window.location para forzar la navegación completa
        window.location.href = redirectPath
        return
      } catch (apiError: any) {
        // Si es un error de red, intentar con usuarios mock
        if (apiError?.message?.includes("NetworkError") || apiError?.message?.includes("fetch") || apiError?.name === "TypeError") {
          console.log("API no disponible, usando usuarios mock")
          
          // Buscar en usuarios mock
          const mockUsers = JSON.parse(localStorage.getItem("mockUsers") || "[]")
          const foundUser = mockUsers.find((u: any) => u.email === email.trim() && u.password === password)

          if (foundUser) {
            // Usuario encontrado en mock, iniciar sesión
            localStorage.setItem("user", JSON.stringify(foundUser.user))
            localStorage.setItem("token", `mock_token_${Date.now()}`)
            
            toast.success("¡Bienvenido de nuevo!")
            const redirectPath = getRedirectPath(foundUser.user.role)
            console.log("Redirigiendo a:", redirectPath, "con rol:", foundUser.user.role)
            
            // Forzar actualización del contexto de auth
            window.dispatchEvent(new Event("storage"))
            
            // Usar window.location para forzar la navegación completa
            setTimeout(() => {
              window.location.href = redirectPath
            }, 500)
            return
          } else {
            // No encontrado en mock, mostrar error
            throw new Error("Credenciales incorrectas. Si no tienes cuenta, regístrate primero.")
          }
        } else {
          // Otro tipo de error, lanzarlo
          throw apiError
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast.error("Error al iniciar sesión", {
        description: error?.message || "Verifica tus credenciales e intenta nuevamente",
      })
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos
    if (!name || !name.trim()) {
      toast.error("Por favor ingresa tu nombre completo")
      return
    }
    if (!email || !email.trim()) {
      toast.error("Por favor ingresa tu correo electrónico")
      return
    }
    if (!password) {
      toast.error("Por favor ingresa una contraseña")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (!role) {
      toast.error("Por favor selecciona un rol")
      return
    }

    setIsLoading(true)

    try {
      // Mapear los roles del formulario a los roles del backend
      const backendRole = role === "chef" ? "cook" : role === "repartidor" ? "driver" : "cook"
      
      // Crear usuario simulado
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: email.trim(),
        name: name.trim(),
        role: backendRole as "customer" | "cook" | "dispatcher" | "driver" | "admin",
        tenantId: process.env.NEXT_PUBLIC_TENANT_ID || "200millas"
      }
      
      // Guardar credenciales para login futuro
      const users = JSON.parse(localStorage.getItem("mockUsers") || "[]")
      users.push({
        email: email.trim(),
        password: password, // En producción esto debería estar hasheado
        user: newUser
      })
      localStorage.setItem("mockUsers", JSON.stringify(users))

      toast.success("¡Cuenta creada exitosamente!")
      toast.info("Ahora puedes iniciar sesión", {
        description: "Usa tus credenciales para acceder",
      })
      
      // Limpiar formulario y cambiar a login
      setShowRegister(false)
      setEmail("")
      setPassword("")
      setName("")
      setConfirmPassword("")
      setRole("chef")
      setIsLoading(false)
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error("Error al crear cuenta", {
        description: "Por favor intenta nuevamente",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden flex justify-center items-center font-sans ${montserrat.className}`}>
      
      {/* ESTILOS CSS INYECTADOS */}
      <style jsx global>{`
        /* Fondo base (azul) */
        .bg-base {
          background: url('/fondo_login.png') no-repeat center center/cover;
          transition: filter 0.8s ease-in-out;
        }

        /* Animación suave */
        .cubic-bezier {
            transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        /* Vidrio Oscuro para el Registro */
        .glass-panel-dark {
            background: rgba(16, 20, 40, 0.75);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        /* Inputs del Registro (Dark Glass) */
        .input-dark-glass {
            background: rgba(255,255,255,0.05) !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
            color: white !important;
            transition: all 0.3s ease;
        }
        .input-dark-glass:focus {
            border-color: white !important;
            background: rgba(255,255,255,0.1) !important;
        }
        .input-dark-glass::placeholder { color: rgba(255,255,255,0.5); }

        /* NUEVO: Clase específica para los Inputs del Login (Píldora Transparente) */
        .input-pill-transparent {
            background: transparent !important;
            border: 2px solid white !important; /* Borde blanco sólido */
            border-radius: 9999px !important; /* Forma de píldora completa */
            color: white !important;
            padding-left: 1.5rem !important; /* Espacio interior */
            padding-right: 1.5rem !important;
            height: 3.5rem !important; /* Altura cómoda */
            transition: all 0.3s ease;
        }
        .input-pill-transparent:focus {
            background: rgba(255, 255, 255, 0.1) !important; /* Ligero fondo al escribir */
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
        }
        .input-pill-transparent::placeholder {
            color: rgba(255, 255, 255, 0.9) !important; /* Placeholder bien visible */
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 1px;
        }
      `}</style>

      {/* Capa de fondo oscura que se activa en registro */}
      <div className={`absolute inset-0 z-0 bg-base transition-all duration-1000 ${showRegister ? 'brightness-50' : 'brightness-100'}`} />

      {/* LOGO SVG */}
      <div className="absolute top-8 left-10 z-50">
        <img 
          src="/logo-200millas.svg" 
          alt="Logo 200 Millas" 
          className="w-40 drop-shadow-lg" 
        />
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="relative w-full max-w-[1200px] h-screen flex justify-center items-center">

        {/* --- IMAGEN DEL CEVICHE --- */}
        <img
            src="/DAP-Photoroom.png"
            alt="Ceviche"
            className={`
                absolute z-20 transition-all duration-1000 cubic-bezier drop-shadow-2xl
                ${showRegister 
                    ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-90 opacity-100' 
                    : 'left-[5%] top-1/2 -translate-y-1/2 scale-90 opacity-100 w-[45%] max-w-[550px]'
                }
            `}
        />

        {/* --- FORMULARIO LOGIN (DERECHA - ESTILO ACTUALIZADO) --- */}
        <div className={`
            absolute z-30 p-10 w-[400px] transition-all duration-700 ease-in-out
            ${showRegister 
                ? 'opacity-0 translate-x-20 pointer-events-none' 
                : 'right-[10%] opacity-100 translate-x-0'
            }
        `}>
            {/* Título centrado */}
            <h1 className={`${greatVibes.className} text-6xl text-white mb-2 font-normal drop-shadow-md text-center`}>
                Iniciar sesión
            </h1>
            <p className="text-center text-white/80 mb-8 text-sm uppercase tracking-wider">
                Llevando lo mejor del mar a cada hogar
            </p>
            
            <form onSubmit={handleLogin} className="space-y-6">
                {/* Inputs estilo Píldora Transparente */}
                <input
                    type="email"
                    placeholder="Correo Electrónico"
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
                    className="w-full bg-white text-[#1000a3] hover:bg-white/90 rounded-full py-7 font-bold text-lg mt-4 shadow-lg transition-transform hover:scale-105 tracking-wide"
                >
                    {isLoading ? "Iniciando..." : "INICIAR SESIÓN"}
                </Button>
            </form>

            <p className="text-white/80 mt-8 text-center text-sm">
                ¿No tienes una cuenta?{" "}
                <button onClick={() => setShowRegister(true)} className="text-white font-bold hover:underline cursor-pointer ml-1">
                    Regístrate aquí
                </button>
            </p>
        </div>

        {/* --- FORMULARIO REGISTRO (CENTRO - DARK GLASS) --- */}
        <div className={`
            absolute z-40 p-10 w-[450px] rounded-[30px] glass-panel-dark transition-all duration-700 ease-in-out
            flex flex-col items-center
            ${showRegister 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
            }
        `}>
            <h1 className={`${greatVibes.className} text-5xl text-white mb-6 font-normal drop-shadow-md`}>
                Registro
            </h1>

            <form onSubmit={handleRegister} className="w-full space-y-4">
                <Input
                    placeholder="NOMBRE COMPLETO"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-dark-glass rounded-full py-5 px-6"
                />
                <Input
                    placeholder="CORREO ELECTRÓNICO"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-dark-glass rounded-full py-5 px-6"
                />
                
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="input-dark-glass rounded-full py-5 px-6 w-full text-white">
                        <SelectValue placeholder="SELECCIONA ROL" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="chef">👨‍🍳 Chef</SelectItem>
                        <SelectItem value="repartidor">🚗 Repartidor</SelectItem>
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
                    placeholder="CONFIRMAR CONTRASEÑA"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-dark-glass rounded-full py-5 px-6"
                />

                <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white text-[#1000a3] hover:bg-gray-100 rounded-full py-6 font-bold mt-4 shadow-lg transition-transform hover:scale-105"
                >
                    {isLoading ? "Creando..." : "CREAR CUENTA"}
                </Button>
            </form>

            <p className="text-white/60 mt-4 text-sm">
                ¿Ya tienes una cuenta?{" "}
                <button onClick={() => setShowRegister(false)} className="text-white font-bold hover:underline cursor-pointer ml-1">
                    Inicia sesión
                </button>
            </p>
        </div>

      </div>
    </div>
  )
}