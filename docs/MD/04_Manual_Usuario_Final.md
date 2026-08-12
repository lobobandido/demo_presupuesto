# Manual de Usuario Final — Módulo de Presupuestos GEOLIS
**Para:** cualquier persona que vaya a capturar o revisar un presupuesto en la app | **Versión:** MVP

> Este manual explica **cómo usar la app, pantalla por pantalla**. Si quieres ver un ejemplo completo capturado de principio a fin, revisa `docs/MD/Guia_Crear_Presupuesto_Cuervito.md` o `docs/MD/guia-capturar-perdiz.md`.

---

## 1. ¿Qué es esta app?

Es el módulo digital donde Geolis captura sus presupuestos de proyecto (instalación, servicio, departamento o suministro), en vez de hacerlo en un Excel en blanco. Guarda todo en la nube (Supabase), así que lo que capturas queda disponible la próxima vez que entres, desde cualquier computadora.

---

## 2. Navegación general

Del lado izquierdo hay un menú con **una sola entrada**: **Presupuestos**, que siempre te regresa al listado. No hay más renglones, ni bloqueados ni atenuados.

**La navegación real es la ruta de arriba** (la "miga de pan"), que va cambiando según dónde estés:

| Pantalla | Ruta que ves arriba |
|---|---|
| Listado | `Inicio / Presupuestos` |
| Datos generales | `Inicio / Presupuestos / [nombre]` |
| Áreas | `Inicio / Presupuestos / [nombre] / Áreas` |
| Capturar costos | `Inicio / Presupuestos / [nombre] / Captura de información` |
| Información general | `Inicio / Presupuestos / [nombre] / Información general` |
| Resumen mensual | `Inicio / Presupuestos / [nombre] / Información general / Resumen mensual` |

Cada eslabón te lleva a donde dice, **menos el último**, que es la pantalla en la que ya estás (se ve en negritas y no se puede picar). Destinos:

- **Inicio** y **Presupuestos** → los dos van al listado
- **[nombre del proyecto]** → Capturar costos
- **Información general** → la vista de consulta

Además, cada pantalla tiene su propia fila de botones arriba a la derecha, con la navegación hacia adelante y hacia atrás.

> **Ninguna pantalla está bloqueada.** Puedes entrar a Información general y a Resumen mensual desde el primer momento; si no hay costos capturados, simplemente los verás en cero. La única excepción son los dos botones de navegación de Capturar costos, que están atenuados mientras estás **creando** un presupuesto nuevo (todavía no hay nada que mostrar) y se activan en cuanto lo guardas.

En celular o tablet el menú se colapsa a solo íconos, y por debajo de 768px se oculta — la ruta de arriba sigue funcionando igual.

---

## 3. Crear un presupuesto nuevo

> ## ⚠ Captura bien el nombre, el tipo y las fechas a la primera
>
> **Una vez guardado un presupuesto, no hay forma de cambiar estos cinco campos desde la app:** nombre del proyecto, empresa, tipo, **fecha inicio** y **fecha fin**.
>
> La pantalla de Datos generales (sección 4) solo es alcanzable mientras estás **creando** el presupuesto. En cuanto lo guardas, ningún botón ni eslabón de la ruta de arriba vuelve a llevarte ahí: "Editar" del listado va a Capturar costos, y el nombre del proyecto en la ruta también.
>
> **Por qué importa más de lo que parece:** la **fecha de inicio** es el origen de todo el eje de tiempo. De ella salen cuántas columnas de mes tienen las tablas, qué mes es M0, en qué mes cae cada compra de CAPEX, desde cuándo corre cada gasto recurrente y desde cuándo se factura. Una fecha mal capturada no desacomoda un dato: **desacomoda el presupuesto entero**, y no se puede corregir sin volver a capturarlo.
>
> **Antes de picar Continuar, revisa:**
>
> - **Fecha inicio** — el mes del **primer** movimiento del proyecto. En instalación y servicio es el mes de instalación (M0), que no factura.
> - **Fecha fin** — define la duración. Confírmala contando los meses que esperas ver en las tablas.
> - **Tipo** — decide qué áreas se ofrecen y si el presupuesto tiene ingresos. Cambiarlo después no es posible, y en Departamento y Suministro la sección de Ingresos ni siquiera aparece.
>
> Si ya guardaste uno con las fechas mal, hay dos salidas: **clonarlo** con las fechas correctas y recapturar lo que no se copie bien, o pedir al equipo técnico que lo corrija directo en Supabase. Ninguna de las dos es cómoda — de ahí la advertencia.
>
> *(Es una limitación conocida y sin resolver; está registrada como A1 en `docs/MD/DECISIONES.md`.)*

Desde la pantalla **Presupuestos**, botón **+ Nuevo presupuesto**. En esa pantalla eliges entre **dos** formas de arrancar (3.1 y 3.2). Hay una tercera vía que no pasa por ahí: clonar desde el listado (3.3).

### 3.1 Iniciar desde cero
Empiezas con todo vacío. Úsalo cuando el proyecto no se parece a ninguno anterior.

