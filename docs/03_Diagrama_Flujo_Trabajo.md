# Diagrama de secuencia — Flujo de trabajo del proyecto

Este diagrama documenta el flujo end-to-end de la aplicación (React SPA + Supabase), desde la carga inicial del listado de presupuestos hasta la exportación a Excel, eliminación y reapertura de un presupuesto.

Cada etapa está coloreada para facilitar su identificación:

- 🔵 Etapa 1 — Carga inicial y listado
- 🟢 Etapa 2 — Nuevo presupuesto
- 🟡 Etapa 3 — Selección de áreas
- 🔴 Etapa 4 — Captura de costos CAPEX/OPEX/Nómina
- 🟣 Etapa 5 — Resumen mensual y exportación a Excel
- 🟥 Etapa 6 — Eliminar presupuesto
- 🔷 Etapa 7 — Reabrir presupuesto

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant App as App React (App.jsx)
    participant LS as localStorage
    participant API as supabaseApi.js
    participant DB as Supabase (Postgres)
    participant XLS as Excel (SheetJS)

    rect rgb(224, 242, 254)
    Note over Usuario,DB: Etapa 1 · Carga inicial y listado
    Usuario->>App: Abre la aplicación
    App->>LS: loadAppState()
    LS-->>App: estado local (cache)
    App->>API: listarPresupuestos()
    API->>DB: SELECT * FROM presupuestos
    DB-->>API: filas
    API-->>App: lista de presupuestos
    App-->>Usuario: Muestra listado
    end

    rect rgb(220, 252, 231)
    Note over Usuario,DB: Etapa 2 · Nuevo presupuesto
    Usuario->>App: Click "Nuevo"
    App->>App: abrirNuevo() → reset formulario
    opt Partir de presupuesto anterior
        Usuario->>App: Selecciona presupuesto base
        App->>API: cargarPresupuestoDeNube(id)
        API->>DB: SELECT presupuesto + tablas relacionadas
        DB-->>API: datos
        API-->>App: copia en memoria (nuevos ids)
    end
    Usuario->>App: Completa datos y guarda
    App->>App: guardarPres() → snapshot
    App->>API: guardarPresupuestoEnNube()
    API->>DB: INSERT/UPDATE presupuestos
    end

    rect rgb(254, 249, 195)
    Note over Usuario,App: Etapa 3 · Selección de áreas
    Usuario->>App: Selecciona áreas participantes
    App->>App: confirmarAreas() → seeds costos por área
    end

    rect rgb(255, 228, 230)
    Note over Usuario,DB: Etapa 4 · Captura de costos CAPEX/OPEX/Nómina
    Usuario->>App: Ingresa CAPEX (fecha real)
    App->>App: mesIndexCapex()
    Usuario->>App: Ingresa OPEX (periodicidad + mes inicio)
    App->>App: distribuirOpex()
    Usuario->>App: Ingresa nómina
    App->>App: distribuirNomina()
    Usuario->>App: Click "Guardar área"
    App->>App: guardarArea(id)
    App->>API: guardarPresupuestoEnNube()
    API->>DB: INSERT/UPDATE/DELETE en cascada
    end

    rect rgb(237, 233, 254)
    Note over Usuario,XLS: Etapa 5 · Resumen mensual y exportación
    Usuario->>App: Revisa resumen mensual
    App-->>Usuario: Gráficas/tablas CAPEX-OPEX por mes
    Usuario->>App: Click "Excel"
    App->>XLS: exportarExcel()
    XLS-->>Usuario: Descarga libro .xlsx
    end

    rect rgb(254, 202, 202)
    Note over Usuario,DB: Etapa 6 · Eliminar presupuesto
    Usuario->>App: Click "Eliminar"
    App->>Usuario: window.confirm()
    Usuario-->>App: Confirma
    App->>LS: actualiza estado local
    App->>API: eliminarPresupuestoDeNube(id)
    API->>DB: DELETE FROM presupuestos (cascada)
    end

    rect rgb(224, 231, 255)
    Note over Usuario,DB: Etapa 7 · Reabrir presupuesto
    Usuario->>App: Click en presupuesto existente
    App->>API: cargarPresupuestoDeNube(id)
    API->>DB: SELECT datos actualizados
    DB-->>API: datos
    API-->>App: presToOpen
    App->>App: useEffect aplica datos (evita carreras)
    App-->>Usuario: Vuelve a step 3
    end
```
