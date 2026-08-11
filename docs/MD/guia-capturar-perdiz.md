# Guía — Capturar Perdiz - Papán CS desde cero

**Tipo:** Instalación · **Fuente:** `PERDIZ - PAPAN CS.xlsx`
Refleja el flujo actual de la app: los ingresos se capturan en **Capturar costos** (no en Resumen
mensual) y hay un solo botón **Guardar** para todo el presupuesto.

---

## Antes de empezar

Ten abierto el Excel en las hojas `SERVICIO`, `F00 INVERSIÓN` y `F01 NÓMINA`.

**Perdiz es distinto de Cuervito en tres cosas:**

1. **Tipo Instalación, no Servicio.** Factura por entregable — la facturación cae casi toda en los
   primeros dos meses, no repartida uniforme mes a mes.
2. **Los ingresos se capturan a mano, renglón por renglón** (mes, descripción, monto). No hay
   "Precio fijo" que aplique aquí — ese campo es para un monto igual todos los meses, y Perdiz no
   factura así.
3. **Un solo botón "Guardar"** para toda la pantalla de Capturar costos — ya no hay uno para el área
   y otro para Ingresos. Un clic sube áreas, costos e ingresos juntos.

**Misma regla de siempre:** en "Categoría" va el nombre de la cuenta contable; en "Descripción" va
el concepto. Y **usa siempre la columna `[MN]`** de `F00 INVERSIÓN` — trae el precio en dólares y en
pesos contiguos, con paridad 18.07.

---

## Paso 1 · Datos generales

| Campo | Qué poner |
|---|---|
| Nombre del proyecto | `Perdiz - Papán CS` |
| Empresa | GEOLIS SA DE CV |
| Fecha inicio | **01/01/2026** |
| Fecha fin | **01/02/2027** |
| Fecha elaboración | hoy |
| Tipo | **Instalación** |

Con esas fechas salen 14 columnas: `M0 Ene 26` hasta `M13 Feb 27` — el mismo largo que las 14
columnas mensuales de la hoja SERVICIO (Enero a Diciembre, más Enero y Febrero del año siguiente).

Elige **"Iniciar desde cero"**.

---

## Paso 2 · Áreas

Marca **solo Construcción**. Los puestos de `F01 NÓMINA` (Cabo, Soldador, Tubero, Ayudante
general, Supervisores) son una cuadrilla de campo — no hay razón para repartir la captura en más de
un área.

---

## Paso 3 · CAPEX · Equipos e inversiones

**Nueve partidas**, todas `Unidad`, repartidas en cuatro meses reales según `F00 INVERSIÓN`:

| Categoría | Descripción | Cant. | Monto [MN] | Fecha de compra |
|---|---|---|---|---|
| MAQUINARIA Y EQUIPO | Servicios (RICCSSA) | 1 | 2,668,500.00 | Ene 2026 |
| MAQUINARIA Y EQUIPO | Servicio de obra (RICCSSA) | 1 | 1,440,000.00 | Ene 2026 |
| OTROS ACTIVOS | Obra mecánica (Geolis) | 1 | 2,513,689.87 | Ene 2026 |
| OTROS ACTIVOS | Válvulas (Geolis) | 1 | 6,243,907.98 | Ene 2026 |
| OTROS ACTIVOS | Servicios (Geolis) | 1 | 1,602,728.59 | Ene 2026 |
| OTROS ACTIVOS | Obra civil (RICCSSA) | 1 | 309,000.00 | Ene 2026 |
| OTROS ACTIVOS | Obra mecánica suministro (RICCSSA) | 1 | 7,246,756.66 | Ene 2026 |
| MAQUINARIA Y EQUIPO | Controladores C1 | 4 | 62,999.97 c/u | Feb 2026 |
| MAQUINARIA Y EQUIPO | Válvula SDV | 1 | 3,075,366.73 (mitad Mar, mitad Abr) | Mar y Abr 2026 |

El último renglón (Válvula SDV) es un caso especial: el Excel lo reparte en dos meses iguales de
1,537,683.36 cada uno — captúralo como **dos partidas** de esa cantidad, una con fecha Mar 2026 y
otra Abr 2026, en vez de una sola con el total.

**CAPEX total esperado: 25,351,949.71**

> **Enero se lleva casi todo (22,024,583.10 de los 25.35M).** A diferencia de Cuervito, aquí CAPEX
> sí puede capturarse en M0 — la restricción de "M0 no acepta OPEX" (Math.max(1,…) en
> distribuirOpex) no aplica a CAPEX, solo a materiales, viáticos y nómina.

---

## Paso 3 · OPEX · Nómina

**Ocho puestos**, todos tipo **Contrato**, 3 meses de contrato:

| Puesto | Cant. | Salario | IMSS | Prestaciones | ISR | Costo/mes |
|---|---|---|---|---|---|---|
| Cabo | 1 | 220,000 | 0.32 | 0.63 | 0.05 | 440,000 |
| Soldador | 3 | 20,000 | 0.32 | 0.63 | 0.05 | 40,000 c/u |
| Tubero | 2 | 20,000 | 0.32 | 0.63 | 0.05 | 40,000 c/u |
| Ayudante general | 4 | 12,000 | 0.32 | 0.63 | 0.05 | 24,000 c/u |
| Sup. Op | 1 | 30,000 | 0.32 | 0.63 | 0.05 | 60,000 |
| Seguridad | 1 | 25,000 | 0.32 | 0.63 | 0.05 | 50,000 |
| Sup Obra | 1 | 24,000 | 0.32 | 0.63 | 0.05 | 48,000 |
| Cadista | 1 | 20,000 | 0.32 | 0.63 | 0.05 | 40,000 |

IMSS + Prestaciones + ISR = 1.00 (factor total 2.00) — es la cifra que da `F01 NÓMINA` en su columna
"COSTO REAL C/IMP." (siempre el doble del salario). El Excel no separa ese 100% en IMSS/
Prestaciones/ISR por columna; **0.32/0.63/0.05 es una repartición razonable para que sume 1.00**, no
un dato literal de la hoja.

**Cantidad × Costo/mes, sumado:** 934,000/mes.

> **Mes de inicio: M1 (Feb 2026), no M0.** El Excel arranca la nómina en Enero, pero la app no
> acepta OPEX (incluida nómina) en M0 — mismo bug documentado para Cuervito. Captúrala con inicio en
> M1 y 3 meses de contrato (Feb-Mar-Abr 2026 en vez de Ene-Feb-Mar). El total en 3 meses no cambia,
> solo se recorre un mes.

**Nómina esperada: 934,000 × 3 = 2,802,000**

---

## Paso 3 · OPEX · Materiales

**Doce partidas** — incluye lo que en la hoja SERVICIO son las cuentas MATERIALES, ARTICULOS DE
SEGURIDAD, EQUIPOS Y ENSERES, INSUMOS DE OFICINA, MATERIALES DE SALUD, SERVICIOS y VEHICULOS Y
COMBUSTIBLE. Todas capturables aquí, en Materiales (Viáticos es aparte, ver el siguiente paso).

| Categoría | Descripción | Monto total [MN] |
|---|---|---|
| HERRAMIENTAS MANUALES | Herramienta | 1,520,389.81 |
| PINTURA Y OTROS RECUBRIMIENTOS | Pintura y recubrimientos | 350,951.75 |
| ABRASIVOS | Abrasivos | 20,997.34 |
| FIBRAS HILOS Y TELAS | Fibras, hilos y telas | 20,000.00 |
| TUBERIAS | Tuberías | 105,000.07 |
| ROPA Y ARTICULOS DE PROTECCION | EPP y ropa de protección | 218,207.90 |
| ENSERES MENORES DIVERSOS | Enseres menores (acond. de casas) | 10,057.52 |
| PAPELERIA Y UTILES DE OFICINA | Papelería y útiles | 20,000.00 |
| ARTICULOS DE ASEO Y SANITARIOS | Aseo y sanitarios | 9,999.99 |
| ARTICULOS DE CAFETERIA | Cafetería | 9,999.99 |
| ARTICULOS DIGITALES Y DE COMPUTO | Artículos digitales y de cómputo | 8,000.00 |
| MATERIAL PRIMEROS AUXILIOS | Primeros auxilios | 8,800.00 |

Más los rubros de servicios y combustible, también en Materiales:

| Categoría | Descripción | Monto total [MN] |
|---|---|---|
| MANIOBRAS | Maniobras | 1,362,713.85 |
| CERTIFICACION | Certificación | 225,499.14 |
| ANALISIS DE RIESGO | Análisis de riesgo | 186,114.91 |
| ADQUISICION TARJET COMBUSTIBLE | Tarjeta de combustible | 903.50 |
| HIELO Y AGUA | Hielo y agua | 6,432.92 |
| RECARGA DE GASES INDUSTRIALES | Recarga de gases industriales | 34,110.38 |
| SERVICIO DE AUTOLAVADO | Autolavado | 800.00 |
| COMBUSTIBLES | Combustibles | 475,264.00 |

**Todas concentradas en Ene-Feb-Mar 2026** (2 o 3 meses según la partida, casi todas arrancando en
Enero en el Excel). Por el mismo bug de M0 que la nómina, captúralas con inicio en **M1 (Feb 2026)**
en vez de Enero, mensual, con el número de repeticiones que corresponda (2 o 3 según la partida —
revisa el detalle mes a mes de SERVICIO si necesitas la cifra exacta de cada mes; varía un poco entre
meses en algunas partidas, así que "monto mensual × repeticiones" es una aproximación al total real
capturado a mano en el Excel).