### 3.2 Partir de un presupuesto anterior
Eliges un presupuesto ya guardado **del mismo tipo** (instalación, servicio, departamento o suministro — el buscador solo te muestra los de tu mismo tipo) y se copian todas sus áreas y partidas como punto de partida. Modificas solo lo que cambia (precios, cantidades, fechas) y guardas como un presupuesto nuevo — el original no se toca.

> Úsalo para: "Perdiz tiene un alcance nuevo, necesito un presupuesto parecido al anterior pero con bombas adicionales."

En esa misma ventana aparecen también las **bases predefinidas** que trae la app para tu tipo de presupuesto (ver sección 14). Ojo: para tipo **Suministro** todavía no hay ninguna base predefinida — ahí solo puedes partir de un presupuesto guardado o iniciar desde cero.

### 3.3 Clonar desde la lista
En la pantalla **Presupuestos**, cada fila tiene un botón para clonar ese presupuesto directamente (sin pasar por el asistente de "Nuevo presupuesto"). Hace lo mismo que la opción 3.2, pero más rápido cuando ya sabes exactamente cuál quieres copiar.

---

## 4. Datos generales

| Campo | Notas |
|---|---|
| Nombre del proyecto | Libre |
| Empresa | Por defecto GEOLIS SA DE CV |
| Tipo | **Instalación** / **Servicio** (generan ingresos) · **Departamento** / **Suministro** (gasto interno, sin ingresos) |
| Fecha inicio | El primer mes del presupuesto. En proyectos de instalación y servicio, es el mes de instalación (**M0**) |
| Fecha fin | Define cuántos meses dura el proyecto |
| Fecha elaboración | Cuándo se está armando el presupuesto (por defecto, hoy) |

> **Importante:** la fecha de inicio es la referencia contra la que se calculan todas las distribuciones mensuales de CAPEX y OPEX. **Esta pantalla solo existe mientras creas el presupuesto** — una vez guardado no hay forma de volver a ella desde la app, así que estos campos hay que dejarlos bien a la primera. Ver la advertencia al inicio de la sección 3.

> **Duración del proyecto:** el Resumen mensual se ajusta automáticamente a la diferencia real entre fecha inicio y fecha fin — desde presupuestos de **6 meses** hasta de **20 años**. No hay un número fijo de columnas; si tu proyecto dura 3 años, verás 36+ meses en las tablas (con scroll horizontal). Los selectores de Año en CAPEX/OPEX/ingresos también se ajustan a ese rango.

> Si falta un campo obligatorio (nombre, tipo, fechas) al intentar continuar, el aviso aparece **justo debajo del campo correspondiente**, en rojo.

---

## 5. Áreas / Participantes

Marca qué áreas van a capturar costos en este presupuesto. La lista cambia según el tipo:

- **Instalación / Servicio:** Operaciones, Construcción, Electricidad, Generación, Calidad, SSPA, HPS, Mantenimiento, Logística
- **Departamento:** Tecnología (TI), Innovación y Tecnología, Finanzas
- **Suministro:** Seguridad, Staff de Dirección, Dirección General, Comunicación, Innovación y Tecnología, Almacén

Cada área capturará sus propios costos por separado en Capturar costos (sección 6), y el sistema los suma todos en el Resumen.

---

## 6. Capturar costos

Esta pantalla tiene dos partes:

1. **Ingresos**, hasta arriba — se captura **una sola vez por presupuesto**, no por área (ver 6.0).
2. **Las cuatro secciones por área**, en el panel de la derecha: **CAPEX**, **OPEX · Nómina**, **OPEX · Materiales**, **OPEX · Viáticos**. Cambias de área con la lista de participantes de la izquierda.

### 6.0 Ingresos — dónde se capturan

**Los ingresos se capturan aquí, en Capturar costos**, en el bloque verde de hasta arriba. No en Resumen mensual: esa pantalla solo los muestra ya calculados, sin campos.

> Esta sección **solo aparece en presupuestos de tipo Instalación y Servicio**. En Departamento y Suministro está oculta por completo, porque no facturan.

Dos formas de capturar, y se pueden combinar:

- **Precio fijo del servicio (mensual)** — si el cliente paga lo mismo todos los meses, captura un solo monto y la app lo reparte automáticamente en M1 hasta el último mes del proyecto. **M0 no lleva ingreso**: es el mes de instalación. El botón **Limpiar** pone en cero el precio fijo y todo el reparto.
- **Ingresos** (botón **+ Agregar ingreso**) — para meses con montos distintos. Cada renglón lleva mes, año, descripción y monto. Úsalo cuando la facturación varía mes a mes, o para conceptos sueltos como una renovación de contrato.

Debajo hay una tabla de M0 a Mn con el ingreso de cada mes y el total proyectado — sirve para confirmar que quedó como esperabas antes de guardar.

> Los ingresos se guardan con el mismo botón **Guardar** que el resto de la pantalla (ver 6.5). No tienen botón propio.

### 6.1 CAPEX — Equipos e inversiones
Compras únicas (equipos, vehículos, activos). Por cada partida capturas Categoría, Descripción, Unidad, Cantidad, **Fecha de compra real** (mes y año) y Monto unitario.

