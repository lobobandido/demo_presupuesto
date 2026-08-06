# Spec — Recuperación: proteger los datos y restaurar los accesos

App: `demo-presupuesto` · `src/App.jsx` y `src/supabaseApi.js`

**Origen:** el 6 de agosto se perdieron las 54 partidas de "Perdiz - Papan CS" y las de
"EJEMPLO CUERVITO" en Supabase. Causa: `abrirEdit` carga el objeto ligero del listado (sin
`_areas` ni `_costos`), y al guardar se escribió ese vacío encima.

---

## REGLA ABSOLUTA DE ESTA PASADA

**Ninguna prueba automatizada corre contra Supabase de producción.** Ni crea, ni edita, ni borra
registros. Nada de Playwright escribiendo en la base real. Esa es la causa exacta de la pérdida.

Verificación permitida: `npm run build`, lectura por API REST (solo `GET`), y pruebas manuales en
navegador que el usuario hace, no el agente.

**Único presupuesto íntegro para comparar:** `Presupuesto TI H1 2026` →
CAPEX **3,822,412** · OPEX **1,157,279.86** · Total egresos **4,979,691.86**.
Debe dar lo mismo antes y después de cada paso.

---

## PASO 0 — Limpiar la basura (2 minutos)

Borrar de Supabase, solo estos tres:

- `Perdiz - Papan CS (copia)` — id `1a3e859d-0d87-47f3-9deb-31ac1c9ada13`
- `Perdiz - Papan CS (copia)` — id `8cdd7636-2fbb-4b37-a841-c5bb41dbb7bb`
- `Prueba Browser QA`

**No tocar** los otros tres. Confirmar con un `GET` que quedan exactamente:
`Perdiz - Papan CS`, `EJEMPLO CUERVITO`, `Presupuesto TI H1 2026`.

---

## PASO 1 — Guardarraíl: no escribir cero áreas sobre un presupuesto existente

**El más importante. Es la red de seguridad que impide que esto se repita.**

En `guardarPresupuestoEnNube` (`src/supabaseApi.js`), antes de borrar y reinsertar áreas y
partidas: si el arreglo de áreas que llega está **vacío** y el presupuesto **ya existe** en la base,
**no tocar áreas ni partidas**. Actualizar solo los campos generales (nombre, tipo, empresa,
fechas) y salir.

```
si (areas.length === 0 && el presupuesto ya existe):
    actualizar solo campos generales
    console.warn("[supabase] guardado con 0 áreas sobre presupuesto existente —
                  se conservan las áreas y partidas ya guardadas")
    return
```

**Por qué es seguro:** cero áreas nunca es un estado legítimo de un presupuesto guardado. El botón
"Confirmar" del paso de Áreas está deshabilitado con `areas.length===0`, así que no hay forma
legítima de llegar a cero. Si llega cero, es un error, no una intención.

Un presupuesto **nuevo** sí puede guardarse con cero áreas (se crea en el paso 1, antes de elegir
áreas). Por eso la condición incluye "ya existe".

---

## PASO 2 — `abrirEdit` debe cargar el presupuesto completo

`abrirEdit(p)` recibe el objeto ligero de `listarPresupuestos()`, que no trae `_areas` ni
`_costos`. Por eso el formulario de edición arranca vacío.

Hacerla `async` y cargar desde la nube primero, **con el mismo patrón que ya usa
`abrirPresupuesto`**:

```js
if (supabase && typeof p.id === "string") {
  const remoto = await cargarPresupuestoDeNube(p.id, {uid, initP, initN});
  if (remoto) p = remoto;
}
```

Y de ahí seguir con el cuerpo actual de la función, sin cambiar nada más.

Si `cargarPresupuestoDeNube` devuelve nulo (falla de red), **no continuar con el objeto ligero**:
avisar al usuario y quedarse en el listado. Es preferible no abrir a abrir vacío.

---

## PASO 3 — `clonarPresupuesto` tiene el mismo bug

