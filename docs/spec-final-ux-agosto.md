# Spec final — Retro de UX (4 de agosto) · 3 fases

App: `demo-presupuesto` · React + Supabase · archivo único `src/App.jsx`
Base: commit `2e806fa`

---

## Regla de oro

**Ningún monto puede cambiar.** Solo tres tipos de edición permitidos:

- **(a)** Envolver JSX que ya existe en un condicional.
- **(b)** Cambiar un texto visible, una etiqueta o mover un botón de contenedor.
- **(c)** Agregar estado o JSX nuevo que no reemplaza nada.

**No se abren:** `distribuirOpex`, `distribuirNomina`, `mesIndexCapex`, `calcularNumMesesOp`, los
cálculos de `calcularSerieMensual`, `totalCat`, `totalNom`, `totalOpexAnualCat`, `guardarArea`,
`upP/addP/rmP/addN/rmN`, `supabaseApi.js`. Se leen, no se editan.
(La única excepción es el punto **3.0**, que está marcado y aislado.)

**No se toca la lista de presupuestos.** Los tres ejemplos que hoy aparecen —Los Soldados
(Servicio), Perdiz - Papan CS (Instalación), Presupuesto TI H1 2026 (Departamento)— deben quedar
exactamente igual: mismos nombres, mismo orden, mismos tres registros. No modificar `lista`,
`listarPresupuestos` ni el estado inicial.

**Verificación obligatoria antes y después de cada fase:** anotar los cinco KPIs de Resumen mensual
(Ingresos, CAPEX, OPEX, Total egresos, Utilidad y su %) y exportar el Excel. Si un monto se movió,
revertir. Los rótulos de columna sí cambian (punto 1.6); los montos, nunca.

---

# FASE 1 — Nombres, menú, botones y fechas

Cero lógica. Es todo lo que se ve en la demo. Terminar y verificar esta fase completa antes de
seguir.

## 1.1 Vaciar el menú lateral

```js
const NAV=[{i:0,icon:"◉",label:"Presupuestos"}];
```

El cliente picó "Info general" en el menú y no pasó nada, porque `locked:!areaSaved` y `t.i<=step`
bloquean cuatro de los seis renglones. La navegación vive dentro del presupuesto.

**No borrar `areaSaved`**: se usa en otras condiciones. Solo desaparece del menú.

## 1.2 Quitar el bloque "Activo" de la barra lateral