> La fecha de compra es obligatoria y es la que decide en qué mes del proyecto aparece ese gasto en el Resumen — si compras algo en el mes 4 del proyecto, ahí es donde va, no se reparte entre todos los meses. Si la dejas vacía, la app te lo marca en rojo y arriba de la tabla aparece un aviso.

### 6.2 OPEX · Nómina y Mano de Obra
Por cada puesto: salario, cantidad de personas, y **tipo de personal**:
- **Fijo** → su costo se repite todos los meses del proyecto, automáticamente
- **Contrato / Outsourcing** → defines cuántos meses dura el contrato y desde qué mes arranca; el sistema solo lo carga en esos meses. El campo de meses de contrato aparece en la tira verde debajo de la fila, junto a la fórmula.

El sistema calcula el costo real (salario + IMSS + prestaciones + ISR) automáticamente, no captures esas cargas a mano.

### 6.3 OPEX · Materiales y Viáticos
Gastos recurrentes. Por cada partida defines:
- **Periodicidad**: mensual, bimestral, trimestral, semestral o anual
- **Mes de inicio**: eliges un mes/año de calendario real (igual que en CAPEX) y el sistema calcula automáticamente en qué mes del proyecto arranca
- **Repeticiones** (opcional): cuántas veces ocurre este gasto antes de parar. Déjalo vacío si el gasto se repite hasta el fin del proyecto (comportamiento normal). Ponle un número si el gasto **para antes** — por ejemplo, una cuadrilla de instalación que cobra mensual pero solo trabaja 3 meses: periodicidad Mensual + Repeticiones **3** → aparece en esos 3 meses y $0 después, en vez de repetirse todo el proyecto. **Funciona idéntico en Materiales y en Viáticos.**

> **Aquí no capturas una fecha por cada vez que ocurre el gasto.** Capturas cuándo empieza y cada cuánto se repite; la app calcula el resto. El internet de $8,396 al mes no se captura seis veces: se captura una, con periodicidad Mensual desde enero.

> Ejemplo: una renta anual de $430,000 que solo se paga una vez al año debe ir con periodicidad **Anual**, no Mensual — si la pones mensual, la app la va a repetir los 12 meses y el total quedará 12 veces más alto de lo real.

Cuando la periodicidad no es mensual, debajo de los campos aparece un renglón **"Cae en: …"** con los meses exactos donde va a caer el gasto y cuántas veces. Úsalo para confirmar que quedó como esperabas antes de guardar.

### 6.4 Cómo funciona el campo Categoría
Al escribir en **Categoría** pasa esto:

1. Si eliges una opción de la lista fija de categorías comunes, sigue al paso 3.
2. Si escribes algo que no está en la lista, aparece **"Crear categoría..."** — al confirmar, si el texto no coincide con ninguna de las 27 categorías contables oficiales de Geolis, se abre una ventana preguntando **"¿A qué categoría contable pertenece?"**. Eliges una (o "No sé / Dejar sin categoría contable"), y la próxima vez que escribas ese mismo texto ya no te preguntará — queda memorizado.
3. **Sugerencias del historial** — si ya capturaste partidas parecidas en otros presupuestos, aparecen como botones amarillos debajo del campo. Al picar uno, se llenan descripción, unidad, cantidad y monto de un jalón.
4. **Artículos del almacén** — la app consulta el catálogo de almacén de Geolis (a partir de 3 letras escritas) y te muestra hasta 6 artículos de esa categoría como botones grises. Al picar uno, se llenan Descripción y Unidad con los datos del almacén.

> **Pendiente de confirmar:** cuántos artículos tiene hoy cargado ese catálogo. Si la consulta no devuelve nada, no aparece ningún botón y no hay mensaje de error — se ve igual que si el catálogo estuviera vacío o que si fallara la conexión. Si nunca te aparecen artículos, confírmalo con el equipo técnico antes de darlo por roto.

#### Solo en OPEX · Materiales: cascada Categoría → Subcategoría → Artículo

Además de lo anterior, **únicamente en la sección de Materiales**, el dropdown de Categoría trae al final un bloque separado, marcado **"── catálogo almacén ──"**, con los grupos que tienen cascada: Materiales, Tuberías, Conexiones, Válvulas, Instrumentación, Electricidad y Seguridad Industrial.

Si eliges uno de esos, se despliegan automáticamente dos campos más:
- **Subcategoría** — filtrada según el grupo (ej. para Tuberías: Acero al carbón, Acero inoxidable, CPVC/PEAD)
- **Artículo** — filtrado según grupo + subcategoría, con la descripción y unidad reales

Al elegir el artículo, **Descripción** y **Unidad** se llenan solas (editables si necesitas ajustar).

> Esta cascada **no** aparece en CAPEX ni en Viáticos. Si estás en esas secciones y no ves Subcategoría ni Artículo, no es una falla — usa las sugerencias del historial y los botones de artículos del almacén, que sí funcionan ahí.

> Las 27 categorías contables oficiales no se pueden modificar libremente — vienen directamente del área de finanzas de Geolis. El catálogo de almacén es un catálogo aparte, más operativo — cuando eliges uno, la app lo mapea a su categoría contable la primera vez que lo usas.

