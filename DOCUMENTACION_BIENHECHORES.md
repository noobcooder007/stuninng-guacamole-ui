# Estructura de Bienhechores - Patrón de Capas (MVC)

## 📋 Descripción General

La sección de **Bienhechores (Beneficents)** sigue el patrón arquitectónico de tres capas:
- **Frontend (Features/Presentación)**: Componentes de Angular
- **Capa de Servicios (Core/Intermediario)**: Lógica de datos y comunicación HTTP
- **Backend (API REST)**: Base de datos y lógica del servidor

---

## 📁 Estructura de Carpetas

```
src/
├── app/
│   ├── core/services/
│   │   ├── beneficent.service.ts         ← CAPA DE DATOS
│   │   ├── beneficent-detail.service.ts  ← Servicio de paso temporal
│   │   └── ...
│   │
│   └── features/dashboard/beneficient/
│       ├── beneficient.component.ts      ← LISTA (Presentación)
│       ├── beneficient.component.html
│       ├── beneficient.component.scss
│       │
│       └── detail/
│           ├── beneficent-detail.component.ts    ← DETALLE (Presentación)
│           ├── beneficent-detail.component.html
│           └── beneficent-detail.component.scss
```

---

## 🔄 Flujo de Datos

```
USUARIO (Navegador)
        ↓
┌──────────────────────────────────────────────┐
│  beneficient.component (LISTA)               │
│  - Muestra tabla de bienhechores             │
│  - Filtros y paginación                      │
│  - Click → abre dialog de detalle            │
└────────────────┬─────────────────────────────┘
                 │ this.beneficientService.getBeneficents()
                 ↓
┌──────────────────────────────────────────────┐
│  BeneficientService (SERVICIO)               │
│  - Construye HttpParams con filtros          │
│  - GET /api/beneficents?page=1&limit=5...    │
│  - Maneja errores y snackbars               │
└────────────────┬─────────────────────────────┘
                 │ HTTP GET
                 ↓
┌──────────────────────────────────────────────┐
│  BACKEND API                                 │
│  /api/beneficents (recurso REST)             │
│  - Consulta base de datos                    │
│  - Retorna JSON paginado                     │
└──────────────────────────────────────────────┘
```

---

## 📦 Core Service: beneficent.service.ts

### Interfaces Exportadas

```typescript
// Modelo principal
export interface Beneficent {
  id: number;
  noBienhechor: string;
  tipoPersona: 'Física' | 'Moral';
  nombre: string;
  apPaterno: string;
  apMaterno: string;
  razonSocial: string;
  rfc: string;
  persona: 'Física' | 'Jurídica';
  status: 'Activo' | 'Inactivo';
  activo: boolean;
  // ... más campos
}

// Filtros de búsqueda
export interface BeneficientFilters {
  nombre?: string;
  apPaterno?: string;
  apMaterno?: string;
  tipoPersona?: string;
  rfc?: string;
  razonSocial?: string;
  status?: string;
  noBienhechor?: string;
}

// DTOs para crear/actualizar
export interface CreateBeneficientDto { ... }
export interface UpdateBeneficientDto { ... }

// Respuesta paginada del backend
export interface PaginatedResponse {
  statusCode: number;
  data: {
    items: Beneficent[];
    meta: PaginatedMetadata;
  };
  timestamp: string;
}
```

### Métodos del Servicio

| Método | HTTP | Descripción |
|--------|------|-------------|
| `getBeneficents(page, limit, filters)` | GET | Obtiene lista con paginación y filtros |
| `getBeneficent(id)` | GET | Obtiene un registro específico |
| `create(data)` | POST | Crea nuevo bienhechore |
| `update(data)` | PUT | Actualiza un bienhechore |
| `delete(id)` | DELETE | Elimina un bienhechore |

---

## 🎨 Componentes de Presentación

### 1. BeneficientComponent (Lista)

