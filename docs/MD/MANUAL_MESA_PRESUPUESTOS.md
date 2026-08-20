# Manual de captura — Mesa de Presupuestos GEOLIS

**Para:** quien captura presupuestos en la app.
**No necesitas** saber nada de sistemas. Todo lo que dice este manual se hace con el mouse, dentro de la app.

---

## 1. Qué es esta app y qué reemplaza

Es donde Geolis captura sus presupuestos de proyecto. **Reemplaza el Excel en blanco** que antes se armaba a mano para cada proyecto.

Lo que cambia respecto al Excel:

- No armas fórmulas. Capturas los datos de cada partida y la app calcula el reparto mes a mes, los subtotales por categoría contable y los indicadores.
- No hay una hoja por proyecto regada en carpetas. Todos los presupuestos viven en la misma lista.
- Al final puedes descargar el Excel ya armado y el PDF para presentar.

Lo que **no** cambia: los montos siguen saliendo de tu documento fuente. La app no inventa cifras ni corrige las tuyas.

Hay cuatro tipos de presupuesto y cambian lo que la app te pide:

| Tipo | Para qué | ¿Lleva ingresos? |
|---|---|---|
| **Instalación** | Proyectos de campo que se facturan por entregable | Sí |
| **Servicio** | Servicio recurrente, se cobra por periodo | Sí |
| **Departamento** | Área interna (gasto, no venta) | No |
| **Suministro** | Compra de materiales | No |

En Departamento y Suministro la sección de Ingresos no aparece. Es a propósito.

---

## 2. Antes de empezar: qué necesitas a la mano

No abras la app hasta tener esto:

1. **El documento fuente del presupuesto** — el Excel, la cotización o el archivo de donde salen los montos. Ábrelo antes.
2. **Sus totales de control.** Anota en una hoja aparte, antes de capturar nada:
   - Total de ingresos (lo que se va a facturar).
   - Total de CAPEX (compras y equipos).
   - Total de OPEX (nómina + materiales + viáticos).
   - Total de egresos.
   Contra esos cuatro números vas a comparar al final. Si no los tienes, no puedes verificar tu captura, y una captura sin verificar es una captura que nadie puede firmar.
3. **Las fechas reales del proyecto**: cuándo arranca y cuándo termina. Confírmalas con quien te pasó el documento. Léelas otra vez en la sección 3 antes de escribirlas.
4. **Los precios en pesos.** Si tu documento trae precios en dólares y en pesos en columnas contiguas, usa **siempre la columna en pesos**. La app no convierte moneda.
5. **Quién participa**: qué áreas de Geolis van a tener costos en este proyecto.

> **Consejo:** si tu documento fuente trae el total de una partida y no el precio por unidad, saca el precio unitario **antes** de sentarte a capturar. La app pide el unitario. Esta es la causa número uno de presupuestos inflados (sección 5.1).

---

## 3. Crear un presupuesto nuevo

> # ⚠ Las fechas se capturan una sola vez
>
> **La fecha de inicio y la fecha de fin definen todas las columnas de mes del presupuesto**, y hoy **no se pueden corregir después de guardar**. No hay ninguna pantalla en la app que te deje volver a ellas.
>
> De la fecha de inicio salen: cuántas columnas de mes tienen las tablas, cuál es el primer mes, en qué mes cae cada compra, desde cuándo corre cada gasto que se repite y desde cuándo se factura.
>
> Una fecha mal capturada no descompone un dato: **descompone el presupuesto completo**.
>
> **Si ya guardaste con las fechas mal**, las dos salidas son: clonar el presupuesto con las fechas correctas y recapturar, o avisar al equipo técnico. Ninguna de las dos es rápida.
>
> **Cuenta las columnas antes de capturar una sola partida.** Cómo se hace, al final de esta sección.

### 3.1 Abre la pantalla

En la lista **Presupuestos**, pica **+ Nuevo presupuesto**.

Llegas a la pantalla **Nuevo presupuesto**.

### 3.2 Llena Datos generales