### 6.5 Guardar
Botón **Guardar** (verde, abajo a la derecha del panel de captura). Aparece la notificación "✓ Costos guardados correctamente".

> **Hay un solo botón Guardar en esta pantalla, y guarda TODO el presupuesto**, no solo el área que tienes abierta: todas las áreas con sus cuatro secciones, más los ingresos. Puedes ir y volver entre áreas cuantas veces quieras y guardar una sola vez al final — no se pierde lo de las otras.

> El área que tenías abierta al picar Guardar es la que queda marcada como **"✓ Guardado"** en la lista de participantes. Esa marca es solo un recordatorio visual de por dónde ibas: **no significa que las otras áreas no se hayan guardado.** Todas se guardaron.

> Mientras se guarda, el botón dice "Guardando…" y queda deshabilitado. Espera a que aparezca la notificación: si dice **"No se pudo guardar — intenta de nuevo"**, tu trabajo NO subió a la nube.

> Este botón es el único de esta pantalla que sube tu trabajo a la nube. Mientras capturas, la app guarda en tu navegador automáticamente, pero eso solo vive en esa computadora.

---

## 7. Resumen mensual

Aquí se ve todo lo capturado convertido en tablas financieras: KPIs (Ingresos, CAPEX, OPEX, Egresos totales, Utilidad y Margen), la tabla SERVICIO, la tabla FLUJO, y dos gráficas.

En las tablas SERVICIO y FLUJO, los renglones de CAPEX y OPEX tienen una flechita **▶** a la izquierda: al picarla se despliega el detalle partida por partida de ese renglón, con su distribución mensual.

Dos avisos que puedes ver aquí y qué significan:

| Aviso | Qué significa | Qué hacer |
|---|---|---|
| ⚠ N partidas sin fecha de compra | Alguna partida CAPEX no tiene mes/año capturado — se está contando en M0 por defecto | Ve a Capturar costos y completa la fecha real |
| ⚠ N partidas sin categoría contable asignada | Alguna partida quedó sin mapear a una de las 27 categorías oficiales (elegiste "No sé" o nunca la confirmaste) | Ve a Capturar costos, vuelve a escribir esa categoría y confírmala en la ventana de mapeo |

### Ingresos (solo lectura)
Aquí **no se capturan** los ingresos: esta pantalla solo muestra la tabla ya calculada, mes por mes, sin ningún campo editable. Para capturarlos ve a **Capturar costos** (ver 6.0).

> En presupuestos de tipo Departamento y Suministro esta tabla no aparece, y los indicadores de Utilidad y Margen no aplican (el margen se muestra como "—").

### Botones de esta pantalla

| Botón | Qué hace |
|---|---|
| **← Información general** | Regresa a la vista de consulta |
| **⬇ Excel** | Descarga el `.xlsx` (ver sección 9) |
| **⬇ PDF** | Abre el diálogo de impresión |

---

## 8. Información general (vista de consulta)

Es la pantalla a la que llegas cuando picas **Información general** en la lista. Muestra el presupuesto completo de un jalón, **en este orden de arriba hacia abajo**:

1. **Encabezado** — nombre del proyecto, empresa y el periodo (`Periodo: Feb 2026 – Feb 2027 · 13 meses`).
2. **Los cinco indicadores** del presupuesto entero: Ingresos, CAPEX, OPEX, Total egresos, y Utilidad con su margen.
3. **Tabla CAPEX y OPEX** — el centro de la pantalla. Cada categoría contable en su renglón, con su distribución mes a mes. Los subtotales llevan **▶** a la izquierda: al picarlos se abren las subcategorías que los componen. Arrancan colapsados.
4. **Todas las áreas una tras otra**, cada una con sus tres indicadores (CAPEX, OPEX, total) y sus cuatro secciones de partidas.
5. **Las dos gráficas** del presupuesto entero: **flujo de efectivo** (barras del flujo mensual, línea del acumulado) y **OPEX por categoría**.

A diferencia de Capturar costos, aquí no hay selector lateral de áreas: las ves todas seguidas, ideal para revisar o presentar.

> **Nota:** las gráficas van **abajo**, después de las tablas, no arriba.

### 8.1 Esta pantalla es solo de consulta

**Información general no tiene campos editables en ninguna parte.** Todo es texto plano: no hay dropdowns, ni botones de agregar o eliminar filas, ni botón Guardar. Es imposible modificar algo por accidente desde aquí.

No hay ningún interruptor de modo: no existe un botón "✎ Editar" ni un distintivo "👁 Viendo / ✎ Editando".

**Para editar, ve a Capturar costos.** Dos caminos:

- Desde el listado, el botón **Editar** de ese presupuesto
- Desde aquí, picando el **nombre del proyecto** en la ruta de arriba

Botones de arriba a la derecha:

| Botón | Qué hace |
|---|---|
| **Resumen mensual →** | Va a la pantalla de tablas y gráficas |
| **⬇ PDF** | Abre el diálogo de impresión |

---

## 9. Exportar

