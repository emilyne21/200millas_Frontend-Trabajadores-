<p align="center">
  <img src="public/logo-200millas.svg" alt="200 Millas" height="72" />
</p>

<h1 align="center">200 Millas · Frontend</h1>

<p align="center">
  Aplicación web de pedidos (Next.js 16 · TypeScript · Tailwind · shadcn/ui)
</p>

---



## Roles del Sistema

### Rol del Cocinero

El cocinero es responsable de preparar los pedidos que llegan al restaurante. Su flujo de trabajo incluye:

#### Funcionalidades Principales

1. **Visualización de Pedidos Pendientes**
   - Accede al dashboard principal (`/`) donde ve todos los pedidos con estado `pending` o `cooking`
   - Cada pedido muestra:
     - Información del cliente
     - Items del pedido con cantidades
     - Tiempo estimado de preparación
     - Estado actual del pedido

2. **Gestión del Estado de Cocina**
   - Puede iniciar la preparación de un pedido cambiando su estado de `pending` a `cooking`
   - Durante la preparación, el pedido aparece en la sección "En Cocina" con un indicador visual
   - Puede ver detalles completos del pedido, incluyendo instrucciones especiales del cliente

3. **Marcar Pedido como Listo**
   - Una vez terminada la preparación, el cocinero marca el pedido como `ready`
   - Esta acción se realiza mediante:
     - Botón "Terminar" en la tarjeta del pedido
     - Actualización del estado vía API: `PATCH /api/orders/{id}/status` con `status: "ready"`
   - Al marcar como listo, el pedido automáticamente:
     - Cambia su estado en la base de datos
     - Se notifica al sistema de reparto
     - Aparece en la vista del repartidor como disponible para recoger

4. **Workflow de Cocina**
   - Acceso a la página `/workflow` para seguimiento detallado
   - Puede actualizar pasos del workflow (cooking, packing)
   - Registra tiempos de inicio y fin de cada etapa

#### Interfaz del Cocinero

- **Dashboard Principal**: Vista de tarjetas con pedidos pendientes y en cocina
- **Colores de Estado**:
  - Rojo (`#E85234`): Pedido en cocina
  - Azul (`#96ADD6`): Pedido pendiente
- **Acciones Disponibles**:
  - Ver detalles del pedido
  - Iniciar cocción
  - Marcar como terminado/listo

### Rol del Repartidor

El repartidor es responsable de recoger los pedidos listos y entregarlos a los clientes. Su flujo de trabajo incluye:

#### Funcionalidades Principales

1. **Visualización de Pedidos Listos**
   - Accede al dashboard principal (`/`) donde ve automáticamente todos los pedidos con estado `ready`
   - Los pedidos listos aparecen en la columna derecha "Listos para Recoger"
   - Cada pedido muestra:
     - ID del pedido
     - Dirección de entrega completa
     - Cantidad de items
     - Método de pago
     - Información del cliente

2. **Recoger Pedido (Iniciar Ruta)**
   - Cuando el repartidor está listo para entregar un pedido, hace clic en "Iniciar Ruta"
   - Esta acción:
     - Cambia el estado del pedido de `ready` a `dispatched`
     - Mueve el pedido de "Listos para Recoger" a "En Tránsito"
     - Actualiza el estado vía API: `PATCH /api/orders/{id}/status` con `status: "dispatched"`
     - Registra el tiempo de inicio de la entrega

3. **Gestión de Entregas en Tránsito**
   - Los pedidos en tránsito aparecen en la columna izquierda con prioridad visual
   - Información mostrada:
     - Tiempo estimado de entrega
     - Dirección con mapa
     - Distancia al destino
     - Botón para llamar al cliente directamente
   - El repartidor puede ver múltiples entregas simultáneas en el mapa (`/dashboard`)

4. **Completar Entrega**
   - Al llegar al destino y entregar el pedido, el repartidor hace clic en "Entregar"
   - Esta acción:
     - Cambia el estado del pedido de `dispatched` a `delivered`
     - Remueve el pedido de "En Tránsito"
     - Actualiza estadísticas del sistema
     - Notifica al cliente sobre la entrega completada

#### Interfaz del Repartidor

- **Dashboard Principal**: Vista dividida en dos columnas
  - **Izquierda (7 columnas)**: Pedidos "En Tránsito" - prioridad alta
  - **Derecha (5 columnas)**: Pedidos "Listos para Recoger"