| Campo | Qué escribes |
|---|---|
| **Nombre del proyecto** *(obligatorio)* | El nombre con el que todos lo van a buscar. Ej. `Perdiz - Papán CS` |
| **Empresa** | Viene lleno con GEOLIS SA DE CV. Cámbialo solo si aplica |
| **Fecha inicio** *(obligatorio)* | El mes del **primer** movimiento del proyecto |
| **Fecha fin** *(obligatorio)* | El mes en que termina |
| **Fecha de elaboración** | Viene con la fecha de hoy |

Si dejas un obligatorio vacío, al picar Continuar el campo se pone rojo y aparece el aviso debajo. La app no avanza.

### 3.3 Elige cómo arrancar

Debajo de las fechas aparece **¿Cómo quieres iniciar este presupuesto?**, con dos opciones:

- **Iniciar desde cero** — las secciones arrancan vacías y agregas cada partida a mano.
- **Partir de un presupuesto anterior** — se abre una ventana. Ahí elige un presupuesto **ya guardado y verificado**, del mismo tipo. Se copian sus áreas y sus partidas, y tú ajustas lo que cambia. El original no se toca.

> Trabaja con una de esas dos. Si en esa ventana ves además una lista de bases que trae la app, **no las uses**: prefiere empezar desde cero o partir de un presupuesto guardado que alguien ya haya verificado.

### 3.4 Elige el tipo

Abajo, **Tipo de presupuesto**: cuatro tarjetas — Instalación, Servicio, Departamento, Suministro. Pica una.

El tipo decide qué áreas se te van a ofrecer y si el presupuesto lleva ingresos. **Tampoco se puede cambiar después.**

Pica **Continuar**.

### 3.5 Elige los participantes

Llegas a la pantalla **Participantes**. Marca las áreas que van a tener costos en este proyecto. Puedes marcar una o varias.

Cada área captura sus costos por separado y la app los suma. Si tienes duda, marca solo el área que de verdad va a capturar: agregar áreas vacías no aporta nada.

Pica **Confirmar**.

### 3.6 Cuenta las columnas AHORA

Llegas a **Captura de información**. Arriba a la izquierda, debajo del nombre del proyecto, hay una línea así:

```
Periodo: Ene 2026 – Feb 2027 · 14 meses
```

**Compárala con tu documento fuente antes de capturar nada.**

- ¿El primer mes es el que esperas?
- ¿El último mes es el que esperas?
- ¿El número de meses es el mismo que el número de columnas mensuales de tu documento?

Si algo no cuadra, **detente aquí**. Estás a tiempo de crear el presupuesto otra vez con las fechas correctas y no perder nada. Diez minutos aquí ahorran una recaptura completa.

> **Cómo se numeran los meses.** El primer mes es **M0**, el siguiente M1, y así. En cada tabla, la columna trae el código arriba en chiquito (`M0`, `M1`) y el mes real abajo (`Ene 26`, `Feb 26`). En Instalación y Servicio, M0 aparece como `M0 (Inst.)`: es el mes de instalación y **no lleva ingresos ni gastos que se repiten** — solo compras.

---

## 4. Capturar

Todo se captura en la pantalla **Captura de información**.

Cómo está armada, de arriba hacia abajo:

1. **Ingresos** — solo en Instalación y Servicio. Se captura **una vez para todo el presupuesto**, no por área.
2. **Participantes** — la lista de la izquierda. Picas un área y el panel de la derecha cambia a los costos de esa área.
3. **Las cuatro secciones del área**, en este orden: **CAPEX · Equipos e inversiones**, **OPEX · Nómina y Mano de Obra**, **OPEX · Materiales**, **OPEX · Viáticos**.
4. El botón **Guardar**, hasta abajo.

En cada sección, la fila nueva se agrega con el botón punteado del final (**+ Agregar equipo / inversión**, **+ Agregar puesto**, **+ Agregar material**, **+ Agregar viático**). La **×** al final de cada fila la borra.

### 4.0 Ingresos

Solo aparece en Instalación y Servicio.

Dos formas, y se pueden combinar:

- **Precio fijo del servicio (mensual)** — úsalo cuando se factura lo mismo todos los meses. Escribes un monto y la app lo reparte desde M1 hasta el último mes. **M0 no lleva ingreso.** El botón **Limpiar** pone todo en cero.
- **+ Agregar ingreso** — úsalo cuando la facturación cambia mes a mes. Cada renglón lleva **Mes**, **Año**, **Descripción** y **Monto**. El selector de mes te muestra `M1 · Feb 26`, `M2 · Mar 26`, etc.

Debajo hay una tabla con el ingreso de cada mes y el total proyectado. Revísala antes de seguir.

**Ejemplo real (Perdiz - Papán CS, factura por entregable):**

| Mes | Descripción | Monto |
|---|---|---|
| M1 · Feb 2026 | Variador de frecuencia + patín con bomba electrocentrífuga | 69,593,781.40 |

### 4.1 CAPEX · Equipos e inversiones

**Qué va aquí:** las compras que se hacen una vez. Equipos, maquinaria, vehículos, activos, obra. Todo lo que se compra en un mes concreto y no se repite.

**Qué llenas en cada fila:**

| Columna | Qué es |
|---|---|
| **Categoría** | La subcategoría descriptiva del bien. Ej. `MAQUINARIA Y EQUIPO` |
| **Descripción** | El concepto concreto. Ej. `Controladores C1` |
| **Unidad** | La naturaleza del bien: Unidad, Pieza, Servicio, Global, Día, Hora, Kg, Metro, Litro, Viaje |
| **Cant.** | Cuántos compras |
| **Fecha compra \*** | Mes y año reales de la compra. **Obligatorio** |
| **Monto unit.** | El precio de **uno**, no el total de la partida |
| **Total** | Lo calcula la app: cantidad × monto unitario |

**Ejemplo real (Perdiz - Papán CS):**

```
Categoría:    MAQUINARIA Y EQUIPO
Descripción:  Controladores C1
Unidad:       Unidad
Cant.:        4
Fecha compra: Feb 2026
Monto unit.:  62,999.97
→ Total:      251,999.88
```

> **La fecha de compra decide en qué mes aparece el gasto.** Si la dejas vacía, los dos selectores se ponen rojos y arriba de la tabla sale el aviso *"⚠ N partida(s) sin fecha de compra — no se reflejará correctamente en el Resumen mensual"*. Esas partidas caen todas en el primer mes.

### 4.2 OPEX · Nómina y Mano de Obra

**Qué va aquí:** el personal del proyecto. Un renglón por puesto.

**Qué llenas en cada fila:**

| Columna | Qué es |
|---|---|
| **Puesto** | Elige de la lista o escribe el tuyo |
| **Tipo** | **Fijo**, **Contrato** u **Outsourcing** |
| **Cant.** | Cuántas personas de ese puesto |
| **Salario/mes** | El sueldo mensual de **una** persona |
| **IMSS+PT** | El factor de IMSS. Viene en 0.32 |
| **Prestac.** | El factor de prestaciones. Viene en 0.40 |
| **Costo anual** | Lo calcula la app |

Debajo de cada fila hay una tira verde que te muestra la cuenta completa: `salario × (1 + IMSS + prestaciones + ISR) × cantidad = costo/mes`.

**Ejemplo real (Perdiz - Papán CS):**

```
Puesto:      Soldador
Tipo:        Contrato — 3 meses de contrato
Cant.:       3
Salario/mes: 20,000.00
IMSS+PT:     0.32
Prestac.:    0.63
→ La tira verde muestra: $20,000.00 × (1+0.32+0.63+0.05) × 3 = $120,000.00/mes
   (40,000.00 al mes por persona, tres personas)
```

Tres cosas que hay que saber de esta sección:

- **El ISR no se captura.** La app lo tiene fijo en 0.05 y no hay campo para cambiarlo. Si tu documento usa otro ISR, métete la diferencia en el factor de Prestaciones **y anótalo aparte**, porque el número en pantalla no lo va a explicar.
- **La app no modela aguinaldo, fondo de ahorro ni utilidades (PTU).** Si tu documento los trae en columnas propias, ese costo no va a aparecer. Si el monto importa, captúralo como una partida aparte en **OPEX · Materiales**, con su descripción, y dilo en el presupuesto.
- **Un puesto con cantidad 0 se cuenta como 1 persona.** Si un puesto no aplica, **bórralo con la ×**; no le pongas cero.

