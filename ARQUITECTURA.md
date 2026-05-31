# Documento de Arquitectura — stuninng-guacamole-ui

**Versión:** 1.0  
**Fecha:** 2026-05-30  
**Autor:** Juan Manuel Tejeda Torres  

---

## 1. Visión General

`stuninng-guacamole-ui` es la interfaz web de un sistema de gestión para organizaciones religiosas. Permite administrar iglesias, colectores, bienhechores (donantes), asignaciones, promesas de donación, recibos y procesos administrativos como el cálculo de comisiones.

El frontend se comunica con una API REST en `http://192.168.1.207:4321/api` y está construido con **Angular 21** siguiendo una arquitectura de **Standalone Components** con lazy loading por módulo de funcionalidad.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Angular | 21.0.0 |
| Lenguaje | TypeScript | ~5.9.2 |
| UI Components | Angular Material | ^21.0.6 |
| Estilos | Tailwind CSS + SCSS | 3.4 / ^1.97.2 |
| Programación reactiva | RxJS | ~7.8.0 |
| Testing | Vitest + jsdom | ^4.0.8 |
| Build | @angular/build:application | 21.x |
| PWA | @angular/service-worker | ^21.0.0 |
| Auth | jwt-decode | ^4.0.0 |

---

## 3. Estructura de Carpetas

```
src/
├── app/
│   ├── app.ts                        # Root component
│   ├── app.routes.ts                 # Árbol de rutas principal
│   ├── app.config.ts                 # Bootstrap de providers
│   │
│   ├── core/                         # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   └── services/
│   │       ├── auth.service.ts
│   │       ├── collector.service.ts
│   │       ├── beneficient.service.ts
│   │       ├── church.service.ts
│   │       ├── assignment.service.ts
│   │       ├── promises-donation.service.ts
│   │       ├── reports.service.ts
│   │       ├── uploads.service.ts
│   │       ├── processes.service.ts
│   │       └── tab.service.ts
│   │
│   ├── features/                     # Módulos de funcionalidad (lazy loaded)
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   └── login/
│   │   └── dashboard/
│   │       ├── dashboard.routes.ts
│   │       ├── dashboard-layout.component.ts
│   │       ├── overview/
│   │       ├── collectors/
│   │       ├── beneficients/
│   │       ├── churches/
│   │       ├── assignments/
│   │       ├── promises-donation/
│   │       ├── reports/
│   │       ├── processes/
│   │       ├── uploads/
│   │       └── receipts/
│   │
│   └── shared/                       # Código reutilizable
│       ├── components/
│       │   ├── password-field/
│       │   └── not-found/
│       ├── pipes/
│       │   ├── fullname.pipe.ts
│       │   ├── address.pipe.ts
│       │   ├── gender.pipe.ts
│       │   ├── status.pipe.ts
│       │   ├── recurrence.pipe.ts
│       │   ├── hour.pipe.ts
│       │   └── has-permission.pipe.ts
│       └── validators/
│           ├── password-match.validator.ts
│           └── address-exclusive-fields.validator.ts
│
├── environments/
│   └── environment.development.ts
├── assets/
└── public/
```

---

## 4. Arquitectura de la Aplicación

### 4.1 Diagrama de Capas

```
┌────────────────────────────────────────────────────────────┐
│                        PRESENTACIÓN                        │
│   Features (Components) + Shared (Components, Pipes)       │
├────────────────────────────────────────────────────────────┤
│                      LÓGICA DE NEGOCIO                     │
│          Core Services (AuthService, CollectorService…)    │
├────────────────────────────────────────────────────────────┤
│                    INFRAESTRUCTURA HTTP                     │
│         HttpClient + AuthInterceptor + AuthGuard           │
├────────────────────────────────────────────────────────────┤
│                        API REST                            │
│               http://192.168.1.207:4321/api                │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Diagrama de Rutas

```
/
├── auth/
│   └── login                       (LoginComponent)
│
└── /  (authGuard)
    ├── (default) → overview
    ├── collectors
    ├── collectors/create
    ├── beneficients
    ├── beneficients/create
    ├── beneficents/:id
    ├── churches
    ├── churches/create
    ├── receipts
    ├── receipts/specials
    ├── assignments
    ├── promises-donation
    ├── promises-donation/create
    ├── reports
    ├── reports/collector
    ├── processes
    └── uploads
```

Todas las rutas del dashboard están protegidas por `authGuard`. La carga es **lazy**: cada componente se importa dinámicamente en `dashboard.routes.ts`.

---

## 5. Módulo de Autenticación

### 5.1 Flujo de Login

```
Usuario ingresa credenciales
        │
        ▼
  LoginComponent
        │ POST /auth/login
        ▼
   AuthService.login()
        │ guarda access_token, refresh_token, session_id en localStorage
        ▼
  Router.navigate(['/'])
```

### 5.2 Estado de Autenticación (Signals)

`AuthService` mantiene el estado global de autenticación con Angular Signals:

```typescript
// Estados posibles
type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated'