- **Excel** (desde Resumen mensual) — genera un `.xlsx` con hojas SERVICIO, FLUJO, EGRESOS (detalle de partidas) e INFO (resumen ejecutivo), con formato de moneda. La hoja SERVICIO lista cada subcategoría en su propio renglón con un subtotal por categoría contable macro (igual que los presupuestos reales de Geolis), y la hoja FLUJO incluye las filas con IVA (16%).
- **PDF** (desde Resumen mensual o desde Información general) — versión imprimible, útil para presentar al director o enviar al cliente. Desde Resumen mensual imprime las tablas y gráficas; desde Información general, la vista completa con el detalle de todas las áreas.

---

## 10. Cómo verificar que un presupuesto capturado es correcto

Capturar sin verificar es la forma más común de entregar un presupuesto con un error de miles de pesos. Esta sección es el repaso mínimo antes de dar uno por bueno.

### 10.1 Compara los cinco indicadores contra el documento fuente

Con el presupuesto abierto en **Información general** (o en Resumen mensual: son los mismos cinco), anota los indicadores y compáralos uno por uno contra el Excel, la cotización o el documento de donde saliste:

| Indicador | Qué debe cuadrar |
|---|---|
| **Ingresos** | El total facturado del proyecto. Si usaste precio fijo, revisa que el número de meses con monto sea el que esperas — **M0 nunca lleva ingreso** |
| **CAPEX** | La suma de las compras únicas. Si te sale bajo, casi siempre es una partida sin fecha de compra |
| **OPEX** | Nómina + materiales + viáticos, ya distribuidos en el tiempo. Es el que más se desvía |
| **Total egresos** | CAPEX + OPEX. No es un dato aparte: si los dos de arriba cuadran, este cuadra solo |
| **Utilidad y margen** | Ingresos − Total egresos. Con ingresos en cero el margen se muestra como "—", no como 0% |

**Cuadra primero Ingresos y CAPEX.** Son los más fáciles de verificar y los que suelen dar exacto. Si esos dos cuadran y el OPEX no, el problema está en el tiempo (periodicidad, mes de inicio, repeticiones), no en los montos.

> Los indicadores de los presupuestos ya verificados están congelados en `docs/MD/KPIS-LINEA-BASE.md`. Si estás revisando uno de esos y te da distinto, algo se movió: repórtalo antes de guardar.

### 10.2 Nómina — qué modela la app y qué NO

Por cada puesto, la app calcula:

```
costo mensual = salario × (1 + IMSS + Prestaciones + ISR) × cantidad de personas
```

Los tres factores arrancan en **IMSS 0.32**, **Prestaciones 0.40** e **ISR 0.05**, y vienen del área de finanzas.

**Solo puedes editar dos de los tres.** La tabla de nómina tiene campos para IMSS y Prestaciones, pero **no hay campo para el ISR**: se queda fijo en 0.05 y no hay forma de cambiarlo desde la app. Si tu fuente usa un ISR distinto, ajústalo dentro del factor de Prestaciones y **anótalo**, porque el número que se ve en pantalla no va a explicar de dónde salió.

**Lo que la app NO modela** — y por lo tanto nunca va a aparecer en el OPEX aunque tu Excel sí lo traiga:

- **Aguinaldo**
- **Fondo de ahorro**
- **Utilidades (PTU)**

En los Excel de Geolis estos tres viven en columnas propias de la hoja `F01 NÓMINA`. La app solo tiene los tres factores de arriba, así que **su costo se pierde**. Es un hueco conocido, no una falla de captura: en Perdiz - Papán CS produjo una diferencia de **$23,042.75** contra la cifra de control, documentada en `docs/MD/guia-capturar-perdiz.md`.

> Si tu presupuesto da un OPEX ligeramente **por debajo** del esperado y todo lo demás cuadra, revisa si la diferencia son estos tres conceptos antes de buscar un error de captura. Si el monto importa, la salida por ahora es meterlo como una partida de OPEX · Materiales aparte, con su propia descripción — y decirlo en el presupuesto.

**Otras dos cosas que conviene revisar en nómina:**

- Un puesto con **cantidad 0** se calcula como **1 persona**, sumando un sueldo que nadie cobra. Si un puesto no aplica, bórralo en vez de ponerle cero.
- El **tipo de personal** decide la duración: *Fijo* corre todos los meses del proyecto; *Contrato* y *Outsourcing* corren solo los meses que pusiste en "Meses de contrato", desde el mes de inicio. Revisa la tira verde debajo de cada fila: dice el costo mensual y el total.

### 10.3 El monto que capturas es UNITARIO, no el total de la partida

La columna se llama **"Monto unit."** y así se calcula. La regla, para toda partida de Materiales y Viáticos:

```
monto × cantidad × repeticiones = el total que dice tu documento fuente
```

**Es el error más común y el más caro**, porque no se ve: pegar por equivocación el *total* de una partida en el campo de monto no dispara ningún aviso — la app lo acepta y lo multiplica por las repeticiones.

**Ejemplo real (Cuervito, cuadrilla de instalación).** El documento fuente dice que la cuadrilla cuesta **864,000** en total: 288,000 al mes durante 3 meses.

