# CLAUDE.md

Guía de desarrollo para Claude Code en el proyecto `stuninng-guacamole-ui`.

## Comandos esenciales

```bash
ng serve              # Servidor de desarrollo en localhost:4200
ng build              # Build de producción → dist/
ng test               # Tests con Vitest
ng generate component features/dashboard/<name>/<name> --standalone
```

## Arquitectura

Angular 21 con **Standalone Components** y lazy loading. Sin NgModule. Ver [ARQUITECTURA.md](ARQUITECTURA.md) para el documento completo.

```
src/app/
├── core/          # Guards, interceptors, servicios singleton (providedIn: 'root')
├── features/      # Módulos de funcionalidad (lazy loaded por ruta)
│   ├── auth/
│   └── dashboard/ # Todas las pantallas van aquí
└── shared/        # Pipes, validadores, componentes reutilizables
```

**API base:** `http://192.168.1.207:4321/api` (ver `src/environments/environment.development.ts`)

## Patrones obligatorios

### Componentes
- Siempre **standalone**: `standalone: true` en el decorador.
- Importar dependencias **localmente** en el componente, no en un módulo.
- Estado local con `signal()`. Estado derivado con `computed()`.
- Path alias `@app/` disponible (apunta a `src/app/`).

### Servicios
- `providedIn: 'root'` en todos los servicios de `core/`.
- Las peticiones HTTP siempre pasan por un servicio; nunca en el componente directamente.
- Retornar `Observable<T>`, no suscribirse dentro del servicio.

### Rutas
- Toda ruta nueva en el dashboard va en `src/app/features/dashboard/dashboard.routes.ts`.
- Usar `loadComponent` para lazy loading:
  ```typescript
  { path: 'mi-ruta', loadComponent: () => import('./mi-feature/mi-feature.component').then(m => m.MiFeatureComponent) }
  ```
- Rutas del dashboard están protegidas por `authGuard`; no hace falta añadirlo manualmente a cada ruta hija.

### Formularios
- Usar **Reactive Forms** (`FormGroup`, `FormControl`). Prohibido Template-driven forms.
- Validadores personalizados en `src/app/shared/validators/`.

### Búsquedas y listas paginadas
```typescript
searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.service.search(term))
).subscribe(...)
```

## Convenciones de código

- **Sin comentarios** excepto cuando el "por qué" no sea obvio.
- **Sin `console.log`** en código comiteado.
- Nombres de archivos: `kebab-case.component.ts`, `kebab-case.service.ts`, `kebab-case.pipe.ts`.
- Interfaces de datos en el mismo archivo del servicio que las consume, salvo que sean compartidas.
- Pipes de presentación van en `src/app/shared/pipes/`.

## Permisos y seguridad

- Usar `HasPermissionPipe` para ocultar/mostrar UI basada en permisos del JWT:
  ```html
  <button *ngIf="'COLLECTORS_CREATE' | hasPermission">Crear</button>
  ```
- No hardcodear lógica de permisos en componentes; siempre delegarla al pipe o al servicio.
- El `AuthInterceptor` maneja tokens automáticamente; los componentes y servicios no deben manipular tokens directamente.

## Dominio del negocio

| Entidad | Descripción |
|---------|-------------|
| Bienhechore | Donante registrado |
| Colector | Persona que recoge donaciones |
| Iglesia | Unidad con jerarquía eclesiástica (vicaría → decanato → parroquia → capilla) |
| Asignación | Vínculo activo colector–bienhechore |
| Promesa de donación | Compromiso de pago recurrente (MXN/USD) |
| Proceso de comisión | Cálculo batch de comisiones de colectores |

## UI y estilos

- **Angular Material** para todos los componentes de UI (tablas, formularios, diálogos, sidenav).
- **Tailwind CSS** para utilidades de layout y espaciado.
- **SCSS** para estilos específicos del componente.
- No mezclar estilos inline con Tailwind; usar clases de Tailwind en el template.

## Testing

- Framework: **Vitest** + jsdom.
- Todos los specs van en `src/testing/` (estructura: `services/`, `pipes/`, `validators/`). Nunca colocar specs junto al código fuente.
- Prioridad de tests: pipes y validadores (son funciones puras), luego servicios HTTP.
- Para servicios HTTP usar `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController`.
- **Siempre mockear dependencias externas** (HttpClient, MatSnackBar, Router, localStorage, etc.). Los tests no deben impactar servicios reales ni APIs.
  - Servicios HTTP: proveer `{ provide: MatSnackBar, useValue: { open: vi.fn() } }` en el TestBed.
  - `localStorage`/`sessionStorage`: usar `vi.stubGlobal` en `beforeEach` y `vi.unstubAllGlobals()` en `afterEach`.
  - Para `AuthService`: llamar `TestBed.resetTestingModule()` al inicio del `beforeEach` (los signals de Angular requieren un reset explícito).
- Ejecutar tests: `ng test`.
- Ver cobertura: `ng test --coverage`.

## Lo que NO hacer

- No crear `NgModule`.
- No suscribirse dentro de servicios; retornar el Observable.
- No manipular tokens JWT fuera de `AuthService`.
- No añadir lógica de negocio en componentes; delegarla al servicio correspondiente.
- No añadir rutas sin lazy loading (`loadComponent`).
- No usar `any` en TypeScript salvo para interop inevitable con librerías externas.
