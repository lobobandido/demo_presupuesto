# Registro de decisiones de producto

**Fecha de corte:** 2026-08-11 · **Commit base:** `bf3f5b0`

Una fila por decisión, con la cita textual del cliente, la fecha, el spec de origen y qué tan firme
es. Las citas se transcriben **verbatim** de los specs de `docs/specs/` y de los comentarios de
`src/App.jsx`; donde no hay cita textual registrada, se dice explícitamente.

Las fechas de las decisiones tardías (las que no vienen de un spec) se fijaron con el historial de
git, no de memoria.

## Clasificación

| Etiqueta | Significado |
|---|---|
| **CERRADA** | El cliente la confirmó y está implementada |
| **CERRADA-PENDIENTE** | Confirmada, no implementada |
| **REABIERTA** | El cliente la contradijo después — se anotan las dos versiones y las dos fechas |
| **ABIERTA** | Pregunta sin respuesta del cliente |

---

## 1. REABIERTAS — dónde cambió el criterio

**Nueve decisiones se revirtieron después de haberse fijado.** Son las que hacen que los specs se
contradigan entre sí, y la razón por la que ninguno sirve como referencia de implementación.

| # | Decisión | Versión 1 (fecha · origen) | Versión 2 (fecha · origen) | Qué corre hoy |
|---|---|---|---|---|
| R1 | **Destino de "Editar" del listado** | 2026-08-04 · `spec-navegacion-retro-410` §3.2 — la tabla lo manda al formulario de Datos generales (Step 1) | 2026-08-06 · corrección posterior en el mismo spec: al revisar la transcripción, *"cuando el cliente decía «formulario de edición» estaba señalando la pantalla de captura, no el paso 1"* | Va a **Capturar costos (Step 3)** — `App.jsx:2413`, commit `d2763e1` |
| R2 | **Orden de los botones del listado** | 2026-08-04 · `spec-navegacion-retro-410` §3.2 — *"vamos a dejar editar aquí, como primer botón"* | 2026-08-07 · Luis, WhatsApp — *"aquí que vaya primero información general y después el botón de editar"* | **Información general, Editar, Clonar** — `App.jsx:2974-2991`, commit `f243158` |
| R3 | **Destino del eslabón `[nombre del proyecto]`** | 2026-08-04 · `spec-navegacion-retro-410` §1 — *"primero inicio, luego presupuestos, que lo lleva al listado, y después el nombre del proyecto, que lo lleva a la edición"* | 2026-08-06 · *"De acá pues debería de mandarlo no aquí, sino al formulario de captura"* · *"aquí no debería de aparecer... o sea, sí, pero no debería de tener acción"* | Va a **Capturar costos**; en Capturar costos se muestra **sin acción** — `App.jsx:2752-2756`, `3825-3827`, commit `a00e5b0` |
| R4 | **Eliminar un presupuesto** | 2026-08-04 · `spec-navegacion-retro-410` §3.2 — *"Quitar únicamente «Eliminar»"* del listado, dejándolo en el 🗑 de la barra superior | 2026-08-07 · Luis, WhatsApp — *"en el breadcrumb quite el botecito de eliminar en todas las pantallas"* | **Ningún camino de UI para eliminar** — `App.jsx:2915-2923`, commit `ec9d6bc`. `eliminarPresupuesto` (`App.jsx:2436-2454`) sigue definida e inalcanzable |
| R5 | **Botón "Capturar costos" en Información general** | 2026-08-06 · `spec-recuperacion-datos` PASO 4 — lo pide para devolver el acceso perdido; implementado en `e4339bd` | 2026-08-06 · **el mismo día** — *"Capturar el costo pues no va aquí, ¿por qué lo pondría aquí?"* | **No existe** — `App.jsx:4244-4248`, commit `d7abcef` |
| R6 | **Modo lectura/edición in situ en Información general** | 2026-08-04 · `spec-final-ux-agosto` §2.2 — *"sí está bien, pero no en un formulario de editar… sí está bien, pero en la información general"*; implementado en `2e806fa` | 2026-08-05 · `spec-dos-sistemas-semana` día 3 — la pantalla deja de tener campos, así que el interruptor pierde sentido. El propio spec lo llama *"un cambio de criterio del cliente entre una retro y la siguiente, no un error de nadie"* | **No hay modo edición**: Step 5 es solo lectura fija — `App.jsx:4355`, `4366`, `4384`, `4399`, commits `fd7700a` / `94cac39` |
| R7 | **Detalle por área en Información general** | 2026-08-05 · `spec-dos-sistemas-semana` día 3 — sale el `areas.map()` completo, por la queja *"dice materiales, materiales, materiales, materiales… nómina, nómina, nómina. No le entiendo"* | 2026-08-06 · corrección: *"el cliente pidió cambiar CÓMO se edita, no borrar el detalle por área de esta pantalla de consulta"* | **Vuelve, en texto plano** — `App.jsx:4299-4403`, commit `930016c` |
| R8 | **Botón "Información general" en el formulario de edición** | 2026-08-04 · `spec-navegacion-retro-410` §4 — la tabla de botones lo incluye | 2026-08-07 · Luis — en Nuevo presupuesto *"«Información general» ya NO aparece, ni siquiera atenuado: solo quedan Cancelar y Continuar"* | **No existe** — `App.jsx:3049-3061`, commit `e5d9f5f` |
| R9 | **Rótulo de la sección de ingresos** | 2026-08-04 · `spec-navegacion-retro-410` §9 — *"me falta cambiarle que es de ingresos mensuales… porque está mal etiquetado"* → "Ingresos adicionales" pasa a **"Ingreso por mes"** | 2026-08-10 · *"este es el mecanismo principal de facturación, no un extra"* | Se llama **"Ingresos"** — `App.jsx:3501`, `3547`, commit `17aa886` |