currentUser  = signal<AuthenticatedUser | null>(null)
authStatus   = signal<AuthStatus>('checking')
```

Los componentes reaccionan de forma declarativa al estado usando `computed()`.

### 5.3 Token Lifecycle

```
App inicia
    │
    ▼
AuthService.checkAuthStatus()   ← lee localStorage
    │
    ├─ Token válido ──────────────────→ authenticated
    │
    ├─ Token expirado + refresh válido → refreshToken() → authenticated
    │
    └─ Sin tokens / error ────────────→ not-authenticated → /auth/login
```

### 5.4 Interceptor HTTP (Dual Strategy)

El `AuthInterceptor` aplica dos estrategias complementarias:

1. **Preventiva:** Antes de cada petición, compara `exp` del JWT con `Date.now()`. Si el token expira en menos de 30 segundos, solicita un nuevo token antes de enviar la petición.

2. **Reactiva:** Si el servidor responde con `401`, entra en una cola de refresco (`isRefreshing$`) para evitar múltiples solicitudes de refresh simultáneas; todas las peticiones pendientes esperan el nuevo token y se reenvían.

Los endpoints bajo `/auth` están excluidos del interceptor para evitar bucles infinitos.

---

## 6. Módulos de Funcionalidad (Features)

### 6.1 Colectores (`/collectors`)

Gestión de los colectores de donaciones.

**Entidad principal:**
```typescript
interface Collector {
  id: string
  nss: string
  profile: { ... }
  address: Address
  paymentData: { bank, bankReference, commission }
  photoUrl?: string
}
```

**Capacidades:** listado paginado, búsqueda por texto, creación con foto de perfil, edición, eliminación.

---

### 6.2 Bienhechores (`/beneficients`)

Donantes registrados en el sistema.

**Entidad principal:**
```typescript
interface Beneficient {
  id: string
  title: string
  firstName: string
  firstLastName: string
  secondLastName?: string
  birthday?: Date
  gender: 'M' | 'F'
  maritalStatus: string
  email?: string
  rfc?: string
  address: Address
  church?: Church
}
```

**Capacidades:** listado paginado, búsqueda, creación, detalle individual con asignaciones y promesas.

---

### 6.3 Iglesias (`/churches`)

Catálogo de iglesias con su jerarquía eclesiástica.

**Entidad principal:**
```typescript
interface Church {
  id: string
  ecclesialIdentity: { vicariate, deaconry, parish, chapel }
  priest: Priest
  address: Address
}
```

---

### 6.4 Asignaciones (`/assignments`)

Vincula bienhechores con colectores.

```typescript
interface Assignment {
  id: string
  collector: Collector
  beneficient: Beneficient
  assignedAt: Date
  isActive: boolean
}
```

Soporta reasignación con motivo documentado.

---

### 6.5 Promesas de Donación (`/promises-donation`)

Compromisos de donación de los bienhechores.

```typescript
interface PromiseDonation {
  id: string
  beneficient: Beneficient
  amount: number
  currency: 'MXN' | 'USD'
  paymentMethod: string
  recurrence: 1 | 2 | 3 | 4 | 6 | 12   // mensual, bimestral, trimestral…
  startDate: Date
  nextDonationDate: Date
}
```

---

### 6.6 Reportes (`/reports`)

Generación de reportes en múltiples formatos:

| Tipo | Descripción |
|------|-------------|
| Diferencia de cantidad | Comparativo de montos esperados vs. recibidos |
| Reporte mensual | PDF con resumen del mes |
| Eficiencia | Tasa de cumplimiento de promesas |
| Por beneficiario | Historial individual |
| Por colector | Rendimiento del colector |

Salidas: **PDF** y **Excel**.

---

### 6.7 Procesos (`/processes`)

Lanza procesos administrativos batch en el servidor:

- **Proceso de comisión:** Calcula comisiones de colectores para el período.
- **Generación de recibos:** Crea los recibos mensuales y anuales.

---

### 6.8 Cargas (`/uploads`)

Importación de archivos con barra de progreso en tiempo real:

- **Depósitos:** Archivo de movimientos bancarios.
- **Información:** Actualizaciones masivas de datos.

---

## 7. Shared Layer

### 7.1 Pipes

| Pipe | Transformación |
|------|---------------|
| `FullnamePipe` | `{ firstName, firstLastName, secondLastName }` → `"Juan García López"` |
| `AddressPipe` | `Address` → string formateado |
| `GenderPipe` | `'M' / 'F'` → `"Masculino" / "Femenino"` |
| `StatusPipe` | `true / false` → `"Activo" / "Inactivo"` |
| `RecurrencePipe` | `1..12` → `"Mensual"`, `"Bimestral"`, etc. |
| `HourPipe` | `"14:30"` → `"2:30 PM"` |
| `HasPermissionPipe` | `permiso: string` → `boolean` (desde JWT) |

### 7.2 Validadores

| Validador | Regla |
|-----------|-------|
| `passwordMatchValidator` | `password === confirmPassword` |
| `addressExclusiveFieldsValidator` | `neighborhood XOR locality` (exactamente uno presente) |

### 7.3 Componentes Compartidos

- **`PasswordFieldComponent`:** Input de contraseña con toggle show/hide, implementa `ControlValueAccessor` para integración con Reactive Forms.
- **`NotFoundComponent`:** Página 404 genérica.

---

## 8. Gestión de Permisos

Los permisos se obtienen decodificando el JWT del usuario:

```
JWT payload.rights → string[]
```

El `HasPermissionPipe` evalúa si el usuario tiene el permiso requerido y lo usa en templates para mostrar u ocultar secciones de UI:

```html
<button *ngIf="'COLLECTORS_CREATE' | hasPermission">Crear colector</button>
```

El `TabService` también valida permisos al registrar pestañas de navegación en el dashboard, filtrando las que el usuario no tiene derecho a ver.

---

## 9. Configuración de la Aplicación (`app.config.ts`)

```
Providers registrados:
├── provideRouter(appRoutes, withInMemoryScrolling)
├── provideHttpClient(withInterceptors([authInterceptor]))
├── provideServiceWorker('ngsw-worker.js', { registrationStrategy })
├── provideAnimationsAsync()
├── provideMaterialNativeDateAdapter()
└── Locale: es-MX / en (dinámico desde localStorage['user_lang'])
```

---

## 10. Patrones y Decisiones de Diseño

### Standalone Components (sin NgModule)
Todos los componentes son standalone. Cada uno declara sus propias dependencias (`imports: [...]`), lo que reduce el acoplamiento y mejora el tree-shaking.

### Lazy Loading granular
Cada ruta del dashboard carga su componente de forma asíncrona:
```typescript
{ path: 'collectors', loadComponent: () => import('./collectors/collector.component') }
```
Esto reduce el bundle inicial y mejora el tiempo de carga.

### Signals para estado global
`AuthService` usa `signal()` y `computed()` de Angular 16+ en lugar de BehaviorSubject para el estado de autenticación. Esto simplifica el código y se integra nativamente con el sistema de detección de cambios de Angular 21.

### Observable patterns para búsqueda
Las búsquedas en tablas utilizan:
```typescript
searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => service.search(term))
)
```

### Service Worker (PWA)
La aplicación está configurada como PWA con `ngsw-config.json`. El Service Worker se registra cuando la aplicación está estable, evitando interferir con la carga inicial.

---

## 11. Comunicación con la API

### URL Base
```
http://192.168.1.207:4321/api
```

### Convención de Endpoints (inferida)
```
GET    /collectors           → lista paginada
POST   /collectors           → crear
PUT    /collectors/:id       → actualizar
DELETE /collectors/:id       → eliminar
POST   /collectors/:id/photo → subir foto de perfil