Eliminar el bloque `{pres&&step>0&&(...)}` del `<aside>` ("ACTIVO / nombre / tipo / ELABORACIÓN /
VIGENCIA"). Ya está en el cuerpo de las pantallas.

**Excepción:** en **Capturar costos** hoy solo se ve `pres?.nombre` debajo del nombre del área.
Agregar en su encabezado el nombre del presupuesto y su periodo, para que el dato no falte en
ninguna pantalla.

## 1.3 Renombrar "Mi presupuesto" → "Información general"

**Todo** lo que diga "Mi presupuesto" pasa a decir "Información general":
- El `<h2>` del bloque `if(step===5)`.
- El breadcrumb: `wrap(..., "Mi presupuesto")` → `wrap(..., "Información general")`.
- El botón cruzado de Resumen mensual.

No choca con el paso 1, que se titula "Nuevo presupuesto" / "Editar presupuesto".

## 1.4 Sacar los botones de navegación de la barra pegajosa

**Este es el duplicado.** Hoy la barra pegajosa y la fila de botones muestran lo mismo: en
Información general sale "← Resumen mensual" amarillo arriba y gris abajo; en Resumen mensual sale
"Mi presupuesto →" amarillo arriba.

**Eliminar del header pegajoso los tres bloques de navegación:**
```js
{areaSaved&&step===3&&(<button>Ver Resumen mensual →</button>)}
{areaSaved&&step===4&&(<button>Mi presupuesto →</button>)}
{areaSaved&&step===5&&(<button>← Resumen mensual</button>)}
```
En la barra pegajosa solo quedan el 🗑 y el nombre de la empresa.

**Y que cada pantalla tenga su fila de botones**, alineada a la derecha, al mismo nivel que Excel y
PDF:

| Pantalla | Fila de botones (izquierda → derecha) |
|---|---|
| **Información general** (Step 5) | `✎ Editar partidas` *(primario)* · `Resumen mensual →` · `⬇ PDF` |
| **Resumen mensual** (Step 4) | `← Información general` · `Editar por área` · `⬇ Excel` · `⬇ PDF` *(primario)* |
| **Capturar costos** (Step 3) | `← Información general` * · `Resumen mensual →` |

\* Solo fuera del flujo de creación (ver 2.1): durante la creación, Información general todavía no
tiene nada que mostrar.

Capturar costos hoy **no tiene fila de botones** (solo el "Guardar" verde abajo). Hay que crearla,
arriba a la derecha del contenido, con el mismo patrón visual que las otras dos pantallas.

**Dirección de las flechas:** Información general es la pantalla base del presupuesto, así que se
sale con `→` y se regresa con `←`. No usar el orden numérico de los steps.

**Quitar la condición `areaSaved&&`.** El cliente dijo *"usted quitó el botón, pero no debía de
quitarlo"* — lo vio desaparecer justo por eso. Los botones se muestran siempre.

## 1.5 Los tres botones de edición: cada uno dice qué edita

No pueden llamarse igual, porque llevan a lugares distintos:

| Dónde | Etiqueta | Qué abre | Estilo |
|---|---|---|---|
| Lista de presupuestos (Step 0) | **Datos generales** | `abrirEdit(p)` → Paso 1: nombre, empresa, tipo, fechas | secundario |
| Información general (Step 5), modo lectura | **✎ Editar partidas** | `setModoLectura(false)` — misma pantalla | primario |
| Resumen mensual (Step 4) | **Editar por área** | `setStep(3)` → Capturar costos | secundario |

- El de la lista **se queda**, sin la palabra "Editar" para que no compita con los de adentro. Deja
  de estar condicionado a `p.estado==="Borrador"||p.estado==="En revisión"` y se muestra siempre.
- En Resumen mensual sustituye a `"← Captura"`. El destino no cambia, solo el texto.
- **No** agregar ningún botón de datos generales dentro de Información general: el de la lista ya
  cubre esa necesidad.

## 1.6 Fechas — tres pasos, en este orden

### 1.6.a Línea de periodo en el encabezado (lo más valioso, riesgo cero)

En Información general y en Resumen mensual, debajo del nombre:

```
Periodo: Ene 2026 – Jun 2026 · 6 meses
```

Se arma con `mesLabelReal(0, fechaInicio)`, `mesLabelReal(NUM_MESES_OP, fechaInicio)` y
`calcularNumMesesOp`, todo ya existente. Contesta de un golpe lo que hoy obliga a leer trece
encabezados de columna.

### 1.6.b Columnas con el mes real, formato corto

Función nueva, **sin tocar `mesLabelReal`** (que ya se usa en el hint de OPEX):

```js
function etiquetaMesCorta(offset, fechaInicio){
  if(!fechaInicio) return null;
  const d=new Date(fechaInicio+"T00:00:00");
  d.setMonth(d.getMonth()+offset);
  const m=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${m[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;  // "Ene 26"
}
```

En `calcularSerieMensual`, sustituir:
```js
const MESES13=["M0 (Inst.)",...Array.from({length:NUM_MESES_OP},(_,i)=>`M${i+1}`)];
```
por:
```js
const esProyecto = pres?.tipo==="instalacion" || pres?.tipo==="servicio";
const MESES13 = Array.from({length: NUM_MESES_OP+1}, (_,i) =>
  etiquetaMesCorta(i, pres?.fechaInicio) ||
  (i===0 ? (esProyecto ? "M0 (Inst.)" : "M0") : `M${i}`)
);
```

Formato corto porque las columnas miden 55–60px y `"Ene 2026"` no siempre cabe. `MESES13` alimenta
las tablas de Step 4, `FlowChart`, `CatLinesChart` y el encabezado del Excel: un arreglo, cinco
superficies.

**Restricciones:**
- El **largo no cambia** (`NUM_MESES_OP+1`). `FlowChart` y `CatLinesChart` derivan
  `NMESES=meses.length` para su geometría; si cambia el largo, se rompen.
- Sin `fechaInicio`, cae al comportamiento actual. Nunca inventar una fecha.
- `LineChart` usa `MESES[i%12]`, que asume arranque en enero. Debe recibir las etiquetas ya
  calculadas, como las otras dos. (Cuervito arranca en febrero, así que hoy miente.)
- Solo `instalacion` y `servicio` llevan "(Inst.)". Un departamental no tiene mes de instalación.

### 1.6.c NO tocar `calcularNumMesesOp` en esta pasada

El arreglo de etiquetas **es también el diagnóstico**: hoy nadie sabe si la duración está bien
porque `M0..M5` no significa nada. En cuanto diga `Ene 26 … Jun 26`, un mes de más o de menos se ve
solo.

Lo que va a quedar visible (ya verificado):
- Departamental `2026-01-01` → `2026-06-30`: da **5**, más M0 son **6** columnas = Ene…Jun.
  **Correcto.**
- Proyecto que quiere mes 0 más 12 de operación, con inicio `2026-01-01` y fin `2026-12-31`: da
  **11**, más M0 son **12** columnas. **Falta un mes.** Habría que poner fin en enero 2027, que es
  contraintuitivo.

Ese arreglo mueve números en todas las pantallas y va en su propia pasada, después.

## 1.7 Quitar la columna "Estado"

**Ocultar de la interfaz, NO borrar del modelo de datos.** `guardarPres` sigue escribiendo
`estado:"Borrador"` tal cual: si Supabase tiene esa columna como obligatoria, quitarla del insert
rompe el guardado.

Quitar de tres lugares:
1. Step 0: columna "Estado" del header y su celda `<EstadoBadge>`. Ajustar `gridTemplateColumns` de
   `"2.5fr 1fr 1fr 210px"` a `"2.5fr 1fr 210px"` en `.lista-header` y `.lista-row`, y quitar
   "Estado" del arreglo de encabezados.
2. Step 1: `{modoEdit&&pres&&<EstadoBadge estado={pres.estado}/>}`.
3. El modal de bases: quitar `· {p.estado}` de la línea `{p.tipo} · {p.estado} {p.fechaInicio}`.

`EstadoBadge` queda sin uso. **Dejarlo en el archivo** (riesgo cero) en lugar de borrarlo.

Razón del cliente: *"¿cómo defines si es borrador o no, si al final ya lo creaste? No es como un
correo."* Y en el código nada cambia nunca ese valor.

---

# FASE 2 — Comportamiento

Estado nuevo, cero cálculos.

## 2.1 Indicador de pasos durante la creación

Al quitar el menú se pierde la referencia de "en qué paso voy" al **crear** un presupuesto. Para
consultar uno existente no importa; para capturar desde cero, sí.

**Estado nuevo:** `const [flujoCreacion,setFlujoCreacion]=useState(false)`
- `true` en `abrirNuevo()` y `clonarPresupuesto()`
- `false` en `abrirPresupuesto()` y al entrar a Step 3 desde "Editar por área"

**Render:** dentro de `wrap()`, arriba de `{children}`, cuando `flujoCreacion && step>=1 && step<=3`.

**Diseño:**
- Tres segmentos delgados: `1 Datos generales · 2 Áreas · 3 Capturar costos`.
- Completado: `✓` en lugar del número, texto `C.grayMid`, línea `C.grayBorder`.
- Actual: pastilla rellena `C.yellow`, texto `C.grayDark`, negrita.
- Pendiente: número y texto en `C.grayBorder`.
- La línea conectora se colorea solo hasta el paso actual.
- **No interactivo.** Es un indicador, no navegación — para eso están Continuar y Atrás. Así no se
  toca ninguna lógica de navegación.
- En `≤768px`, colapsar a una línea: `Paso 2 de 3 · Áreas`.
- Altura máxima ~44px. No debe competir con el título.

El mismo `flujoCreacion` decide si Capturar costos muestra `← Información general` (punto 1.4).

## 2.2 Ocultar las gráficas en modo edición

En Step 5, envolver los dos bloques de gráficas (flujo de efectivo y OPEX por categoría) en
`{modoLectura && (...)}`.

Razón del cliente: *"sí está bien, pero no en un formulario de editar… sí está bien, pero en la
información general."*

**Resumen mensual (Step 4) NO se toca.** Sus dos gráficas se quedan. Confirmado explícitamente.

## 2.3 "Cancelar" con aviso de cambios sin guardar

`"✓ Terminar edición"` pasa a decir **`Cancelar`**. Hoy ese botón regresa a lectura **conservando**
los cambios; si dice Cancelar, el usuario espera que descarte.

> **Si este punto no se implementa en la misma sesión que la fase 1, dejar el texto como "Terminar
> edición".** Un botón que dice Cancelar y conserva cambios genera reclamos.

**Implementación que no toca ningún handler:**

1. Al entrar a edición (`setModoLectura(false)`), foto en un `useRef` (no estado, para no
   re-renderizar):
   ```js
   snapshotEdicion.current = JSON.stringify({costos, capexPM, opexPM});
   ```
2. Al picar **Cancelar**, comparar con el estado actual:
   - **Iguales** → a modo lectura directo, sin modal.
   - **Distintos** → modal con tres salidas:

   | Botón | Acción |
   |---|---|
   | **Guardar cambios** | `guardarArea` de las áreas modificadas, luego `modoLectura=true` |
   | **Descartar cambios** | `setCostos`/`setCapexPM`/`setOpexPM` con la foto, luego `modoLectura=true` |
   | **Seguir editando** | cerrar el modal, no hacer nada |

3. Mismo patrón visual que el modal de categoría contable que ya existe (overlay
   `rgba(0,0,0,0.5)`, tarjeta blanca `borderRadius:12`).

**Por qué es seguro:** solo lee estado y usa setters existentes. No entra a `guardarArea` ni a los
handlers de partidas. El autoguardado a localStorage se reescribe con el estado restaurado; a
Supabase no sube nada, porque eso solo pasa en `guardarArea`.

## 2.4 El distintivo de modo no debe salir impreso

El chip "👁 Viendo / ✎ Editando" está dentro de `#rpdf` y aparece en el PDF. Envolverlo en
`className="noprint"` o moverlo fuera de `#rpdf`.

---

# FASE 3 — Bases de ejemplo

**Objetivo:** que cada tipo ofrezca una base clara y que Suministro no ofrezca ninguna.

## 3.0 DECISIÓN PREVIA (leer antes de tocar nada)

Los tres ejemplos de la lista son **registros de Supabase**, no plantillas de código:
Los Soldados (Servicio), Perdiz - Papan CS (Instalación), Presupuesto TI H1 2026 (Departamento).
Además, en el código hay tres plantillas: `cuervito` (servicio + instalación), `instalacion`
(esqueleto vacío) y `depto_ti` (departamento).

Después de 3.1, cada tipo ofrecería: **Instalación 1** (Perdiz), **Servicio 2** (Cuervito plantilla
+ Los Soldados guardado), **Departamento 2** (Depto TI plantilla + TI H1 2026 guardado),
**Suministro 0**.

Para llegar a exactamente **una** por tipo habría que desactivar las plantillas de código y dejar
solo los registros guardados. **Pero eso obliga a todos a pasar por "partir de un presupuesto
anterior", que hoy está roto:** en `guardarPres`,

```js
setAreas([]); setCostos({}); setCapexPM([]); setOpexPM([]);
```

limpia el estado justo después de guardar el snapshot. La ruta de plantilla sobrevive porque
`plantKey` la reinyecta en `confirmarAreas`; la de "partir de anterior" deja `plantKey=null`, así
que al picar Continuar las partidas copiadas **se pierden**.

**Recomendación: opción B para esta entrega.** Dejar las plantillas de Servicio y Departamento
vivas y aceptar dos opciones en esos tipos. Con el modal unificado (3.2) se leen como dos bases
válidas, una etiquetada `Plantilla` y otra `Guardado` — no se ve como un error. Riesgo cero y sale
hoy.

**Opción A, para después:** arreglar `guardarPres` (quitar esas cuatro líneas; `abrirNuevo` ya
resetea todo, así que son redundantes) y entonces sí desactivar las plantillas. Verificar los dos
caminos: cargar una plantilla → Continuar → Áreas → Confirmar → que las partidas sigan ahí; y lo
mismo partiendo de un presupuesto anterior.

## 3.1 Limpiar las plantillas duplicadas

Dos cambios de una línea:

1. **Eliminar `PLANTILLAS.instalacion`** (la de "Proyecto de Instalación", con todos los montos en
   cero). Es la que el cliente vio como *"viene bien diferente"*: junto a Cuervito parecía la misma
   cosa pero vacía.
2. **Quitar `"instalacion"` de `PLANTILLAS.cuervito.tipos`**, dejando `["servicio"]`. Hoy Cuervito
   aparece en los dos tipos y duplica opciones en Instalación.

**No mover datos entre mecanismos.** Migrar una plantilla a Supabase o al revés toca la lógica de
carga y no hace falta.

### Referencia: por qué cada ejemplo es de su tipo

Verificado contra los Excel del proyecto — la regla es el renglón ACTIVOS y la forma de la
facturación:

| Tipo | Ejemplo | Facturación | Activos |
|---|---|---|---|
| Instalación | Perdiz - Papan CS | 71.2M concentrada en 2 meses | 25.3M al arranque |
| Servicio | Los Soldados | 986,910 · ~77k parejos × 13 meses | **0** |
| Servicio | Monitoreo Cuervito | 6.6M · ~669k × 12 meses | 7.17M, íntegros en el mes 0 |
| Departamento | Presupuesto TI H1 2026 | sin ingresos | solo egresos CAPEX/OPEX |

Cuervito es el caso híbrido —servicio *con* instalación inicial— y por eso estaba en los dos tipos.
Como Servicio está bien: el mes 0 es su instalación.

## 3.2 Unificar las dos listas del modal

El cliente preguntó *"¿cuál es la diferencia entre estas y estas?"* — hoy el modal muestra
plantillas de código y presupuestos guardados como dos listas seguidas, con estilos distintos y sin
explicación.

**Una sola lista**, titulada "Elige una base para este presupuesto", con todas las opciones del tipo
seleccionado y el mismo tratamiento visual. Cada tarjeta lleva un chip gris de origen:

- `Plantilla` — las de código
- `Guardado` — las de Supabase, con su fecha debajo

Al picar cada una se dispara el handler que ya le corresponde (`cargarPlantilla` o
`partirDePresupuestoAnterior`). **Los dos handlers quedan intactos**; solo cambia cómo se pintan.

Si el tipo no tiene ninguna base (Suministro), no mostrar listas ni encabezados vacíos: solo el
bloque "¿Prefieres empezar desde cero?", que ya existe.

## 3.3 Por qué Suministro se queda sin ejemplo

El único archivo de ese tipo, `CONCENTRADO_VERACRUZ.xlsx`, no es un presupuesto mensual: es una
bitácora de requisiciones con orden de compra, código de artículo, centro de costos y fecha real por
renglón. Tiene otro modelo de datos. No falta cargar el ejemplo — ese apartado necesita otra
estructura. Dejarlo en blanco es lo correcto por ahora.

## 3.4 Datos a corregir antes de las pruebas

No es código, es contenido de los registros:

- **Los Soldados:** elaboración `2026-07-31` con vigencia `2024-12-01 → 2026-01-01`, o sea elaborado
  siete meses después de vencer. Alguien va a preguntar si la app valida fechas.
- **Cunduacán y Los Soldados** tienen la facturación idéntica al peso (986,910) en los Excel de
  origen. Uno se copió del otro y no se ajustó.

---

# Criterios de aceptación

## Fase 1
- [ ] El menú lateral muestra únicamente "Presupuestos". Ningún renglón bloqueado ni atenuado.
- [ ] La barra lateral no repite nombre, elaboración ni vigencia.
- [ ] La barra pegajosa solo tiene el 🗑 y el nombre de la empresa. **Ningún botón de navegación
      aparece dos veces en la misma pantalla.**
- [ ] Información general: `✎ Editar partidas` · `Resumen mensual →` · `⬇ PDF`.
- [ ] Resumen mensual: `← Información general` · `Editar por área` · `⬇ Excel` · `⬇ PDF`.
- [ ] Capturar costos tiene su fila con `← Información general` y `Resumen mensual →`, y muestra el
      nombre y el periodo del presupuesto.
- [ ] Ningún texto dice "Mi presupuesto" en toda la app.
- [ ] Los tres accesos a edición tienen etiquetas distintas y "Datos generales" aparece en todos los
      renglones de la lista.
- [ ] Los botones de navegación aparecen **siempre**, incluso sin áreas guardadas.
- [ ] Información general y Resumen mensual muestran `Periodo: Ene 2026 – Jun 2026 · 6 meses`.
- [ ] Las columnas dicen `Ene 26`, `Feb 26`… en Step 4, Step 5, las tres gráficas y el Excel, y
      coinciden entre todas.
- [ ] Un departamental no muestra "(Inst.)" en ninguna columna.
- [ ] Un presupuesto que cruza de año etiqueta bien el mes del año siguiente.
- [ ] La lista no muestra columna Estado.
- [ ] **La lista sigue mostrando exactamente los mismos tres presupuestos, con los mismos nombres,
      tipos y orden.**
- [ ] **Los cinco KPIs y el Excel dan exactamente lo mismo que antes.**

## Fase 2
- [ ] Al crear un presupuesto nuevo se ve el indicador de 3 pasos y avanza al avanzar.
- [ ] Al abrir uno existente el indicador no aparece.
- [ ] En ≤768px el indicador colapsa a una línea.
- [ ] Información general en modo Viendo muestra las gráficas; en modo Editando las oculta.
- [ ] Resumen mensual conserva sus dos gráficas en todo momento.
- [ ] "Cancelar" sin cambios regresa directo, sin modal.
- [ ] "Cancelar" con cambios abre el modal; "Descartar" deja los datos como estaban al entrar a
      edición; "Seguir editando" no pierde nada.
- [ ] El PDF no incluye el distintivo de modo.

## Fase 3
- [ ] Instalación ofrece una sola base (Perdiz).
- [ ] Suministro no ofrece ninguna y solo muestra "empezar desde cero".
- [ ] El modal presenta una sola lista, con chip de origen por opción.
- [ ] Cargar cualquier base produce las mismas partidas y montos que antes.
- [ ] **La lista de presupuestos sigue intacta.**

---

# Fuera de alcance

- Flujo real de estados (Borrador → En revisión → Aprobado). Requiere usuarios y permisos que la app
  no tiene. El campo se oculta, no se reemplaza.
- **El off-by-one de `calcularNumMesesOp`** (ver 1.6.c). Mueve números en todas las pantallas.
- **`guardarPres` limpiando `costos`** (ver 3.0, opción A). Es el arreglo que habilita llegar a una
  sola base por tipo.
- `opexPMt` con 12 meses fijos, mientras `opexAreas` usa la duración real.
- Las cifras agrupadas de la plantilla `depto_ti`: subestiman el CAPEX en ~230 mil por promediar
  precios unitarios de modelos distintos.
- Que Resumen mensual deje de ser editable (la captura de ingresos sigue ahí).

**Cada uno de estos mueve números y va en su propia pasada, con verificación de KPIs antes y
después.**

## Orden sugerido de ejecución

1. **Fase 1 completa** → verificar KPIs y Excel → reportar. Es lo que se ve en la demo.
2. **Fase 2** → verificar los tres caminos del modal de Cancelar.
3. **Fase 3 opción B** → verificar que la lista quedó intacta.
4. Después, y por separado: `guardarPres`, `calcularNumMesesOp`, `opexPMt`, plantilla `depto_ti`.