**Patrón:** siete de las nueve reversiones son de **navegación** (dónde lleva cada botón, qué botones
existen). R5 se revirtió el mismo día en que se implementó. Ninguna reversión movió un monto.

---

## 2. CERRADAS — confirmadas e implementadas

| # | Decisión | Cita textual | Fecha | Spec de origen | Verificación |
|---|---|---|---|---|---|
| C1 | Separar captura de visualización | *"primero es un sistema de captura y luego es un sistema de visualización, está bien fácil"* | 2026-08-04 | `spec-dos-sistemas-semana`, objetivo | Step 3 captura, Steps 4-5 sin campos — `App.jsx:4002-4010` |
| C2 | Ingresos sale de Resumen mensual | *"¿por qué hay un botón de ingresos, o sea, para de un formulario en una visualización?"* | 2026-08-04 | `spec-dos-sistemas-semana` día 4 | `App.jsx:3495-3648` (captura) y `4002-4051` (solo lectura), commit `198b9d8` |
| C3 | Información general muestra la tabla SERVICIO | *"dice materiales, materiales, materiales, materiales… nómina, nómina, nómina. No le entiendo"* | 2026-08-04 | `spec-dos-sistemas-semana` día 3 | `TablaServicio` — `App.jsx:2114-2186`, `4291` |
| C4 | Vaciar el menú lateral | Sin cita textual en el spec; el registro dice *"El cliente picó «Info general» en el menú y no pasó nada"* | 2026-08-04 | `spec-final-ux-agosto` §1.1 | `NAV` con una entrada — `App.jsx:2738-2740` |
| C5 | "Mi presupuesto" → "Información general" | Sin cita textual; instrucción directa del spec | 2026-08-04 | `spec-final-ux-agosto` §1.3 | `App.jsx:4230` |
| C6 | Los botones de navegación no se duplican, y no dependen de `areaSaved` | *"usted quitó el botón, pero no debía de quitarlo"* | 2026-08-04 | `spec-final-ux-agosto` §1.4 | Barra pegajosa sin botones — `App.jsx:2915-2923` |
| C7 | Quitar la columna "Estado" de la interfaz, sin borrarla del modelo | *"¿cómo defines si es borrador o no, si al final ya lo creaste? No es como un correo"* | 2026-08-04 | `spec-final-ux-agosto` §1.7 | `App.jsx:2944-2945`; `guardarPres` sigue escribiendo `estado` — `App.jsx:2531` |
| C8 | Quitar "CORPORATIVO" de la barra lateral | *"aquí también corporativo, no va"* | 2026-08-04 | `spec-navegacion-retro-410` §2 | `App.jsx:2851-2853` |
| C9 | Inicio del proyecto y vigencia bajo el nombre, en el listado | *"con una descripción de inicio del proyecto… dos puntos, espacio y ya"* · *"aquí abajo del nombre del proyecto, la vigencia"* | 2026-08-04 | `spec-navegacion-retro-410` §3.1 | `App.jsx:2964-2965` |
| C10 | Quitar el botón "✎ Editar" de Información general | *"entramos a información general, ya no va a estar en editar, ya no. Quitar botón de editar"* | 2026-08-04 | `spec-navegacion-retro-410` §5 | `App.jsx:4249-4252` |
| C11 | Elaboración y vigencia salen de Información general | *"¿esto lo quito de aquí de esta vista? Pues sí, y que nada más aparezcan en el principio"* | 2026-08-04 | `spec-navegacion-retro-410` §5 | `App.jsx:4241-4242` |
| C12 | Quitar "Editar por área" de Resumen mensual, pero conservar el botón de regreso | *"ahora, si yo quiero regresar a información general, pues obviamente le voy a dar clic en… ahí la navegación se va a complicar"* | 2026-08-04 | `spec-navegacion-retro-410` §6 | `App.jsx:3991-3999` |
| C13 | El título de Capturar costos cambia según de dónde se llegue | *"aquí le debería aparecer captura de información. Cuando esté en editar, edición… editar y el nombre del proyecto"* | 2026-08-04 | `spec-navegacion-retro-410` §7 | `App.jsx:3460-3462` |
| C14 | El diálogo de Clonar muestra el origen y reacciona al tipo | *"aquí te debe poner el [nombre] de la plantilla… si usted cambia la plantilla a una de departamento, tiene que cambiar sus opciones"* · *"quiere cancelar y continuar"* | 2026-08-04 | `spec-navegacion-retro-410` §8 | `App.jsx:3001-3035`, commits `3df6c4c` / `f127f12` |
| C15 | CAPEX antes de OPEX en la tabla | Resuelve la contradicción de D.5 (*"primero tu OPEX, luego ves tu CAPEX"* vs *"aquí lo divides primero por OPEX y luego por CAPEX… está chido"*) | 2026-08-04 | `spec-dos-sistemas-semana` E.1 | `construirFilasServicio` — `App.jsx:1807-1865` |
| C16 | Las gráficas van abajo, después de las tablas | *"ves tus CAPEX […] y abajo ya puedes ver tu flujo de efectivo y lo que es por categoría"* | 2026-08-04 | `spec-dos-sistemas-semana` E.3 | `App.jsx:4291` → `4406` → `4433` |
| C17 | Suministro no lleva base predefinida | Sin cita; razonado en el spec — `CONCENTRADO_VERACRUZ.xlsx` es una bitácora de requisiciones, otro modelo de datos | 2026-08-04 | `spec-final-ux-agosto` §3.3 | Ninguna plantilla lo incluye — `App.jsx:171`, `212`, `231` |
| C18 | Proteger los datos: guardarraíl y carga completa antes de editar/clonar | Sin cita; origen es el incidente del 6 de agosto | 2026-08-06 | `spec-recuperacion-datos` pasos 1, 2, 3, 5 | `supabaseApi.js:151-154`; `App.jsx:2382-2390`, `2463-2471`, `2543-2547` |
| C19 | En Clonar, el tipo se hereda del origen y no se puede cambiar | *"Confirmado en producción — el tipo lo hereda el clon del origen y NO debe poder cambiarse ahí"* | 2026-08-06 | comentario en `App.jsx:3225-3229` | `App.jsx:3230-3237`, commit `1406992` |
| C20 | Ocultar la sección de Ingresos para Departamento y Suministro | Sin cita; se deriva de que esos tipos no facturan | 2026-08-07 | `spec-dos-sistemas-semana` día 4 | `App.jsx:3447`, `3849`, commit `8e5f4dc` |
| C21 | Un solo botón "Guardar" en Capturar costos | *"pedido de hoy: dejar de tener dos llamadas a `guardarPresupuestoEnNube` con snapshots independientes"* | 2026-08-10 | comentario en `App.jsx:2650-2657` | `guardarTodo` — `App.jsx:2658-2705`, commit `02f8a05` |
| C22 | No hay forma de eliminar un presupuesto desde la UI, y así se queda por ahora | *"Confirmado por Luis: intencional por ahora, sin fecha de revisión"* | 2026-08-10 | `CLAUDE.md`, "Pendientes de producto" | Consecuencia de R4 |