| Lo que capturas en Monto | Cant | Rep | Lo que calcula la app | |
|---:|---:|---:|---:|---|
| **288,000** (unitario, correcto) | 1 | 3 | **864,000** | ✅ cuadra |
| **864,000** (el total, pegado por error) | 1 | 3 | **2,592,000** | ❌ tres veces de más |

El segundo caso no se ve raro en la fila —dice 864,000, que es el número que traías en la cabeza— y solo aparece como un OPEX inflado en el resumen. **Verifícalo al revés:** toma el total de la fila en la tabla de Información general y compáralo contra tu documento. Si da un múltiplo exacto de lo esperado (2×, 3×, 12×), es esto.

> La misma regla aplica cuando la Cantidad no es 1: 30 días de viático a 800 pesos van como monto **800**, cantidad **30** — no como monto 24,000.

### 10.4 Un gasto de una sola vez necesita Repeticiones = 1

**Periodicidad "Anual" no significa "una sola vez".** Significa "cada 12 meses". Si el proyecto abarca más de 12 meses, **dispara dos veces**.

**Ejemplo real (Perdiz, M0..M13 — 14 meses).** Una herramienta de 430,000 que se compra una sola vez:

| Periodicidad | Rep | Cae en | Total calculado | |
|---|---:|---|---:|---|
| Anual | *(vacío)* | **M1 y M13** | **860,000** | ❌ el doble |
| Anual | **1** | M1 | **430,000** | ✅ correcto |

En un proyecto de 12 meses o menos el descuido no se nota —"Anual" sin repeticiones cae una sola vez y da el número correcto—, y por eso pasa desapercibido hasta que alguien clona ese presupuesto a uno más largo. **Regla simple: si el gasto ocurre una sola vez, pon Repeticiones 1 aunque el proyecto sea corto.** No cuesta nada y lo vuelve inmune a que el proyecto se alargue o se clone.

### 10.5 Repeticiones — el campo que más se olvida

**Sin repeticiones, cualquier gasto recurrente se repite hasta el último mes del proyecto.** Es el comportamiento por diseño, y es la causa número uno de un OPEX inflado.

Ponle un número cuando el gasto **para antes** de que acabe el proyecto: una cuadrilla de instalación que cobra mensual pero solo trabaja 3 meses va con periodicidad **Mensual** + Repeticiones **3** → aparece en esos tres meses y en $0.00 después.

Cómo verificarlo sin hacer cuentas: cuando la periodicidad **no** es mensual, debajo de los campos aparece el renglón **"Cae en: …"** con los meses exactos y cuántas veces. Si es mensual, ábrelo en la tabla de Información general: pica el **▶** del subtotal y revisa la fila mes por mes.

> El campo funciona **igual en OPEX · Materiales y en OPEX · Viáticos**: se captura igual, se guarda igual y sobrevive igual al salir y volver a entrar. No hay que capturar un viático topado en Materiales para que aguante.

### 10.6 Repaso rápido antes de dar por bueno un presupuesto

1. ¿Los cinco indicadores cuadran contra el documento fuente? (10.1)
2. ¿Aparece el aviso **"⚠ N partidas sin fecha de compra"**? Si sí, ese CAPEX está cayendo todo en M0.
3. ¿Aparece el aviso **"⚠ N partidas sin categoría contable asignada"**? Si sí, esas partidas no van a agrupar bien en la tabla ni en el Excel.
4. ¿Cada partida recurrente tiene la periodicidad correcta? Una renta **anual** capturada como mensual da 12 veces el monto real.
5. ¿Cada monto es **unitario**? `monto × cantidad × repeticiones` debe dar el total del documento fuente. (10.3)
6. ¿Los gastos de una sola vez tienen Repeticiones **1**? "Anual" no basta si el proyecto pasa de 12 meses. (10.4)
7. ¿Los gastos que paran antes del fin del proyecto tienen Repeticiones? (10.5)
8. ¿Hay algún puesto de nómina con cantidad 0? (10.2)
9. ¿Guardaste, **saliste y volviste a entrar**? Es la única forma de confirmar que lo que ves quedó en la nube y no solo en tu navegador.

> El punto 9 no es paranoia: encontró dos fallas reales este mes. Si al reabrir un número cambió, no lo vuelvas a capturar encima — repórtalo.

---

## 11. Gestionar presupuestos existentes

En la lista de **Presupuestos**, cada fila tiene **tres** botones, en este orden:

| Botón | Qué hace |
|---|---|
| **Información general** | Te lleva a la vista de consulta (sección 8). Trae la versión más reciente desde la nube. |
| **Editar** | Te lleva a **Capturar costos** (sección 6), con la primera área ya seleccionada. Trae la versión más reciente desde la nube. Se muestra siempre, en todos los presupuestos. |
| **Clonar** | Crea una copia como presupuesto nuevo (ver 3.3). El original no se toca. |

> **"Editar" NO te lleva a los datos generales.** Va directo a la captura de costos, y el título de esa pantalla dice "Editar — [nombre del proyecto]". Para cambiar nombre, empresa, tipo o fechas, lee la advertencia de la sección 3.