> La columna **Costo anual** de cada fila es una referencia rápida calculada sobre 12 meses. El **Total anual** del encabezado de la sección y los cinco indicadores sí usan la duración real de tu proyecto. Verifica contra los indicadores, no contra esa columna.

### 4.3 OPEX · Materiales

**Qué va aquí:** materiales, insumos, herramienta, servicios y combustible que se gastan de forma recurrente durante el proyecto.

**Qué llenas en cada fila:**

| Columna | Qué es |
|---|---|
| **Categoría** | La subcategoría descriptiva. Ej. `SERVICIOS` |
| **Descripción** | El concepto. Ej. `Cuadrilla de instalación` |
| **Unidad** | Servicio, Pieza, Global, Litro… la naturaleza del bien |
| **Cant.** | Cuántos por ocurrencia |
| **Periodicidad / Inicio** | Cada cuánto se repite, y desde qué mes y año arranca |
| **Monto unit.** | Lo que cuesta **una** unidad, **una** vez |
| **Total** | Lo calcula la app |

Dentro de la columna **Periodicidad / Inicio** hay tres cosas:

1. **Periodicidad**: Mensual, Bimestral, Trimestral, Semestral o Anual.
2. **Mes** y **Año** en que arranca el gasto.
3. Un campo chiquito que dice **"Vacío = durante todo el proyecto"**: ahí van las **Repeticiones** (sección 5).

**Ejemplo real (Monitoreo Cuervito):**

```
Categoría:     SERVICIOS
Descripción:   Cuadrilla de instalación
Unidad:        Servicio
Cant.:         1
Periodicidad:  Mensual, desde Feb 2026
Repeticiones:  3
Monto unit.:   288,000.00
→ La app carga 288,000 en tres meses y 0 después. Total: 864,000.00
```

> **Aquí no capturas una fecha por cada vez que ocurre el gasto.** Capturas cuándo empieza y cada cuánto se repite; la app hace el resto. El internet de $8,396 al mes se captura **una** vez, mensual, no seis veces.

Cuando la periodicidad **no** es mensual, debajo de los campos aparece un renglón **"Cae en: …"** con los meses exactos y cuántas veces. Léelo antes de pasar a la siguiente fila.

Ayudas que aparecen solas al escribir la Categoría:

- **Sugerencias del historial** — botones amarillos con partidas parecidas ya capturadas. Al picar uno se llenan descripción, unidad, cantidad y monto.
- **Catálogo de almacén** — en esta sección, el desplegable de Categoría trae al final un bloque **── catálogo almacén ──**. Si eliges uno de esos grupos, aparecen dos campos más, **Subcategoría** y **Artículo**, y al elegir el artículo se llenan Descripción y Unidad solas.

> Esos dos campos extra **solo existen en Materiales**. En CAPEX y en Viáticos no aparecen, y eso no es una falla.

### 4.4 OPEX · Viáticos

**Qué va aquí:** alimentación, hospedaje, transporte, casetas, peajes y gastos de campo.

Se captura **exactamente igual que Materiales**: mismas columnas, misma Periodicidad / Inicio, mismas Repeticiones. La diferencia es la lista de categorías, que aquí es la de viáticos.

**Ejemplo real (Perdiz - Papán CS):**

```
Categoría:     CASETAS PUENTES Y PEAJES
Descripción:   Casetas y peajes
Unidad:        Servicio
Cant.:         1
Periodicidad:  Mensual, desde Feb 2026
Repeticiones:  3
Monto unit.:   9,359.90
→ Total: 28,079.70
```

> La unidad de un viático suele ser **Día** o **Viaje**. Si capturas 30 días de viático a 800 pesos, va como Unidad `Día`, Cant. `30`, Monto unit. `800` — **no** como monto 24,000.