Usa `p._areas`, `p._costos`, `p._capexPM`, `p._opexPM`, `p._ingresos`, `p._precioFijo` y
`p._ingAdicionales` del objeto ligero. Por eso los dos clones del paso 0 salieron con cero áreas.

Mismo arreglo: `async`, cargar desde la nube, y luego el cuerpo actual tal cual.

---

## PASO 4 — Devolver el acceso a Capturar costos

El spec de navegación quitó "Editar por área" de Resumen mensual y "Editar" de Información general.
Con eso, el único camino a Capturar costos quedó el asistente completo — que es justo el que tenía
el bug del paso 2.

En **Información general**, agregar un botón a la fila existente:

| Botón | Acción |
|---|---|
| **Capturar costos** | `setStep(3)` |
| Resumen mensual | ya existe |
| ⬇ PDF | ya existe |

Al ir a Capturar costos: si `areaActiva` es nulo, preseleccionar la primera área de `areas`. Y
`flujoCreacion` en `false`, para que el encabezado diga "Editar — [nombre]" y no
"Captura de información".

---

## PASO 5 — `guardarPres` deja de limpiar el estado

Quitar estas cuatro asignaciones:

```js
setAreas([]); setCostos({}); setCapexPM([]); setOpexPM([]);
```

Son redundantes —`abrirNuevo` ya resetea todo al crear— y son las que provocan que
"partir de un presupuesto anterior" pierda las partidas copiadas al picar Continuar:
`confirmarAreas` encuentra `costos` vacío y sin `plantKey` no hay nada que reinyecte.

Verificar los **dos** caminos antes de seguir:
- cargar una plantilla → Continuar → Áreas → Confirmar → que las partidas sigan
- partir de un presupuesto guardado → lo mismo

---

## PASO 6 — Apagar las plantillas del código

Cambiar el campo `tipos` de las tres entradas de `PLANTILLAS` a `[]`, con un comentario que
explique por qué. **No borrar** los objetos, ni `cargarPlantilla`, ni la rama de `plantKey` en
`confirmarAreas`: quedan intactos y funcionales, solo inalcanzables, para revertir con una línea.

Razones:
- Las tres están mal: la de instalación en ceros, la de Cuervito con precios en **dólares**
  (tomó la columna `IMPORTE [USD]` en vez de `IMPORTE [MN]`, paridad 18), y la de TI subestima el
  CAPEX en ~230 mil por promediar precios unitarios.
- El cliente pidió bases reutilizables desde la app, no plantillas que requieren programador:
  *"que ya esto esté precargado, y yo solamente le cambio la cantidad."*

Con esto, cada tipo ofrece como base únicamente los presupuestos guardados en Supabase.

---

## Verificación al final de cada paso

1. `npm run build` limpio.
2. Abrir `Presupuesto TI H1 2026` y confirmar CAPEX 3,822,412 · OPEX 1,157,279.86 ·
   Total 4,979,691.86.
3. Confirmar que el listado siga con los mismos tres registros.
4. Commit por paso, con su propio mensaje.

**El usuario hace las pruebas de navegador, no el agente.**

---

## Después de esto: recapturar

Con la app ya protegida, recapturar desde los Excel. Números de control:

| Presupuesto | Ingresos | CAPEX | OPEX | Total egresos |
|---|---|---|---|---|
| Perdiz - Papan CS | 71,207,752.69 | 25,351,949.71 | 9,886,209.30 | 35,238,159.02 |
| Cuervito | 6,609,600 | 6,954,940 * | — | — |

\* El CAPEX correcto de Cuervito en pesos es 6,954,940, no los 905,830 de la plantilla ni los
7,169,660 que dice su hoja SERVICIO. Esa hoja mezcla el renglón de transporte **con IVA**
(550,000 × 1.16 = 638,000) mientras los otros cuatro van sin IVA, y su renglón de transmisión trae
126,720 que no salen de ninguna partida. Está pendiente de aclarar con el cliente.