GET    /beneficients         → lista paginada
POST   /beneficients         → crear
GET    /beneficients/:id     → detalle
...
POST   /auth/login           → autenticación
POST   /auth/refresh         → renovar token
```

### Formato de Respuesta Estándar
```typescript
interface PaginatedResponse<T> {
  statusCode: number
  data: {
    items: T[]
    meta: {
      page: number
      limit: number
      itemCount: number
      pageCount: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }
  timestamp: string
}
```

---

## 12. Consideraciones de Seguridad

| Aspecto | Implementación |
|---------|---------------|
| Tokens | JWT con expiración, almacenados en `localStorage` |
| Refresh automático | 30 s antes de expiración (umbral configurable) |
| Protección de rutas | `authGuard` en todas las rutas del dashboard |
| CORS | `withCredentials: true` en todas las peticiones |
| Permisos de UI | `HasPermissionPipe` oculta funciones no autorizadas |
| Auth loop prevention | Interceptor excluye endpoints `/auth` |

---

## 13. Testing

- **Framework:** Vitest ^4.0.8 + jsdom ^27.1.0
- **Config:** `tsconfig.spec.json`
- Los pipes y validadores son la capa más adecuada para pruebas unitarias dado que son funciones puras.
- Los servicios HTTP se pueden probar con `HttpClientTestingModule` o mocks de Vitest.

---

## 14. Build y Despliegue

```bash
# Desarrollo
ng serve

# Producción
ng build
# Salida en /dist
```

**Presupuesto de bundle:**
- Initial bundle: ≤ 500 kB (warning) / ≤ 1 MB (error)
- Componentes lazy: sin límite estricto

**Service Worker:** habilitado solo en producción (`ngsw-config.json`).

---

## 15. Glosario

| Término | Significado en el dominio |
|---------|--------------------------|
| Bienhechore / Beneficiario | Donante registrado en el sistema |
| Colector | Persona que recoge donaciones de los bienhechores |
| Promesa de donación | Compromiso de pago recurrente de un bienhechore |
| Asignación | Relación activa entre un colector y un bienhechore |
| Recibo | Comprobante generado al colectar una donación |
| Proceso de comisión | Cálculo periódico de comisiones para colectores |
| Identidad eclesiástica | Jerarquía: vicaría → decanato → parroquia → capilla |