### 4.5 La regla de Categoría y Descripción

**En "Categoría" va la subcategoría descriptiva. En "Descripción" va el concepto.** Nunca el mismo nombre en las dos.

| | Categoría | Descripción |
|---|---|---|
| ✅ Correcto | `POSTE DE TELEMETRIA` | `Poste de 6 m para sensor` |
| ❌ Incorrecto | `MATERIALES` | `MATERIALES` |

Cuando lo haces bien, la app agrupa sola y arma el subtotal por categoría contable. Cuando lo haces mal, sale una tabla plana e ilegible.

**Si escribes una categoría que no está en la lista**, la app te ofrece **Crear categoría "…"** y luego te pregunta **¿A qué categoría contable pertenece?**. Elige la que corresponda. Si de verdad no sabes, pica **No sé / Dejar sin categoría contable** — el presupuesto se guarda igual y esa partida queda marcada para revisarla después. La app se acuerda de tu elección: la próxima vez ya no te pregunta.

---

## 5. Las tres reglas que más errores causan

Estas tres explican casi todos los presupuestos que salen mal. Ninguna dispara un aviso en pantalla: la app acepta el dato y lo multiplica.

### 5.1 El monto es UNITARIO, no el total de la partida

La columna se llama **Monto unit.** y así se calcula:

```
monto unitario × cantidad × repeticiones = el total que dice tu documento fuente
```

**Ejemplo numérico.** Tu documento dice que la cuadrilla de instalación cuesta **864,000** en total: 288,000 al mes durante 3 meses.

| Lo que escribes en Monto unit. | Cant. | Repeticiones | Lo que calcula la app | |
|---:|---:|---:|---:|---|
| **288,000** | 1 | 3 | **864,000** | ✅ correcto |
| **864,000** | 1 | 3 | **2,592,000** | ❌ tres veces de más |

El error no se ve en la fila: dice 864,000, que es el número que traías en la cabeza. Solo aparece al final, como un OPEX inflado.

**Cómo cazarlo:** toma el total de la fila y compáralo contra tu documento. Si te da un múltiplo exacto (2×, 3×, 12×), es esto.

### 5.2 Un gasto de una sola vez necesita Repeticiones = 1

**Periodicidad "Anual" no quiere decir "una sola vez". Quiere decir "cada 12 meses".** Si el proyecto dura más de 12 meses, se cobra dos veces.

**Ejemplo numérico.** Proyecto de 14 meses (M0 a M13). Una herramienta de **430,000** que se compra una sola vez:

| Periodicidad | Repeticiones | Cae en | Total calculado | |
|---|---:|---|---:|---|
| Anual | *(vacío)* | M1 **y** M13 | **860,000** | ❌ el doble |
| Anual | **1** | M1 | **430,000** | ✅ correcto |

En un proyecto de 12 meses o menos el descuido no se nota, y por eso sobrevive hasta que alguien clona ese presupuesto a uno más largo.

**Regla simple: si el gasto ocurre una sola vez, pon Repeticiones 1 aunque el proyecto sea corto.**

Y al revés: **si dejas Repeticiones vacío, el gasto se repite hasta el último mes del proyecto.** Es el comportamiento normal, y es la causa número uno de un OPEX inflado. Ponle un número cada vez que el gasto pare antes del final.

### 5.3 Fijo repite todos los meses; Contrato requiere decir cuántos meses

Aplica a **OPEX · Nómina**. La columna **Tipo** decide la duración del puesto:

- **Fijo** → corre **todos** los meses de operación del proyecto, de M1 hasta el final, automáticamente. No le pones duración.
- **Contrato** y **Outsourcing** → corren solo los meses que escribas en **Meses de contrato**, en la tira verde debajo de la fila. Si no lo tocas, se queda en 12.

**Ejemplo numérico.** Proyecto de 14 columnas de mes (M0 a M13). Como la nómina arranca en M1, un puesto Fijo corre 13 meses. Un supervisor de 30,000 al mes que solo trabaja los primeros 3 meses, con factor 2.00, cuesta 60,000 al mes:

| Tipo | Meses de contrato | Meses que corre | Total | |
|---|---:|---:|---:|---|
| **Fijo** | *(no aplica)* | 13 | **780,000** | ❌ diez meses de más |
| **Contrato** | **3** | 3 | **180,000** | ✅ correcto |

**Antes de cerrar la sección de Nómina, revisa puesto por puesto:** ¿cuáles son de verdad de planta todo el proyecto, y cuáles duran unos meses?

---

## 6. Guardar

**Hay un solo botón Guardar en toda la pantalla de captura.** Es verde, está hasta abajo del panel, después de Viáticos.

**Ese botón guarda TODO el presupuesto**, no solo el área que tienes abierta: todas las áreas con sus cuatro secciones, más los ingresos. Puedes ir y venir entre áreas cuantas veces quieras y guardar una sola vez al final.

Al picarlo:

- El botón dice **Guardando…** y se queda deshabilitado un momento.
- Después aparece **✓ Costos guardados correctamente**. Ya quedó.
- Si aparece **No se pudo guardar — intenta de nuevo**, **tu trabajo no se guardó**. Vuelve a picar Guardar. Si sigue fallando, avisa al equipo técnico y **no cierres la pantalla**.

**Dale Guardar antes de salir. Siempre.** Cambiar de pantalla, cerrar la ventana o irte a otra cosa sin guardar es perder la captura.

> El área que tenías abierta al picar Guardar es la única que se marca **✓ Guardado** en la lista de participantes. Es solo un recordatorio de por dónde ibas: **las demás también se guardaron**.

> Una vez guardado, sal del presupuesto y vuelve a entrar. Es la única forma de confirmar que lo que ves quedó guardado de verdad. Si al reabrir un número cambió, **no lo captures encima**: repórtalo.

---

## 7. Revisar el resultado

Abre el presupuesto y pica **Información general**. Arriba salen **cinco indicadores**. Son los mismos que verás en **Resumen mensual**.

### 7.1 Cómo leer los cinco indicadores

| Indicador | Qué debe cuadrar contra tu documento fuente |
|---|---|
| **Ingresos** | El total facturado del proyecto. Si usaste precio fijo, revisa que el número de meses con monto sea el que esperas — **M0 nunca lleva ingreso** |
| **CAPEX** | La suma de las compras únicas |
| **OPEX** | Nómina + materiales + viáticos, ya repartidos en el tiempo. Es el que más se desvía |
| **Total egresos** | CAPEX + OPEX. No es un dato aparte: si los dos de arriba cuadran, este cuadra solo |
| **Utilidad y margen** | Ingresos − Total egresos, con su porcentaje. Sin ingresos, el margen aparece como "—" |

**Cuadra primero Ingresos y CAPEX.** Son los más fáciles y suelen dar exactos. **Si esos dos cuadran y el OPEX no, tu problema está en el tiempo** (periodicidad, mes de inicio, repeticiones), no en los montos.

Debajo de los indicadores está la tabla **CAPEX y OPEX**, con cada categoría contable en su renglón y su reparto mes a mes. Los subtotales traen una **▶** a la izquierda: pícala para abrir el detalle y ver de qué partidas se compone. Ahí es donde encuentras la fila que está mal.

---

### 7.2 Lista de verificación — imprímela

**Antes de dar por bueno un presupuesto:**

☐ **1. ¿El periodo es el correcto?** La línea `Periodo: … · N meses` coincide con tu documento fuente.

☐ **2. ¿Los cinco indicadores cuadran?** Compáralos uno por uno contra los totales de control que anotaste antes de empezar.

☐ **3. ¿Sale el aviso "⚠ N partidas sin fecha de compra"?** Si sí, ese CAPEX está cayendo todo en el primer mes.

☐ **4. ¿Sale el aviso "⚠ N partidas sin categoría contable asignada"?** Si sí, esas partidas no van a agrupar bien ni en la tabla ni en el Excel.

☐ **5. ¿Cada monto es unitario?** `monto × cantidad × repeticiones` da el total de tu documento.

