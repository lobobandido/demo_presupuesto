# Spec — Navegación y rótulos (retro 4:10)

App: `demo-presupuesto` · `src/App.jsx`
Base: commit `fd7700a` (día 3 del spec de dos sistemas)

**Hacer esto ANTES del día 4.** Redefine los botones y la ruta de todas las pantallas, incluida
Capturar costos, que es donde el día 4 va a insertar la sección de ingresos.

---

## Regla

Todo lo de aquí es **texto, botones y navegación**. Cero cálculos.

No se abren: `distribuirOpex`, `distribuirNomina`, `mesIndexCapex`, `calcularNumMesesOp`,
`calcularSerieMensual`, `construirFilasServicio`, `exportarExcel`, `guardarArea`, `guardarPres`,
`totalCat`, `totalNom`, `totalOpexAnualCat`.

Verificación al final: los cinco KPIs y el Excel idénticos.

---

## 1. La ruta de navegación

Es el cambio de fondo. La miga de pan **es** la navegación, y cada eslabón es clicable.

| Pantalla | Miga de pan |
|---|---|
| Listado | `Inicio / Presupuestos` |
| Formulario de edición | `Inicio / Presupuestos / [nombre]` |
| Información general | `Inicio / Presupuestos / [nombre] / Información general` |
| Resumen mensual | `Inicio / Presupuestos / [nombre] / Información general / Resumen mensual` |
| Capturar costos | `Inicio / Presupuestos / [nombre] / Captura de información` |

Destinos al picar:
- **Presupuestos** → el listado
- **[nombre del proyecto]** → el formulario de edición
- **Información general** → la vista de Información general
- El último eslabón es la pantalla actual: no es clicable, va en negritas

Cita: *"primero inicio, luego presupuestos, que lo lleva al listado, y después el nombre del
proyecto, que lo lleva a la edición. Luego llega a la información general."*

**La ruta no sustituye a los botones de regreso.** Son complementarios: la miga de pan permite
saltar a cualquier nivel, y el botón regresa al nivel anterior de un clic. Ver punto 6.

---

## 2. Barra lateral

Quitar la palabra **CORPORATIVO** del encabezado. Queda solo `GEOLIS` y debajo
`Módulo de Presupuestos`.

Cita: *"aquí también corporativo, no va."*

---

## 3. Listado de presupuestos

### 3.1 Datos de cada renglón

Hoy debajo del nombre sale una fecha suelta. Debe decir, concatenado:

```
Perdiz - Papan CS
Inicio del proyecto: 2023-12-01
Vigencia: 2023-12-01 → 2024-12-01
```

Citas: *"con una descripción de inicio del proyecto… dos puntos, espacio y ya"* ·
*"aquí abajo del nombre del proyecto, la vigencia."*

### 3.2 Acciones — **tres botones** (confirmado por el líder)

**Quitar únicamente "Eliminar".** Quedan tres, en este orden:

| Botón | Función | Destino | Estilo |
|---|---|---|---|
| **Editar** | `abrirEdit(p)` | formulario de edición (Step 1) | primario |
| **Información general** | `abrirPresupuesto(p)` | Información general (Step 5) | secundario |
| **Clonar** | `clonarPresupuesto(p)` | igual que hoy | secundario |

**"Abrir" no se elimina: se renombra a "Información general".** Sigue llamando a
`abrirPresupuesto`, que ya lleva a esa pantalla y refresca desde Supabase. **Es solo cambio de
etiqueta, no de cableado.**

Con esto se puede consultar un presupuesto sin pasar por el formulario de edición, y la ruta de
navegación del punto 1 no cambia: la miga de pan es una jerarquía, no un historial, así que el
eslabón `[nombre]` sigue llevando a la edición aunque no se haya venido de ahí.

"Editar" va primero por indicación explícita: *"vamos a dejar editar aquí, como primer botón."*

**Pendiente de confirmar:** al quitar "Eliminar" de la lista, la única forma de borrar queda el 🗑
de la barra superior, que solo aparece dentro de un presupuesto. Confirmar que se quiere eso y no
que la función desaparezca por completo.

---

## 4. Formulario de edición (Step 1)

Fila de botones **arriba**:

| Botón | Acción |
|---|---|
| **Información general** | va a Información general |
| **Guardar** | igual que hoy |
| **Cancelar** | igual que hoy |

- **Quitar el PDF de esta pantalla.** Cita: *"este PDF… en editar, sí, quitarlo."*
- No debe haber ningún otro botón. Cita: *"quiero darme a entender que aquí es un cancelar,
  guardar. No hay más."*
- Si hoy hay Guardar/Cancelar duplicados arriba y abajo, dejar **una sola** pareja. Cita:
  *"está muy redundante… dos opciones de guardar… va a confundir al usuario."*

---

## 5. Información general (Step 5)

**Quitar el botón "✎ Editar".** La edición se llega desde el listado o desde la miga de pan.

Quedan dos:

| Botón | Acción |
|---|---|
| **Resumen mensual** | va a Resumen mensual |
| **⬇ PDF** | igual que hoy |

Cita: *"entramos a información general, ya no va a estar en editar, ya no. Quitar botón de editar."*