- **Colores de Estado**:
  - Azul (`#00408C`): Pedido en ruta
  - Azul claro (`#96ADD6`): Pedido listo para recoger
- **Acciones Disponibles**:
  - Iniciar ruta (recoger pedido)
  - Ver mapa de entregas
  - Llamar al cliente
  - Marcar como entregado

### Conexión entre Cocinero y Repartidor

El sistema conecta ambos roles mediante un flujo de estados y notificaciones en tiempo real:

#### Flujo de Estados del Pedido

```
pending → cooking → ready → dispatched → delivered
   ↓         ↓        ↓         ↓           ↓
Cliente   Cocinero  Cocinero  Repartidor  Repartidor
recibe    inicia    marca     recoge      entrega
pedido    cocción   listo     pedido      pedido
```

#### Proceso Detallado de Conexión

1. **El Cocinero Marca el Pedido como Listo**
   ```typescript
   // El cocinero actualiza el estado del pedido
   PATCH /api/orders/{orderId}/status
   {
     "status": "ready",
     "updatedAt": "2024-01-15T10:30:00Z"
   }
   ```

2. **Notificación Automática al Sistema**
   - El backend actualiza el estado del pedido en la base de datos
   - Se dispara un evento que notifica a todos los repartidores conectados
   - El pedido aparece inmediatamente en la vista del repartidor

3. **El Repartidor Recibe la Notificación**
   - **Actualización en Tiempo Real**: Si el sistema usa WebSockets o Server-Sent Events, el repartidor ve el pedido aparecer automáticamente sin recargar
   - **Polling Alternativo**: Si no hay real-time, el dashboard del repartidor consulta periódicamente los pedidos con estado `ready`
   - El pedido aparece en la sección "Listos para Recoger" con:
     - Badge azul claro indicando "Listo"
     - Información completa del pedido
     - Botón "Iniciar Ruta" habilitado

4. **El Repartidor Recoge el Pedido**
   ```typescript
   // El repartidor actualiza el estado al recoger
   PATCH /api/orders/{orderId}/status
   {
     "status": "dispatched",
     "updatedAt": "2024-01-15T10:35:00Z"
   }
   ```
   - El pedido se mueve de "Listos para Recoger" a "En Tránsito"
   - Se registra el tiempo de inicio de la entrega
   - El cocinero puede ver que su pedido fue recogido

#### Implementación Técnica de la Conexión

**Backend (API)**:
- Endpoint: `PATCH /api/orders/{id}/status`
- Valida el cambio de estado según las reglas de negocio
- Actualiza la base de datos
- Emite evento de notificación (EventBridge, WebSocket, etc.)

**Frontend (Cocinero)**:
- Componente: `app/page.tsx` (vista del chef)
- Función: `updateOrderStatus(orderId, "ready")`
- Actualiza estado local y llama a la API

**Frontend (Repartidor)**:
- Componente: `app/page.tsx` (vista del repartidor)
- Filtra pedidos: `orders.filter(o => o.status === "ready")`
- Función: `updateOrderStatus(orderId, "dispatched")`
- Escucha actualizaciones en tiempo real o hace polling

#### Notificaciones en Tiempo Real

Para una experiencia óptima, el sistema puede implementar:

1. **WebSockets**:
   ```typescript
   // Cuando el cocinero marca como listo
   websocket.emit('order:ready', { orderId, ...orderData })
   
   // El repartidor escucha
   websocket.on('order:ready', (order) => {
     setReadyOrders(prev => [...prev, order])
   })
   ```

2. **Server-Sent Events (SSE)**:
   - El repartidor mantiene una conexión SSE abierta
   - El servidor envía eventos cuando un pedido cambia a `ready`

3. **Polling** (fallback):
   ```typescript
   // El dashboard del repartidor consulta cada 5-10 segundos
   useEffect(() => {
     const interval = setInterval(() => {
       fetchReadyOrders()
     }, 5000)
     return () => clearInterval(interval)
   }, [])
   ```

#### Sincronización de Estados

- **Consistencia**: El estado del pedido se mantiene sincronizado entre ambos roles
- **Conflictos**: El sistema previene que múltiples repartidores recojan el mismo pedido
- **Historial**: Todos los cambios de estado se registran con timestamps para auditoría

## Contribuir

1. Crea rama: `git checkout -b feat/mifeature`
2. Commits: `git commit -m "feat: mi feature"`
3. Push: `git push origin feat/mifeature`
4. PR: abre un Pull Request

---

Proyecto académico · Cloud Computing (CS2032)