---

## 3. CERRADA-PENDIENTE — confirmadas, sin implementar

| # | Decisión | Cita textual | Fecha | Spec de origen | Por qué sigue pendiente |
|---|---|---|---|---|---|
| P1 | Equipo de cómputo se captura en CAPEX y entra en ACTIVOS | *"El CAPEX solamente es esto: los activos. […] Igual equipos de cómputo debería ir acá. En CAPEX"* | 2026-08-04 | `spec-dos-sistemas-semana` D.6 → E.2 | La decisión está tomada, pero se materializa **en los datos**, no en código: depende del día 5, que no ocurrió |
| P2 | Apagar las plantillas de código (`tipos: []`) | *"que ya esto esté precargado, y yo solamente le cambio la cantidad"* | 2026-08-06 | `spec-recuperacion-datos` paso 6 | Las tres siguen pobladas y alcanzables — `App.jsx:171`, `212`, `231` |
| P3 | Cargar el ejemplo real completo de Cuervito (~45 subcategorías) | *"tienen que hacer un ejemplo real, güey"* (repetido cuatro veces) | 2026-08-04 | `spec-dos-sistemas-semana` día 5 | La plantilla sigue con 16 CAPEX y 10 OPEX agregados — `App.jsx:174-204` |
| P4 | Corregir las leyendas de la gráfica de flujo | *"¿Cuál es el flujo acumulado y cuál es este? O sea, porque no son los colores, esta es una línea azul"* | 2026-08-04 | `spec-dos-sistemas-semana` D.1 | Los dos desajustes siguen: `App.jsx:4115` vs `1711`, `4116` vs `1718` |
| P5 | Rotular que las cifras son presupuestadas, no ejecutadas | *"¿esto es lo que voy a gastar de CAPEX o lo que ya gasté?"* | 2026-08-04 | `spec-dos-sistemas-semana` D.2 | Uno de tres hecho ("Total Presupuestado", `App.jsx:2135`). Faltan la línea bajo el título y "EGRESOS PRESUPUESTADOS" (`App.jsx:1805` dice "EGRESOS año") |
| P6 | Impedir que se capture nómina en Materiales/Viáticos | *"Metieron en OPEX en un OPEX de materiales nómina"* · *"¿y para qué chingados está acá entonces?"* | 2026-08-04 | `spec-dos-sistemas-semana` D.4 | El dropdown la excluye (`App.jsx:870-872`) pero `CatalogInput` acepta texto libre (`App.jsx:763`) y no hay validación al guardar |
| P7 | Avisar cuando el periodo arranca antes del primer gasto | *"Si mi primer gasto lo voy a realizar en febrero, pues inicio en febrero. Si mi primer gasto lo voy a hacer en marzo, pues inicio en marzo"* | 2026-08-04 | `spec-dos-sistemas-semana` D.3 | No existe el aviso |
| P8 | Eliminar la plantilla "Proyecto de Instalación" | *"viene bien diferente"* | 2026-08-04 | `spec-final-ux-agosto` §3.1 | Sigue completa, con todos los montos en cero — `App.jsx:211-229` |
| P9 | Unificar las dos listas del modal de bases, con chip de origen | *"¿cuál es la diferencia entre estas y estas?"* | 2026-08-04 | `spec-final-ux-agosto` §3.2 | Siguen separadas y con estilos distintos — `App.jsx:3283-3301` y `3325-3341` |
| P10 | Indicador de 3 pasos durante la creación | Sin cita; el spec lo justifica por la pérdida de referencia al vaciar el menú. `spec-dos-sistemas-semana` lo ratifica: *"Se queda. Más necesario que antes"* | 2026-08-04 | `spec-final-ux-agosto` §2.1 | `flujoCreacion` existe (`App.jsx:2221`) y gobierna título y botones, pero no hay JSX de indicador |
| P11 | Ocultar los renglones en cero, con interruptor | *"no tiene por qué aparecerme uno cada uno, solamente las categorías"* — **la cita respalda el colapsado, que sí está hecho** (`App.jsx:2147`); el interruptor de ceros es una inferencia del spec, sin cita propia | 2026-08-04 | `spec-dos-sistemas-semana` día 2 | `TablaServicio` pinta todas las filas que recibe — `App.jsx:2114-2186` |
| P12 | M0 debe aceptar OPEX | *"El cliente confirmó que M0 SÍ debe permitirse"* | Sin fecha registrada | `CLAUDE.md`, bugs conocidos | `Math.max(1,…)` sigue en `distribuirOpex` (`App.jsx:289`) y en el selector de mes |