**Responsabilidades:**
- Mostrar tabla de bienhechores
- Permitir filtrado dinámico
- Manejar paginación
- Abrir dialog de detalle

**Interacciones con el servicio:**
```typescript
// Cargar datos con filtros
this.beneficientService.getBeneficents(page, limit, filters).subscribe({
  next: (response) => {
    this.dataSource.data = response.data.items;
    this.pagination.set(response.data.meta);
  }
});

// Abrir detalle
this.beneficientDetailService.setBeneficent(element);
this.dialog.open(BeneficientDetailComponent);
```

### 2. BeneficientDetailComponent (Detalle)

**Responsabilidades:**
- Mostrar información completa del bienhechore (5 tabs)
- Permitir edición
- Asignar colectores
- Dialog emergente

**Interacciones con servicios:**
```typescript
// Obtener datos del servicio de paso
this.beneficent = this.beneficientDetailService.getBeneficent();

// Editar (futura implementación)
this.beneficientService.update(updatedData).subscribe(...);
```

---

## 🔌 Endpoints Backend Esperados

```
BASE_URL: https://api.iglesia.com/api

GET    /api/beneficents
       Query params: page, limit, nombre, apPaterno, apMaterno, etc.
       Response: { statusCode: 200, data: { items: [...], meta: {...} } }

GET    /api/beneficents/{id}
       Response: { statusCode: 200, data: {...} }

POST   /api/beneficents
       Body: { noBienhechor, nombre, apPaterno, ... }
       Response: { statusCode: 201, data: {...} }

PUT    /api/beneficents/{id}
       Body: { campos a actualizar }
       Response: { statusCode: 200, data: {...} }

DELETE /api/beneficents/{id}
       Response: { statusCode: 204 }
```

---

## 🚀 Cómo Usar el Servicio

### En un Componente

```typescript
import { BeneficientService, BeneficientFilters } from '@app/core/services/beneficent.service';

@Component({...})
export class MiComponente {
  beneficientService = inject(BeneficientService);

  ngOnInit() {
    // Obtener beneficentes
    const filtros: BeneficientFilters = {
      nombre: 'Juan',
      status: 'Activo'
    };

    this.beneficientService.getBeneficents(1, 10, filtros)
      .subscribe({
        next: (response) => {
          console.log(response.data.items);
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });

    // Crear un nuevo bienhechore
    this.beneficientService.create({
      noBienhechor: 'B006',
      nombre: 'Nuevo Cliente',
      // ... resto de campos
    }).subscribe({
      next: () => console.log('Creado exitosamente')
    });
  }
}
```

---

## ✨ Características Implementadas

✅ Listado con tabla Material  
✅ Filtros dinámicos (8 campos)  
✅ Paginación (5, 10, 20 registros)  
✅ Ordenamiento de columnas  
✅ Dialog emergente para detalles  
✅ 5 tabs en detalle (Personales, Donativo, Dirección, Observaciones, Colectores)  
✅ Servicio HTTP completo  
✅ Manejo de errores con snackbars  
✅ Tipos TypeScript seguros  

---

## 📝 TODOs para Implementar

- [ ] Conectar con API real (reemplazar mock data)
- [ ] Implementar dialog de edición
- [ ] Implementar asignación de colectores
- [ ] Agregar validación de formularios
- [ ] Implementar dialog de eliminación
- [ ] Agregar permisos/roles de usuario
- [ ] Implementar busca de colectores

---

## 🔐 Seguridad

El servicio heredará automáticamente:
- **Auth Interceptor**: Agrega token JWT en headers
- **Error Interceptor**: Maneja errores globales
- **Auth Guard**: Protege rutas (si está configurado)

---

## 📞 Contacto del Servicio

**API Base URL:**
```typescript
environment.apiBaseUrl  // Definido en environment.development.ts
```

**Ejemplo:**
```typescript
// environment.development.ts
export const environment = {
  apiBaseUrl: 'http://localhost:3000/api',
  production: false
};
```
