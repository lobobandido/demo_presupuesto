# GEOLIS — Módulo de Presupuestos

Aplicación web para captura, seguimiento y análisis de presupuestos de
proyecto (CAPEX/OPEX) de GEOLIS S.A. de C.V. Permite dar de alta un proyecto,
capturar sus partidas por área, ver un resumen mensual con gráficas de flujo
de efectivo, y exportar todo a Excel o PDF.

## Funcionalidad principal

- Alta de presupuesto por proyecto (servicio, instalación, construcción) con
  datos generales, fecha de elaboración y duración.
- Captura de partidas **CAPEX** (inversión única) y **OPEX** (gasto
  recurrente: materiales, viáticos, nómina) por área, con categorías
  contables macro (27 cuentas oficiales de Geolis) y autocompletado contra el
  catálogo real de almacén.
- Autocompletado por historial: al escribir una categoría/descripción ya
  usada antes, sugiere el resto de los campos.
- Ingresos adicionales y precio fijo mensual, con distribución uniforme por
  mes.
- **Resumen mensual** (M0–M12): tabla SERVICIO expandible por partida,
  gráfica de flujo mensual + acumulado, gráfica de OPEX por categoría.
- Exportación a **Excel** (4 hojas: SERVICIO, FLUJO, EGRESOS, INFO, con
  formato de moneda) y a **PDF** (impresión del resumen).
- Gestión de presupuestos: editar en borrador, clonar uno existente, eliminar.
- Persistencia en la nube vía Supabase (además de `localStorage` como
  respaldo local).

Ver `02_Guia_Negocio_Toma_Decisiones.md` para el detalle de negocio de cada
función y `docs/04_Manual_Usuario_Final.md` para el manual de usuario.

## Stack técnico

- **React 18** + **Vite 5** — SPA sin router (una sola vista con estado)
- **Supabase** (`@supabase/supabase-js`) — Postgres + REST, presupuestos y
  catálogo de almacén
- **SheetJS (xlsx)** — cargado dinámicamente por CDN solo al exportar a Excel
- Gráficas: SVG puro, sin librerías de charting
- Desplegado en **Vercel** (`vercel.json` con rewrite SPA)

## Estructura del proyecto

```
src/
  App.jsx           — toda la lógica y componentes de la app (~3,500 líneas)
  excelImport.js     — parser de la plantilla real de presupuestos de Geolis
                       (pendiente de conectar a la UI, ver bitácora técnica)
  supabaseClient.js  — inicialización del cliente de Supabase
  supabaseApi.js     — funciones de acceso a datos (presupuestos, catálogo)
  main.jsx           — entrada de React
  index.css          — estilos globales

catalogo_almacen*.json/.sql   — catálogo de artículos de almacén (generado)
_gen_catalogo_almacen.mjs      — generador del catálogo desde el Excel fuente
supabase_catalogo.sql          — inserts para cargar el catálogo en Supabase

docs/        — manuales, guía de negocio, capturas de pantalla, Excels fuente
presupuestos/ — Excels y audios de referencia de proyectos reales

01_Bitacora_Tecnica_Cambios.md      — historial técnico detallado
02_Guia_Negocio_Toma_Decisiones.md  — guía de negocio / uso para decisiones
```

## Requisitos previos

- Node.js 18+
- Un proyecto de [Supabase](https://supabase.com) con las tablas
  `presupuestos` y `catalogo_almacen` (ver `supabase_catalogo.sql` para el
  catálogo de almacén)

## Configuración

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Completa las variables con los datos de tu proyecto de Supabase
   (Project Settings → API en el dashboard de Supabase):
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx
   ```

Sin estas variables, la app sigue funcionando pero solo con `localStorage`
(sin guardar en la nube ni buscar en el catálogo de almacén).

## Desarrollo

```bash
npm install
npm run dev       # servidor de desarrollo (Vite)
npm run build     # build de producción → dist/
npm run preview   # sirve el build de producción localmente
```

## Despliegue

El proyecto está preparado para Vercel: `vercel.json` define el rewrite
necesario para que la SPA funcione en cualquier ruta. Configura las mismas
variables de entorno de `.env` en el proyecto de Vercel
(Project Settings → Environment Variables) antes de desplegar.
