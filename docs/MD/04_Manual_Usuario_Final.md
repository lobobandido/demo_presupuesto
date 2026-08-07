# Manual de Usuario Final — Módulo de Presupuestos GEOLIS
**Para:** cualquier persona que vaya a capturar o revisar un presupuesto en la app | **Versión:** MVP

> Este manual explica **cómo usar la app, pantalla por pantalla**. Si buscas cómo leer el Resumen mensual para tomar decisiones de negocio (KPIs, márgenes, flujo de efectivo), revisa `02_Guia_Negocio_Toma_Decisiones.md`. Si quieres ver un ejemplo completo capturado de principio a fin, revisa `docs/MD/Guia_Crear_Presupuesto_Cuervito.md`.

---

## 1. ¿Qué es esta app?

Es el módulo digital donde Geolis captura sus presupuestos de proyecto (instalación, servicio, departamento o suministro), en vez de hacerlo en un Excel en blanco. Guarda todo en la nube (Supabase), así que lo que capturas queda disponible la próxima vez que entres, desde cualquier computadora.

---

## 2. Navegación general

Del lado izquierdo siempre ves el mismo menú, con 6 entradas:

| Paso | Nombre | Qué haces ahí |
|---|---|---|
| — | **Presupuestos** | Lista de todos tus presupuestos guardados — aquí abres uno existente, lo clonas, lo eliminas, o creas uno nuevo |
| 1 | **Info general** | Nombre del proyecto, empresa, fechas, tipo |
| 2 | **Áreas** | Quién participa (Operaciones, Construcción, TI, etc.) |
| 3 | **Capturar costos** | CAPEX, Nómina, Materiales, Viáticos por cada área |
| 4 | **Resumen mensual** | Tablas, gráficas y KPIs calculados automáticamente |
| 5 | **Mi presupuesto** | Vista completa de consulta: gráficas del presupuesto entero y todas las áreas de corrido |

Un círculo con palomita ✓ en el menú indica un paso ya completado. El paso en el que estás parado se resalta en amarillo.

> **Los pasos 4 y 5 arrancan bloqueados** (atenuados y sin poder picarlos) hasta que hayas guardado al menos un área en el paso 3. Es normal: no hay nada que resumir hasta que haya costos guardados.

En celular o tablet el menú se colapsa a solo íconos para ahorrar espacio — sigue funcionando igual, solo toca el ícono correspondiente.

---

## 3. Crear un presupuesto nuevo

Desde la pantalla **Presupuestos**, botón **+ Nuevo presupuesto**. Ahí eliges una de tres formas de arrancar:

### 3.1 Iniciar desde cero
Empiezas con todo vacío. Úsalo cuando el proyecto no se parece a ninguno anterior.

### 3.2 Partir de un presupuesto anterior
Eliges un presupuesto ya guardado **del mismo tipo** (instalación, servicio, departamento o suministro — el buscador solo te muestra los de tu mismo tipo) y se copian todas sus áreas y partidas como punto de partida. Modificas solo lo que cambia (precios, cantidades, fechas) y guardas como un presupuesto nuevo — el original no se toca.

> Úsalo para: "Perdiz tiene un alcance nuevo, necesito un presupuesto parecido al anterior pero con bombas adicionales."

En esa misma ventana aparecen también las **bases predefinidas** que trae la app para tu tipo de presupuesto (ver sección 12). Ojo: para tipo **Suministro** todavía no hay ninguna base predefinida — ahí solo puedes partir de un presupuesto guardado o iniciar desde cero.

### 3.3 Clonar desde la lista
En la pantalla **Presupuestos**, cada fila tiene un botón para clonar ese presupuesto directamente (sin pasar por el asistente de "Nuevo presupuesto"). Hace lo mismo que la opción 3.2, pero más rápido cuando ya sabes exactamente cuál quieres copiar.

---

## 4. Paso 1 — Info general

| Campo | Notas |
|---|---|
| Nombre del proyecto | Libre |
| Empresa | Por defecto GEOLIS SA DE CV |
| Tipo | **Instalación** / **Servicio** (generan ingresos) · **Departamento** / **Suministro** (gasto interno, sin ingresos) |
| Fecha inicio | El primer mes del presupuesto. En proyectos de instalación y servicio, es el mes de instalación (**M0**) |
| Fecha fin | Define cuántos meses dura el proyecto |
| Fecha elaboración | Cuándo se está armando el presupuesto (por defecto, hoy) |

> **Importante:** la fecha de inicio es la referencia contra la que se calculan todas las distribuciones mensuales de CAPEX y OPEX más adelante — no la cambies después de haber capturado costos, o los meses se recalculan.