**OPEX materiales esperado: 4,594,243.10**

---

## Paso 3 · OPEX · Viáticos

**Cuatro partidas** — esta es la cuenta VIATICOS completa de la hoja SERVICIO:

| Categoría | Descripción | Monto total [MN] |
|---|---|---|
| ALIMENTACION | Alimentación | 1,070,647.50 |
| CASETAS PUENTES Y PEAJES | Casetas y peajes | 28,079.70 |
| SERVICIOS DE HOSPEDAJE | Hospedaje | 1,353,740.25 |
| REEMBOLSOS | Reembolsos | 14,456.00 |

Igual que Materiales: todas empiezan en Enero en el Excel, captúralas desde **M1 (Feb 2026)**, 2 o 3
repeticiones según la partida (Reembolsos son solo 2 meses; las otras tres, 3 meses).

**OPEX viáticos esperado: 2,466,923.45**

---

## Guardar

Con la área activa (Construcción) mostrando sus cuatro secciones — CAPEX, Nómina, Materiales,
Viáticos — y el bloque de **Ingresos** arriba de todo eso, pica el único botón verde **Guardar**,
después de Viáticos. Debe salir "✓ Costos guardados correctamente". No hay que volver a ningún otro
lado ni guardar dos veces.

---

## Ingresos

Se capturan en esta misma pantalla (Capturar costos), en el bloque **Ingresos**, arriba del selector
de áreas — **no** en Resumen mensual. **No uses "Precio fijo del servicio"**: ese campo reparte un
monto igual entre todos los meses, y Perdiz factura por entregable, no así.

Usa **"Ingreso por mes"** — agrega un renglón por cada mes con facturación real, leyendo la hoja
SERVICIO, renglón `FACTURACION`:

| Mes | Descripción | Monto |
|---|---|---|
| M0 · Ene 2026 | Servicio de diseño, interconexión eléctrica, pruebas y puesta en operación | 1,613,971.29 |
| M1 · Feb 2026 | Variador de frecuencia + patín con bomba electrocentrífuga | 69,593,781.40 |

El resto de los meses (M2 en adelante) se queda en cero — Perdiz no factura nada después de febrero
en este presupuesto.

**Ingresos esperados: 71,207,752.69**

---

## Verificación final

En Información general, los indicadores deben acercarse a:

| | Esperado (spec) | Lo que da la app con esta captura |
|---|---|---|
| Ingresos | 71,207,752.69 | 71,207,752.69 |
| CAPEX | 25,351,949.71 | 25,351,949.70 |
| OPEX | 9,886,209.30 | 9,863,166.55 |
| Total egresos | 35,238,159.02 | 35,215,116.25 |

Ingresos y CAPEX cuadran al peso. OPEX y Total egresos quedan **23,042.75** por debajo de la cifra
de control — ver la nota siguiente, es un solo hueco identificado, no varios sueltos.

---

## Lo que NO va a cuadrar contra el Excel, y por qué

| Concepto | App | Excel/spec | Por qué |
|---|---|---|---|
| NOMINA Y ADICIONALES | 2,802,000.00 | 2,825,042.76 | La diferencia (23,042.76) son aguinaldo, fondo de ahorro y utilidades que viven en columnas de `F01 NÓMINA` (AGUINALDO, FONDO DE AHORRO, UTILIDADES) que el modelo de nómina de la app no captura — mismo tipo de hueco que ya está documentado para Cuervito. |
| Nómina y OPEX-materiales/viáticos: mes de inicio | M1 (Feb 2026) | Enero 2026 | La app no acepta OPEX (nómina, materiales ni viáticos) en M0 — Math.max(1,…) en distribuirOpex. El total en el mismo número de meses no cambia, solo se recorre un mes completo. |
| IMSS/Prestaciones/ISR de nómina | 0.32 / 0.63 / 0.05 (asumido) | 100% agregado, sin desglose | `F01 NÓMINA` solo da el factor total (2.00×) en "COSTO REAL C/IMP.", no la partición en IMSS/Prestaciones/ISR que pide la app. Se eligió una repartición que suma 1.00 — no es un dato literal del Excel. |
| Detalle mes a mes de Materiales/Viáticos | monto mensual × repeticiones (aproximado) | monto real, ligeramente distinto cada mes | Varias partidas (Alimentación, Combustibles, Maniobras) no reparten exactamente igual entre sus 2-3 meses en el Excel. El total de la partida es exacto; el desglose mes a mes en la app es una aproximación uniforme. |

Ninguna es error de la app. Todas están explicadas y apuntan al mismo tipo de hueco ya conocido
(nómina) o a una limitación de captura ya documentada (M0).
