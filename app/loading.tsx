export default function Loading() {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F2EEE9]">
        <div className="flex items-center gap-4">
          
          {/* 1. El Logo (Icono) con animación de GIRO */}
          <div className="relative w-16 h-16 md:w-20 md:h-20">
             {/* Asegúrate de que el archivo "loguito-200millas.png" esté
                dentro de la carpeta /public de tu proyecto.
                
                Si usas Tailwind, 'animate-spin' hace que gire. 
                Si gira muy rápido, puedes usar una clase personalizada o 'animate-pulse'.
             */}
             <img 
               src="/loguito-200millas-Photoroom.png" 
               alt="Cargando"
               className="w-full h-full object-contain animate-spin" 
               style={{ animationDuration: '3s' }} // Hacemos que gire más lento y elegante
             />
          </div>
  
          {/* 2. El Texto "Cargando..." con animación de PARPADEO */}
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1a1a1a] uppercase animate-pulse" 
              style={{ fontFamily: 'Impact, sans-serif' }}>
            Cargando...
          </h1>
        </div>
      </div>
    )
  }