> **No hay forma de eliminar un presupuesto desde la app.** No existe botón de eliminar en el listado, ni en la ruta de arriba, ni dentro de ninguna pantalla. Es intencional por ahora. Si necesitas borrar uno, se hace directo en Supabase — pídelo al equipo técnico.

> Si al picar **Información general** o **Editar** aparece el mensaje *"No se pudo cargar el presupuesto — revisa tu conexión e intenta de nuevo"*, el presupuesto **no se abrió**. Es a propósito: la app prefiere no abrirlo a abrirlo vacío y arriesgar que guardes ese vacío encima de tus datos. Revisa la conexión y vuelve a intentar.

---

## 12. Uso en celular / tablet

La app es responsive: en pantallas angostas, las tablas con muchas columnas (partidas, meses) se pueden deslizar horizontalmente con el dedo — busca la sombra en el borde derecho de la tabla, indica que hay más columnas si sigues deslizando.

---

## 13. Preguntas frecuentes

**Piqué "Información general" y no puedo escribir nada, ¿está roto?**
No. Esa pantalla es de consulta pura y no tiene modo edición (ver 8.1). Para capturar o corregir, pica **Editar** en el listado, o el nombre del proyecto en la ruta de arriba: los dos te llevan a Capturar costos.

**¿Por qué mi gasto anual aparece 12 veces más alto de lo que debería?**
Revisa la periodicidad de esa partida — probablemente está en "Mensual" cuando debería ser "Anual" (ver 6.3).

**¿Por qué todo mi CAPEX aparece en el primer mes?**
Revisa que cada partida tenga su fecha de compra real capturada (mes y año) — sin fecha, cae en M0 por defecto (ver 6.1).

**¿Tengo que capturar la fecha de cada gasto recurrente?**
No. En Materiales y Viáticos solo capturas cuándo **empieza** y cada cuánto se repite. La única fecha obligatoria por partida es la de compra en CAPEX (ver 6.3).

**Escribí una categoría y no me dejó guardarla sin elegir algo, ¿es un error?**
No — es intencional. Si no reconoces a qué categoría contable pertenece, elige "No sé / Dejar sin categoría contable"; el presupuesto se guarda igual, solo aparecerá marcado en el aviso del Resumen para revisarlo después.

**¿Puedo perder mi trabajo si cierro el navegador sin guardar?**
La app guarda automáticamente en tu navegador mientras capturas, pero para que quede disponible en la nube (y en otras computadoras) siempre da clic en **Guardar** en cada área antes de salir.

**Un gasto recurrente sigue apareciendo después de que debería haber terminado, ¿cómo lo paro?**
Usa el campo **Repeticiones** (ver 6.3) — sin él, cualquier gasto recurrente se repite hasta el fin del proyecto por diseño.

**No me aparece Subcategoría ni Artículo al elegir una Categoría, ¿por qué?**
La cascada solo funciona en **OPEX · Materiales** y solo con los grupos que la tienen (ver 6.4). En CAPEX y Viáticos no aparece; ahí usa las sugerencias del historial y los artículos del almacén.

**Borré un presupuesto en Supabase y sigue apareciendo en la lista.**
Es el caché de tu navegador, no la base. La app mezcla lo que trae de Supabase con lo que guardó localmente y **no reconcilia borrados**: lo que está en el caché y ya no está en la nube se queda en pantalla. Es un defecto conocido, anotado en `CLAUDE.md`.

Cómo se ve: el presupuesto aparece en el listado, pero al picar **Información general** o **Editar** sale *"No se pudo cargar el presupuesto — revisa tu conexión e intenta de nuevo"*. Ese mensaje es el mismo de un fallo de red, así que no te dice que ya no existe.

Para limpiarlo, con la app abierta: **F12** → pestaña **Application** (en Firefox, **Almacenamiento**) → **Local Storage** → el dominio de la app. Borra **todas las claves que empiecen con `geolis`**, no solo una. Hoy son seis: `geolis_app_state_v4`, `geolis_cats_v3`, `geolis_cats_capex`, `geolis_cats_mat`, `geolis_cats_via` y `geolis_subcat_map` — y pueden quedar versiones viejas de deploys anteriores (`geolis_app_state_v3`, etc.), que también hay que borrar. Recarga con **Ctrl+F5**.

> **Cada dominio tiene su propio caché.** Si usas `localhost` y la app desplegada, son dos almacenamientos distintos: limpiar uno no limpia el otro. Si el fantasma aparece en los dos, hay que repetir la limpieza en cada uno.

> Borrar estas claves también borra las categorías que hayas creado tú y sus mapeos contables — la próxima vez que escribas una categoría nueva, la app volverá a preguntarte a qué categoría contable pertenece. No se pierde ningún presupuesto: todo lo guardado vive en Supabase.

**Me equivoqué en la fecha de inicio y ya guardé, ¿dónde la corrijo?**
Hoy no se puede desde la app: la pantalla de Datos generales solo es alcanzable durante la creación. Las dos salidas son clonar el presupuesto con las fechas correctas, o pedir al equipo técnico que lo corrija en Supabase. Ver la advertencia al inicio de la sección 3.