☐ **6. ¿Los gastos de una sola vez tienen Repeticiones 1?**

☐ **7. ¿Los gastos que paran antes del final tienen su número de Repeticiones?**

☐ **8. ¿Cada renta anual está en periodicidad Anual y no en Mensual?**

☐ **9. ¿Los puestos de Contrato tienen sus meses de contrato?** ¿Y ningún puesto quedó con cantidad 0?

☐ **10. ¿Guardaste, saliste y volviste a entrar?**

**Si un total no cuadra, empieza por aquí:**

| Lo que ves | Qué revisas primero |
|---|---|
| Un total sale **más alto** de lo esperado | **Las repeticiones.** Un gasto sin tope se repite hasta el último mes. Revisa también que no hayas capturado el total de la partida en el campo de monto |
| Un total sale **más bajo** de lo esperado | **Los montos.** Y en OPEX, si la diferencia es chica, revisa si son aguinaldo, fondo de ahorro o utilidades, que la app no calcula |
| **Todo el CAPEX cae en el primer mes** | **Las fechas de compra.** Sin mes y año, la partida cae en el primer mes |
| Un gasto sale **12 veces** más alto | **La periodicidad.** Está en Mensual y debería ser Anual |
| El **margen** aparece como "—" | No hay ingresos capturados. Normal en Departamento y Suministro |

---

## 8. Exportar a Excel y PDF

### Excel

Desde **Resumen mensual**, botón **⬇ Excel**. Se descarga un archivo `.xlsx` con cuatro hojas:

| Hoja | Qué trae |
|---|---|
| **SERVICIO** | Ingresos contra egresos, mes a mes, con cada subcategoría en su renglón y su subtotal por categoría contable |
| **FLUJO** | El flujo de efectivo mes a mes, con las filas de IVA |
| **EGRESOS** | El detalle de partidas |
| **INFO** | El resumen ejecutivo con los totales |

El archivo se llama `Presupuesto_<nombre del proyecto>_<fecha de hoy>.xlsx` y llega a tu carpeta de descargas.

### PDF

Botón **⬇ PDF**. Está en dos pantallas y cada una imprime cosas distintas:

- Desde **Resumen mensual** → las tablas y las gráficas.
- Desde **Información general** → la vista completa, con el detalle de todas las áreas.

Se abre el diálogo de impresión. Elige **Guardar como PDF** como destino.

---

## 9. Preguntas frecuentes

**¿Por qué un gasto me aparece 12 veces más alto de lo que debería?**
La periodicidad de esa partida está en Mensual y debería estar en Anual.

**¿Por qué todo mi CAPEX aparece en el primer mes?**
Porque esas partidas no tienen fecha de compra. Ve a la sección CAPEX y captura mes y año en cada una. Los selectores vacíos se ven en rojo.

**¿Tengo que capturar la fecha de cada vez que ocurre un gasto recurrente?**
No. En Materiales y Viáticos solo capturas cuándo empieza y cada cuánto se repite. La única fecha obligatoria por partida es la de compra en CAPEX.

**Un gasto sigue apareciendo después de que ya debería haber terminado.**
Le falta el número de **Repeticiones**. Sin ese número, el gasto se repite hasta el último mes del proyecto.

**Escribí una categoría nueva y me abrió una ventana preguntando a qué categoría contable pertenece.**
Es a propósito: así la app sabe dónde agrupar esa partida. Elige la que corresponda; si no sabes, pica **No sé / Dejar sin categoría contable**. El presupuesto se guarda igual.

**No me aparecen Subcategoría ni Artículo al elegir una categoría.**
Esos dos campos solo existen en **OPEX · Materiales**, y solo con los grupos del bloque **── catálogo almacén ──**. En CAPEX y Viáticos no aparecen.

**No veo la sección de Ingresos.**
Revisa el tipo del presupuesto. En **Departamento** y **Suministro** está oculta a propósito, porque no facturan.

**Estoy en Resumen mensual y no me deja capturar los ingresos.**
Ahí solo se ven. Se capturan en **Captura de información**, en el bloque de hasta arriba.