**Y quitar de esta pantalla la línea de elaboración y vigencia**, que ahora viven en el listado
(punto 3.1). El periodo sí se queda: es lo que da contexto a las columnas de mes.

Cita: *"¿esto lo quito de aquí de esta vista? Pues sí, y que nada más aparezcan en el principio."*

---

## 6. Resumen mensual (Step 4)

Quedan **tres botones**:

| Botón | Acción |
|---|---|
| **← Información general** | regresa a Información general |
| **⬇ Excel** | igual que hoy |
| **⬇ PDF** | igual que hoy |

**Quitar solo `Editar por área`.** El botón de regreso **se queda**.

Razón: en esta reunión dijo *"resumen mensual… Excel y PDF"*, pero enseguida planteó
*"ahora, si yo quiero regresar a información general, pues obviamente le voy a dar clic en…
**ahí la navegación se va a complicar**"* — levantó el problema y no lo cerró, se pasó a otro tema.

Y en la retro anterior lo había pedido explícitamente:

> *"Usted quitó el botón, pero no debía de quitarlo. Debería ahora, en vez de decir 'Resumen
> mensual', decir 'Información general'. ¿Para qué? Para que haga la misma función: cuando le dé
> clic aquí, lo regrese aquí. Y aquí ya cambia a 'Resumen mensual'."*

Es un **par recíproco**: Información general tiene el botón de ida ("Resumen mensual"), Resumen
mensual tiene el de regreso ("← Información general").

La miga de pan y el botón no compiten. La ruta permite saltar a cualquier nivel; el botón regresa
al anterior de un clic. Las dos cosas conviven.

---

## 7. Capturar costos (Step 3)

El título y la miga de pan cambian según de dónde se llegue:

| Situación | Título |
|---|---|
| Presupuesto nuevo, en el flujo de creación | **Captura de información** |
| Presupuesto existente | **Editar — [nombre del proyecto]** |

Cita: *"aquí le debería aparecer captura de información. Cuando esté en editar, edición… editar y
el nombre del proyecto."*

Ya existe el estado `flujoCreacion` en el spec anterior para distinguir los dos casos; si no se ha
implementado, agregarlo aquí (`true` en `abrirNuevo` y `clonarPresupuesto`).

---

## 8. Clonar

Al abrir el diálogo de clonar debe verse **de cuál presupuesto se está copiando**, y el selector
debe reaccionar al tipo: si se cambia el tipo a departamento, las opciones cambian.

Botones: **Cancelar** y **Continuar**. Nada más.

Citas: *"aquí te debe poner el [nombre] de la plantilla… si usted cambia la plantilla a una de
departamento, tiene que cambiar sus opciones"* · *"quiere cancelar y continuar."*

---

## 9. Rótulos de ingresos

Cita textual: *"me falta cambiarle que es de ingresos mensuales… porque está mal etiquetado."*

- "Ingresos adicionales" → **"Ingreso por mes"**
- "Facturación proyectada" → **"Ingresos"**
- Quitar el texto "se suman al precio fijo" donde no aplica

**Esto es lo mínimo.** La captura condicional por tipo (servicio con precio diario, instalación con
monto por mes) sigue siendo parte del día 4 del otro spec.

---

## Criterios de aceptación

- [ ] La barra lateral no dice "CORPORATIVO".
- [ ] Cada renglón del listado muestra "Inicio del proyecto:" y "Vigencia:" debajo del nombre.
- [ ] El listado tiene exactamente tres acciones: **Editar**, **Información general** y **Clonar**, en ese orden. Sin "Eliminar".
- [ ] "Editar" lleva al formulario de edición; "Información general" lleva a la vista de consulta. Cada uno a su destino.
- [ ] La miga de pan de cada pantalla es la de la tabla del punto 1, y cada eslabón navega a donde
      dice.
- [ ] El formulario de edición tiene solo Información general, Guardar y Cancelar. Sin PDF.
- [ ] Información general tiene solo Resumen mensual y PDF. Sin Editar.
- [ ] Resumen mensual tiene ← Información general, Excel y PDF. Sin "Editar por área".
- [ ] El par recíproco funciona: de Información general a Resumen mensual y de regreso, con botón en las dos direcciones.
- [ ] Capturar costos dice "Captura de información" al crear y "Editar — [nombre]" al editar.
- [ ] Se puede recorrer listado → Editar → Información general → Resumen mensual, y también
      listado → Información general directo, regresando por la miga de pan en cada paso.
- [ ] **Los cinco KPIs y el Excel dan exactamente lo mismo que antes.**

---

## Dudas a resolver con el cliente

1. **Eliminar:** al quitarlo del listado, ¿la función se queda solo en el 🗑 de la barra superior,
   o desaparece del todo?
2. **"Inicio" en la miga de pan:** con "Presupuestos" apuntando al listado, ¿"Inicio" a dónde va?
   Hoy los dos llevan al mismo lugar.
3. ~~**Ver sin editar**~~ — **RESUELTA.** El líder confirmó tres botones en el listado: Editar,
   Información general y Clonar. Sí hay acceso directo a la vista de consulta. Ver punto 3.2.