> **Duración del proyecto:** el Resumen mensual se ajusta automáticamente a la diferencia real entre fecha inicio y fecha fin — desde presupuestos de **6 meses** hasta de **20 años**. No hay un número fijo de columnas; si tu proyecto dura 3 años, verás 36+ meses en las tablas (con scroll horizontal). Los selectores de Año en CAPEX/OPEX/ingresos también se ajustan a ese rango.

> Si falta un campo obligatorio (nombre, tipo, fechas) al intentar continuar, el aviso aparece **justo debajo del campo correspondiente**, en rojo.

---

## 5. Paso 2 — Áreas / Participantes

Marca qué áreas van a capturar costos en este presupuesto. La lista cambia según el tipo:

- **Instalación / Servicio:** Operaciones, Construcción, Electricidad, Generación, Calidad, SSPA, HPS, Mantenimiento, Logística
- **Departamento:** Tecnología (TI), Innovación y Tecnología, Finanzas
- **Suministro:** Seguridad, Staff de Dirección, Dirección General, Comunicación, Innovación y Tecnología, Almacén

Cada área capturará sus propios costos por separado en el paso 3, y el sistema los suma todos en el Resumen.

---

## 6. Paso 3 — Capturar costos

Para cada área seleccionada verás 4 secciones: **CAPEX**, **OPEX · Nómina**, **OPEX · Materiales**, **OPEX · Viáticos**.

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
- **Repeticiones** (opcional): cuántas veces ocurre este gasto antes de parar. Déjalo vacío si el gasto se repite hasta el fin del proyecto (comportamiento normal). Ponle un número si el gasto **para antes** — por ejemplo, una cuadrilla de instalación que cobra mensual pero solo trabaja 3 meses: periodicidad Mensual + Repeticiones **3** → aparece en esos 3 meses y $0 después, en vez de repetirse todo el proyecto.

> **Aquí no capturas una fecha por cada vez que ocurre el gasto.** Capturas cuándo empieza y cada cuánto se repite; la app calcula el resto. El internet de $8,396 al mes no se captura seis veces: se captura una, con periodicidad Mensual desde enero.

> Ejemplo: una renta anual de $430,000 que solo se paga una vez al año debe ir con periodicidad **Anual**, no Mensual — si la pones mensual, la app la va a repetir los 12 meses y el total quedará 12 veces más alto de lo real.

Cuando la periodicidad no es mensual, debajo de los campos aparece un renglón **"Cae en: …"** con los meses exactos donde va a caer el gasto y cuántas veces. Úsalo para confirmar que quedó como esperabas antes de guardar.

### 6.4 Cómo funciona el campo Categoría
Al escribir en **Categoría** pasa esto:

1. Si eliges una opción de la lista fija de categorías comunes, sigue al paso 3.
2. Si escribes algo que no está en la lista, aparece **"Crear categoría..."** — al confirmar, si el texto no coincide con ninguna de las 27 categorías contables oficiales de Geolis, se abre una ventana preguntando **"¿A qué categoría contable pertenece?"**. Eliges una (o "No sé / Dejar sin categoría contable"), y la próxima vez que escribas ese mismo texto ya no te preguntará — queda memorizado.
3. **Sugerencias del historial** — si ya capturaste partidas parecidas en otros presupuestos, aparecen como botones amarillos debajo del campo. Al picar uno, se llenan descripción, unidad, cantidad y monto de un jalón.
4. **Artículos del almacén** — la app consulta el catálogo real de almacén de Geolis y te muestra los artículos de esa categoría como botones grises. Al picar uno, se llenan Descripción y Unidad con los datos reales del almacén.

#### Solo en OPEX · Materiales: cascada Categoría → Subcategoría → Artículo

Además de lo anterior, **únicamente en la sección de Materiales**, el dropdown de Categoría trae al final un bloque separado, marcado **"── catálogo almacén ──"**, con los grupos que tienen cascada: Materiales, Tuberías, Conexiones, Válvulas, Instrumentación, Electricidad y Seguridad Industrial.

Si eliges uno de esos, se despliegan automáticamente dos campos más:
- **Subcategoría** — filtrada según el grupo (ej. para Tuberías: Acero al carbón, Acero inoxidable, CPVC/PEAD)
- **Artículo** — filtrado según grupo + subcategoría, con la descripción y unidad reales

Al elegir el artículo, **Descripción** y **Unidad** se llenan solas (editables si necesitas ajustar).

> Esta cascada **no** aparece en CAPEX ni en Viáticos. Si estás en esas secciones y no ves Subcategoría ni Artículo, no es una falla — usa las sugerencias del historial y los botones de artículos del almacén, que sí funcionan ahí.

> Las 27 categorías contables oficiales no se pueden modificar libremente — vienen directamente del área de finanzas de Geolis. El catálogo de almacén es un catálogo aparte, más operativo — cuando eliges uno, la app lo mapea a su categoría contable la primera vez que lo usas.