**¿Dónde capturo los ingresos? En Resumen mensual ya no me deja.**
En **Capturar costos**, en el bloque verde de hasta arriba (ver 6.0). Resumen mensual solo los muestra ya calculados. Si no ves esa sección, revisa el tipo del presupuesto: en Departamento y Suministro está oculta a propósito.

**Los botones de navegación de Capturar costos están grises.**
Estás **creando** un presupuesto nuevo y todavía no lo has guardado — no hay nada que mostrar en Información general ni en Resumen mensual. Se activan solos en cuanto guardas. Si abriste un presupuesto existente y aun así están grises, eso sí es una falla: repórtalo.

**¿Qué significan las columnas M0, M1, M2… en las tablas?**
Son los meses del proyecto contados desde tu fecha de inicio: M0 es el primero (el de instalación en proyectos de campo), M1 el siguiente, y así. **Ya no hay que descifrarlas:** cada columna trae el código arriba en gris chiquito y el mes real debajo en grande ("Feb 26", "Mar 26"). En presupuestos de tipo Departamento y Suministro el M0 no dice "(Inst.)", porque no tienen mes de instalación.

---

## 14. Bases predefinidas incluidas

Al crear un presupuesto nuevo, la app te ofrece estas bases según el tipo que elegiste:

| Base | Tipos donde aparece | Qué trae |
|---|---|---|
| **Monitoreo Cuervito** | Servicio, Instalación | Datos reales completos: 16 partidas CAPEX (sensores, gateways, paneles, gabinetes, transmisión, centro de monitoreo), 10 partidas OPEX con su periodicidad, y 2 puestos de nómina |
| **Proyecto de Instalación** | Instalación | **Esqueleto vacío**: trae las categorías típicas ya escritas (transporte, maquinaria, gabinetes, nómina, EPP, combustible, viáticos, materiales) pero todos los montos en cero. Sirve para no partir de una hoja en blanco, no para copiar cifras |
| **Depto. TI 2026 — Geolis** | Departamento | Presupuesto de TI del primer semestre 2026: equipo de cómputo y accesorios por mes, infraestructura de red, licenciamiento y telecomunicaciones recurrentes. Trae fechas (enero–junio 2026) |

> Para tipo **Suministro** no hay base predefinida todavía.

### ⚠ Las tres bases predefinidas tienen defectos conocidos — no confíes en sus cifras

**Las tres siguen disponibles en la app, y las tres están mal.** Sirven para no partir de una hoja en blanco —te dan la estructura de categorías ya escrita—, pero **ninguna de sus cifras es confiable**. Si cargas una, revisa partida por partida contra el Excel de origen antes de guardar.

| Base | Defecto |
|---|---|
| **Monitoreo Cuervito** | Los montos de CAPEX están **en dólares, no en pesos**. Se tomó la columna `IMPORTE [USD]` del Excel en vez de `IMPORTE [MN]` (paridad 18). Todo el CAPEX que cargues de aquí sale ~18 veces más bajo de lo real |
| **Depto. TI 2026 — Geolis** | **Subestima el CAPEX en ~230,000 pesos**: varios modelos de laptop con precios distintos quedaron colapsados en un solo renglón con precio promedio |
| **Proyecto de Instalación** | Es un **esqueleto en ceros**: trae las categorías escritas pero todos los montos en `$0.00`. No es un error, es su propósito — pero no sirve para copiar cifras |

> **Contexto:** el paso 6 de `docs/specs/spec-recuperacion-datos.md` pide desactivar las tres bases justamente por esto, y dejar como única base los presupuestos ya guardados en Supabase (que sí están capturados en pesos y verificados). **Ese cambio nunca se hizo**, así que las tres siguen apareciendo en el modal. Mientras tanto: prefiere **"Partir de un presupuesto anterior"** (opción 3.2) sobre cualquiera de estas tres.

> Cuando necesites una base confiable de Cuervito o de Perdiz, parte del presupuesto **guardado** con ese nombre, no de la plantilla del mismo nombre. No son lo mismo.

La lista de Presupuestos **no trae renglones de ejemplo**: arranca vacía y se llena con lo que hay guardado en la nube (más lo que tengas a medias en tu navegador). Todo lo que veas ahí es un presupuesto real.

---

## 15. Ver también

- `docs/MD/ESTADO-ACTUAL.md` — qué hace la app hoy, derivado del código, con referencia archivo:línea
- `docs/MD/DECISIONES.md` — decisiones de producto, con su cita, su fecha y si siguen abiertas
- `docs/MD/KPIS-LINEA-BASE.md` — la línea base de los cinco indicadores, para verificar regresiones
- `docs/MD/Guia_Crear_Presupuesto_Cuervito.md` y `docs/MD/guia-capturar-perdiz.md` — ejemplos reales completos, capturados de principio a fin
- `docs/MD/03_Diagrama_Flujo_Trabajo.md` — el flujo de trabajo en diagrama

---

*GEOLIS SA DE CV — Manual de usuario — Módulo de Presupuestos*