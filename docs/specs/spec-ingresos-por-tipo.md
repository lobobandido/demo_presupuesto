# Spec — Ingresos por tipo de presupuesto

> **Nota de origen:** no se encontró un spec anterior con este nombre ni con este contenido en el
> repositorio (ni en el árbol de trabajo ni en `git log --all`). Este documento se crea hoy,
> directamente como la versión ya corregida — no hay una versión previa que mostrar aquí como
> "antes". Si existía un plan escrito fuera de este repo (WhatsApp, doc externo) con más detalle
> del que se revirtió, avisa para incorporarlo.

## Corrección — instrucción directa de Luis, transcrita hoy

Cita textual:

> "El comportamiento es el mismo para todo... no hay una restricción de que por mes... la persona
> que está capturando tiene que tener la opción de elegir... no es un cálculo."

Esto revierte cualquier plan de generar el mecanismo de ingresos de forma distinta según el tipo de
presupuesto (Servicio vs. Instalación) o de calcularlo automáticamente.

## Mecanismo único, para Servicio e Instalación por igual

- **"Precio fijo mensual"** — atajo OPCIONAL, nunca obligatorio.
- **"Ingreso por mes"** — mecanismo principal: renglones manuales libres (mes, año, descripción,
  monto). Sin restricción de periodicidad ni cálculo automático.
- **Departamento y Suministro:** sin ingresos (sin cambio — ya era así).

## Descartado

El generador de **"precio diario × días del mes"**. No se construye.

## Se conserva del plan anterior

Estos dos puntos NO se revierten — siguen vigentes:

1. **Mover la captura de ingresos a Capturar costos (Step 3).** Hoy la captura vive en Resumen
   mensual — una pantalla de **visualización**, sin botón Guardar — y por eso NO persiste a
   Supabase (bug confirmado por GET: `precio_fijo` e `ingAdicionales` vacíos en Cuervito mientras la
   pantalla mostraba $7,905,600 desde localStorage; ver CLAUDE.md, "Bugs conocidos abiertos").
   Mover la UI de captura a Step 3 la deja bajo el mismo `guardarArea`/`guardarPres` que el resto de
   las partidas, para que sí se guarde.
2. **El bug del selector de mes de ingresos** (ver CLAUDE.md): rotula en base enero (M1 · Ene) en
   vez de derivar de `fechaInicio`; la distribución usa el índice M y descarta mes y año. En
   Cuervito corrió doce ingresos dos meses, dejó Ago 26 vacío y apiló dos renglones en M1.

## Estado

Solo documentación — este commit no toca `src/App.jsx`. La implementación (mover la captura a
Step 3 con el mecanismo único de arriba, y corregir el selector de mes) queda pendiente de que se
pida explícitamente.