### 6.5 Guardar
Botón **Guardar** (verde, abajo a la derecha de cada área). Aparece la notificación "✓ Costos guardados". Puedes ir y volver entre áreas y guardar cada una por separado, no es necesario terminar todo de un jalón.

> Este botón es el único que sube tu trabajo a la nube. Mientras capturas, la app guarda en tu navegador automáticamente, pero eso solo vive en esa computadora.

---

## 7. Paso 4 — Resumen mensual

Aquí se ve todo lo capturado convertido en tablas financieras: KPIs (Ingresos, CAPEX, OPEX, Egresos totales, Utilidad y Margen), la tabla SERVICIO, la tabla FLUJO, y dos gráficas. Para aprender a **interpretar** estos números y tomar decisiones de negocio con ellos, ve `02_Guia_Negocio_Toma_Decisiones.md`.

En las tablas SERVICIO y FLUJO, los renglones de CAPEX y OPEX tienen una flechita **▶** a la izquierda: al picarla se despliega el detalle partida por partida de ese renglón, con su distribución mensual.

Dos avisos que puedes ver aquí y qué significan:

| Aviso | Qué significa | Qué hacer |
|---|---|---|
| ⚠ N partidas sin fecha de compra | Alguna partida CAPEX no tiene mes/año capturado — se está contando en M0 por defecto | Ve a Capturar costos y completa la fecha real |
| ⚠ N partidas sin categoría contable asignada | Alguna partida quedó sin mapear a una de las 27 categorías oficiales (elegiste "No sé" o nunca la confirmaste) | Ve a Capturar costos, vuelve a escribir esa categoría y confírmala en la ventana de mapeo |

### Ingresos
Esta pantalla es donde se capturan. Dos formas:
- **Precio fijo mensual** — si el cliente paga lo mismo todos los meses, captura un solo monto y se multiplica automáticamente
- **Ingresos adicionales** — para meses con montos distintos (ej. facturación variable), agrega uno por uno con su mes, año, descripción y monto

> En presupuestos de tipo Departamento y Suministro no hay ingresos, así que esta sección se deja en cero y los indicadores de Utilidad y Margen no aplican.

Desde aquí puedes brincar a **Mi presupuesto →** con el botón de la barra superior.

---

## 8. Paso 5 — Mi presupuesto (vista de consulta)

Es la pantalla a la que llegas cuando picas **Abrir** en la lista. Muestra el presupuesto completo de un jalón:

- Arriba, las dos gráficas del presupuesto entero: **flujo de efectivo** (barras del flujo mensual, línea del acumulado) y **OPEX por categoría**.
- Debajo, **todas las áreas una tras otra**, cada una con sus tres indicadores (CAPEX, OPEX, total) y sus cuatro secciones de partidas con sus totales.

A diferencia del paso 3, aquí no hay selector lateral de áreas: las ves todas seguidas, ideal para revisar o presentar.

### 8.1 Modo consulta y modo edición

Junto al título hay un distintivo que te dice en qué modo estás. Nunca queda ambiguo:

| Distintivo | Qué significa |
|---|---|
| **👁 Viendo** (gris) | Todo es texto plano. No hay campos, dropdowns, botones de agregar ni de eliminar filas, y no hay "Guardar". Es imposible modificar algo por accidente. |
| **✎ Editando** (amarillo) | Las mismas filas, en el mismo lugar, se convierten en los campos de captura de siempre. Reaparece el "Guardar" de cada área. |

Botones de arriba a la derecha:

| Botón | Qué hace |
|---|---|
| **✎ Editar** | Habilita la edición **en la misma pantalla**. No navega, no recarga, no vuelve a pedir datos. |
| **✓ Terminar edición** | Regresa a modo consulta. Aparece en lugar de "Editar" cuando estás editando. |
| **← Resumen mensual** | Va a la pantalla del paso 4. |
| **⬇ PDF** | Imprime o guarda en PDF. |

Los números y las gráficas son idénticos en los dos modos — son exactamente los mismos cálculos.

> **El modo no se recuerda.** Si estás editando y recargas la página, vuelve a abrir en modo consulta. Es lo esperado, no una falla.

> **"Terminar edición" no sube nada a la nube.** Solo el botón **Guardar** de cada área lo hace. Si editas, picas "Terminar edición" y cierras sin guardar, el cambio se queda solo en tu computadora.

---

## 9. Exportar

