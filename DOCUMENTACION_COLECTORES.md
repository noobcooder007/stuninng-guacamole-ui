# Estructura de Colectores - Patrón de Capas (MVC)

## 📋 Descripción General

La sección de **Colectores** sigue el patrón arquitectónico de tres capas:
- **Frontend (Features/Presentación)**: Componentes de Angular
- **Capa de Servicios (Core/Intermediario)**: Lógica de datos y comunicación HTTP
- **Backend (API REST)**: Base de datos y lógica del servidor

---

## 📁 Estructura de Carpetas

```
src/
├── app/
│   ├── core/services/
│   │   ├── collector.service.ts         ← CAPA DE DATOS
│   │   ├── collector-detail.service.ts  ← Servicio de paso temporal
│   │   └── ...
│   │
│   └── features/dashboard/collector/
│       ├── collector.component.ts      ← LISTA (Presentación)
│       ├── collector.component.html
│       ├── collector.component.scss
│       │
│       └── detail/
│           ├── collector-detail.component.ts    ← DETALLE (Presentación)
│           ├── collector-detail.component.html
│           └── collector-detail.component.scss
```

---

## 🔄 Flujo de Datos

```
USUARIO (Navegador)
        ↓
┌──────────────────────────────────────────────┐
│  collector.component (LISTA)                 │
│  - Muestra tabla de colectores               │
│  - Filtros y paginación                      │
│  - Click → abre dialog de detalle            │
└────────────────┬─────────────────────────────┘
                 │ this.collectorService.getCollectors()
                 ↓
┌──────────────────────────────────────────────┐
│  CollectorService (SERVICIO)                 │
│  - Construye HttpParams con filtros          │
│  - GET /api/collectors?page=1&limit=5...     │
│  - Maneja errores y snackbars                │
└────────────────┬─────────────────────────────┘
                 │ HTTP GET
                 ↓
┌──────────────────────────────────────────────┐
│  BACKEND API                                 │
│  /api/collectors (recurso REST)              │
│  - Consulta base de datos                    │
│  - Retorna JSON paginado                     │
└──────────────────────────────────────────────┘
```

---

## 📦 Core Service: collector.service.ts

### Interfaces Exportadas

```typescript
// Modelo principal
export interface Collector {
  id: number;
  noColector: string;
  nombre: string;
  apPaterno?: string;
  apMaterno?: string;
  rfc?: string;
  telefono?: string;
  email?: string;
  status: 'Activo' | 'Inactivo';
  activo: boolean;
  // ... más campos según requerimientos
}

// Filtros de búsqueda
export interface CollectorFilters {
  nombre?: string;
  apPaterno?: string;
  apMaterno?: string;
  rfc?: string;
  noColector?: string;
  status?: string;
}

// DTOs para crear/actualizar
export interface CreateCollectorDto { /* ... */ }
export interface UpdateCollectorDto { /* ... */ }

// Respuesta paginada del backend
export interface PaginatedResponseCollectors {
  statusCode: number;
  data: {
    items: Collector[];
    meta: PaginatedMetadata;
  };
  timestamp: string;
}
```

### Métodos del Servicio

| Método | HTTP | Descripción |
|--------|------|-------------|
| `getCollectors(page, limit, filters)` | GET | Obtiene lista con paginación y filtros |
| `getCollector(id)` | GET | Obtiene un registro específico |
| `create(data)` | POST | Crea nuevo colector |
| `update(id, data)` | PUT | Actualiza un colector |
| `delete(id)` | DELETE | Elimina un colector |

---

## 🎨 Componentes de Presentación

### 1. CollectorComponent (Lista)

**Responsabilidades:**
- Mostrar tabla de colectores
- Permitir filtrado dinámico
- Manejar paginación
- Abrir dialog de detalle

**Interacciones con el servicio:**

```typescript
// Cargar datos con filtros
this.collectorService.getCollectors(page, limit, filters).subscribe({
  next: (response) => {
    this.dataSource.data = response.data.items;
    this.pagination.set(response.data.meta);
  }
});

// Abrir detalle
this.collectorDetailService.setCollector(element);
this.dialog.open(CollectorDetailComponent);
```

### 2. CollectorDetailComponent (Detalle)

**Responsabilidades:**
- Mostrar información completa del colector (tabs según diseño)
- Permitir edición
- Asignar zonas/colectas
- Dialog emergente

**Interacciones con servicios:**

```typescript
// Obtener datos del servicio de paso
this.collector = this.collectorDetailService.getCollector();

// Editar (futura implementación)
this.collectorService.update(this.collector.id, updatedData).subscribe(...);
```

---

## 🔌 Endpoints Backend Esperados

```
BASE_URL: https://api.iglesia.com/api

GET    /api/collectors
       Query params: page, limit, nombre, apPaterno, apMaterno, etc.
       Response: { statusCode: 200, data: { items: [...], meta: {...} } }

GET    /api/collectors/{id}
       Response: { statusCode: 200, data: {...} }

POST   /api/collectors
       Body: { noColector, nombre, apPaterno, ... }
       Response: { statusCode: 201, data: {...} }

PUT    /api/collectors/{id}
       Body: { campos a actualizar }
       Response: { statusCode: 200, data: {...} }

DELETE /api/collectors/{id}
       Response: { statusCode: 204 }
```

---

## 🚀 Cómo Usar el Servicio

### En un Componente

```typescript
import { CollectorService, CollectorFilters } from '@app/core/services/collector.service';



















































































```};  production: false  apiBaseUrl: 'http://localhost:3000/api',export const environment = {// environment.development.ts```typescript**Ejemplo:**```environment.apiBaseUrl  // Definido en environment.development.ts```typescript**API Base URL:**## 📞 Contacto del Servicio---- **Auth Guard**: Protege rutas (si está configurado)- **Error Interceptor**: Maneja errores globales- **Auth Interceptor**: Agrega token JWT en headersEl servicio debe heredar:## 🔐 Seguridad---- [ ] Implementar búsqueda de zonas o asignaciones- [ ] Agregar permisos/roles de usuario- [ ] Implementar dialog de eliminación- [ ] Agregar validación de formularios- [ ] Implementar asignación de zonas/colectas- [ ] Implementar dialog de edición- [ ] Conectar con API real (reemplazar mock data)## 📝 TODOs para Implementar---- Tipos TypeScript para seguridad de datos- Servicio HTTP con manejo centralizado de errores- Dialog para detalles y edición- Paginación y ordenamiento- Filtros dinámicos- Listado con tabla Material## ✨ Características Recomendadas---```}  }    });      next: () => console.log('Creado exitosamente')    }).subscribe({      // ... resto de campos      nombre: 'Nuevo Colector',      noColector: 'C010',    this.collectorService.create({    // Crear un nuevo colector      });        }          console.error('Error:', error);        error: (error) => {        },          console.log(response.data.items);        next: (response) => {      .subscribe({    this.collectorService.getCollectors(1, 10, filtros)    };      status: 'Activo'      nombre: 'Pedro',    const filtros: CollectorFilters = {  ngOnInit() {  collectorService = inject(CollectorService);export class MiComponente {n@Component({...})