**No me deja capturar: la lista de participantes sale vacía y no veo las secciones de CAPEX ni OPEX.**
A ese presupuesto le faltan los participantes. Pasa cuando se crea el presupuesto y se sale antes de elegirlos: queda guardado, pero sin ningún área a la cual cargarle costos.

Tiene salida y no se pierde nada. En el panel verás el aviso **"Este presupuesto todavía no tiene participantes"** con el botón **Elegir participantes**:

1. Pica **Elegir participantes**.
2. Marca las áreas que van a capturar y pica **Confirmar**.
3. Regresas a Captura de información con la primera área ya seleccionada y las cuatro secciones listas.
4. Captura y pica **Guardar**. Si eliges participantes y te sales sin guardar, el presupuesto se queda igual que estaba.

Para que no vuelva a pasar: cuando crees un presupuesto nuevo, no te salgas en la pantalla de Participantes — elige al menos un área y pica **Confirmar** antes de irte a otra cosa.

**Piqué Información general y no puedo escribir nada, ¿está roto?**
No. Esa pantalla es solo de consulta: no tiene ni un campo editable, para que nadie mueva algo sin querer. Para capturar o corregir, pica **Editar** en la lista de presupuestos.

**Los botones de arriba a la derecha de Captura de información están grises.**
Estás **creando** un presupuesto nuevo y todavía no lo has guardado — no hay nada que mostrar. Se activan solos en cuanto guardas. Si abriste un presupuesto que ya existía y aun así están grises, avisa al equipo técnico.

**¿Qué significan M0, M1, M2… en las tablas?**
Son los meses del proyecto contados desde tu fecha de inicio. M0 es el primero; en Instalación y Servicio es el mes de instalación. Cada columna trae también el mes real debajo (`Ene 26`, `Feb 26`).

**¿Puedo perder mi trabajo si cierro sin guardar?**
Sí. Pica **Guardar** antes de salir de la pantalla de captura, siempre, aunque vayas a volver en cinco minutos.

**Me salió "No se pudo guardar — intenta de nuevo".**
Tu trabajo **no** se guardó. No cierres la pantalla. Vuelve a picar Guardar. Si vuelve a fallar, avisa al equipo técnico.

**Me salió "No se pudo cargar el presupuesto — revisa tu conexión e intenta de nuevo".**
El presupuesto no se abrió. La app prefiere no abrirlo a abrirlo vacío y arriesgar que guardes ese vacío encima de tus datos. Revisa tu conexión e inténtalo otra vez; si sigue igual, avisa al equipo técnico.

**Me equivoqué en la fecha de inicio y ya guardé. ¿Dónde la corrijo?**
Hoy no se puede desde la app. Las dos salidas son clonar el presupuesto con las fechas correctas y recapturar, o avisar al equipo técnico. Por eso la advertencia de la sección 3.

**Necesito borrar un presupuesto y no encuentro el botón.**
No existe. Hoy la app no tiene ninguna forma de borrar un presupuesto. Si de verdad hay que eliminarlo, avisa al equipo técnico.

**Veo un presupuesto en la lista que ya no debería estar ahí.**
Avisa al equipo técnico y no lo abras. No es algo que se arregle desde la captura.

**Las tablas se cortan a la derecha y no veo todas las columnas.**
Deslízalas hacia los lados. La sombra en el borde derecho de la tabla indica que hay más columnas.

**¿Y si mi documento fuente no cuadra consigo mismo?**
No lo arregles capturando algo distinto. Captura lo que dice el documento, anota la diferencia y repórtala con quien te lo pasó. Un presupuesto que no cuadra y lo dice es mejor que uno que cuadra porque alguien lo forzó.

---

### Pendiente de confirmar

- **Artículos del almacén.** Al escribir una categoría, la app puede ofrecerte artículos del catálogo de almacén como botones. Todavía no está confirmado cuántos artículos tiene cargados ese catálogo. Si nunca te aparece ninguno, no lo des por roto: confírmalo con el equipo técnico.

---

*GEOLIS SA DE CV — Módulo de Presupuestos — Manual de captura*