---

## 4. ABIERTAS — sin respuesta del cliente

| # | Pregunta | Cita o planteamiento | Fecha | Origen |
|---|---|---|---|---|
| A1 | ¿Cómo se editan nombre, tipo y fechas de un presupuesto ya guardado? | *"con este cambio, **no queda ningún camino de UI a Datos generales (Step 1) para un presupuesto ya existente**. […] Pregunta abierta con el cliente — no se resolvió hoy, solo se documenta"* | 2026-08-06 | `spec-navegacion-retro-410`, corrección segunda. **Consecuencia directa de R3.** Las fechas gobiernan todas las columnas de mes |
| A2 | ¿"INSUMOS OPERATIVOS" e "INSUMOS DE OFICINA" son dos rubros de 2,700/mes o el mismo dinero contado dos veces? | *"Esto hay que preguntárselo al cliente antes de cargar el ejemplo, porque cambia el total en 32,400"* | 2026-08-04 | `spec-dos-sistemas-semana`, apéndice B nota 2 |
| A3 | Con "Presupuestos" apuntando al listado, ¿a dónde debe ir "Inicio" en la miga de pan? | Duda 2 del spec, sin resolver | 2026-08-04 | `spec-navegacion-retro-410`. Hoy los dos llevan al mismo lugar — `App.jsx:2896-2897`, `3037` |
| A4 | ¿Qué espera ver en la visualización de Gantt? | *"Todavía no logran hacer la visualización de Gantt"* — lo mencionó de paso, sin desarrollarlo | 2026-08-04 | `spec-dos-sistemas-semana` D.7 |
| A5 | ¿Un puesto de nómina con cantidad 0 debe poder capturarse? | *"Falta decidir si cantidad 0 debe poder capturarse"* | Sin fecha registrada | `CLAUDE.md`, bugs conocidos. Hoy `p.cantidad||1` lo cuenta como 1 persona (`App.jsx:362`) |

---

## Conteo

| Clasificación | Cantidad |
|---|---|
| CERRADA | 22 |
| CERRADA-PENDIENTE | 12 |
| **REABIERTA** | **9** |
| ABIERTA | 5 |
| **Total** | **48** |