- **Excel** (desde el paso 4) — genera un `.xlsx` con hojas SERVICIO, FLUJO, EGRESOS (detalle de partidas) e INFO (resumen ejecutivo), con formato de moneda. La hoja SERVICIO lista cada subcategoría en su propio renglón con un subtotal por categoría contable macro (igual que los presupuestos reales de Geolis), y la hoja FLUJO incluye las filas con IVA (16%).
- **PDF** (desde el paso 4 o el 5) — versión imprimible, útil para presentar al director o enviar al cliente. Desde el paso 4 imprime el Resumen mensual; desde el paso 5, la vista completa con el detalle de todas las áreas.

---

## 10. Gestionar presupuestos existentes

En la lista de **Presupuestos**, cada fila tiene:

| Botón | Qué hace |
|---|---|
| **Abrir** | Te lleva a **Mi presupuesto en modo consulta** (paso 5). Trae la versión más reciente desde la nube. Para modificar algo, pica "Editar" ahí dentro. |
| **Editar** | Te lleva a **Info general** (paso 1) para cambiar nombre, empresa, fechas o tipo. Solo aparece en presupuestos en Borrador o En revisión. |
| **Clonar** | Crea una copia como presupuesto nuevo (ver 3.3). El original no se toca. |
| **🗑** | Borra el presupuesto permanentemente, de la app y de la base de datos. **No se puede deshacer** — pide confirmación. |

> **Cambio reciente:** antes "Abrir" te dejaba directamente en la captura de costos, con todos los campos editables y sin avisarte. Ahora aterriza en modo consulta y hay que pedir la edición explícitamente. Es un clic más, a propósito: evita modificar un presupuesto sin darte cuenta.

---

## 11. Uso en celular / tablet

La app es responsive: en pantallas angostas, las tablas con muchas columnas (partidas, meses) se pueden deslizar horizontalmente con el dedo — busca la sombra en el borde derecho de la tabla, indica que hay más columnas si sigues deslizando.

---

## 12. Preguntas frecuentes

**Piqué "Abrir" y no puedo escribir nada, ¿está roto?**
No. "Abrir" ahora entra en modo consulta, para que puedas revisar sin riesgo de mover algo. Pica **✎ Editar** arriba a la derecha y los mismos renglones se vuelven editables.

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

**Los pasos 4 y 5 están grises y no puedo entrar.**
Necesitas guardar al menos un área en el paso 3 primero (ver sección 2).

**¿Qué significan las columnas M0, M1, M2… en las tablas?**
Son los meses del proyecto contados desde tu fecha de inicio: M0 es el primero (el de instalación en proyectos de campo), M1 el siguiente, y así. Está pendiente un cambio para que digan el mes real ("Ene 2026") en lugar del código.

---

## 13. Bases predefinidas incluidas

Al crear un presupuesto nuevo, la app te ofrece estas bases según el tipo que elegiste:

| Base | Tipos donde aparece | Qué trae |
|---|---|---|
| **Monitoreo Cuervito** | Servicio, Instalación | Datos reales completos: 16 partidas CAPEX (sensores, gateways, paneles, gabinetes, transmisión, centro de monitoreo), 10 partidas OPEX con su periodicidad, y 2 puestos de nómina |
| **Proyecto de Instalación** | Instalación | **Esqueleto vacío**: trae las categorías típicas ya escritas (transporte, maquinaria, gabinetes, nómina, EPP, combustible, viáticos, materiales) pero todos los montos en cero. Sirve para no partir de una hoja en blanco, no para copiar cifras |
| **Depto. TI 2026 — Geolis** | Departamento | Presupuesto de TI del primer semestre 2026: equipo de cómputo y accesorios por mes, infraestructura de red, licenciamiento y telecomunicaciones recurrentes. Trae fechas (enero–junio 2026) |

> Para tipo **Suministro** no hay base predefinida todavía.

> Las cifras de la base **Depto. TI 2026** están agrupadas y aproximadas respecto al Excel original (varios modelos de laptop con precios distintos quedaron colapsados en un renglón con precio promedio). Revísalas contra la fuente antes de usarla como cifra oficial.

Además, la lista de Presupuestos arranca con dos renglones de muestra —**Monitoreo Cuervito** y **BEH Jujo F218358**— que son solo encabezados de ejemplo: al abrirlos vas a ver un presupuesto sin áreas ni partidas. Los presupuestos reales son los que tú guardas.

---

## 14. Ver también

- `02_Guia_Negocio_Toma_Decisiones.md` — cómo interpretar el Resumen mensual para tomar decisiones
- `docs/MD/Guia_Crear_Presupuesto_Cuervito.md` — ejemplo real completo, capturado de principio a fin
- `01_Bitacora_Tecnica_Cambios.md` — historial técnico de cambios (para el equipo de desarrollo)
- `05_Manual_Vista_Lectura.md` — detalle del cambio de modo consulta/edición y sus pendientes

---

*GEOLIS SA DE CV — Manual de usuario — Módulo de Presupuestos*