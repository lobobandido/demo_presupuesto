# Guía paso a paso — Crear presupuesto Monitoreo Cuervito
## Basada en el archivo real: 01022026 Presupuesto Monitoreo Cuervito

---

## ¿De dónde sale cada dato?

El Excel de Cuervito tiene varias pestañas. Estas son las que usamos:

| Pestaña Excel | Qué contiene | Dónde va en la app |
|---|---|---|
| **F00 INVERSIÓN** | Lista de equipos con cantidades y precios | CAPEX — Equipos e inversiones |
| **F01 NÓMINA** | Puestos, salarios y cargas sociales | OPEX — Nómina y Mano de Obra |
| **SERVICIO** | Todos los gastos operativos por mes | OPEX — Materiales |
| **SERVICIO** | Fila FACTURACIÓN mes a mes | Resumen — Ingresos |

---

## PASO 1 — Info general

Ve a la app → **+ Nuevo presupuesto**

Captura estos datos:

| Campo | Valor |
|---|---|
| Nombre del proyecto | `Monitoreo Cuervito` |
| Empresa | `GEOLIS SA DE CV` |
| Fecha inicio | `01/02/2026` (Febrero 2026 = M0, mes de instalación) |
| Fecha fin | `01/02/2027` (12 meses de operación) |
| Fecha elaboración | `01/02/2026` |
| Tipo | **Servicio** |

En "¿Cómo quieres iniciar?" → **Iniciar desde cero**

Clic en **Continuar**

---

## PASO 2 — Participantes (Áreas)

Selecciona solo: **Operaciones**

*(En un proyecto real seleccionarías todas las áreas que participan, pero para esta prueba una es suficiente)*

Clic en **Confirmar**

---

## PASO 3 — CAPEX (Equipos e inversiones)

**¿De dónde salen estos datos?** → Pestaña **F00 INVERSIÓN** del Excel

> **Regla:** Todo lo que aparece en esa pestaña es CAPEX porque son compras únicas al inicio del proyecto. La fecha de compra es **Febrero 2026** (M0, mes de instalación).

Agrega estas partidas una por una:

| Categoría | Descripción | Unidad | Cant. | Monto unit. | Fecha compra |
|---|---|---|---|---|---|
| EQUIPO DE TRANSPORTE | Camionetas | Unidad | 1 | $550,000 | Feb / 2026 |
| EQUIPO DE ADQUISICION | Sensores de presión | Unidad | 360 | $165 | Feb / 2026 |
| EQUIPO DE ADQUISICION | Gateway | Unidad | 180 | $175 | Feb / 2026 |
| EQUIPO DE ADQUISICION | PLC | Unidad | 50 | $300 | Feb / 2026 |
| EQUIPO DE ADQUISICION | Arreglos y accesorios | Unidad | 180 | $650 | Feb / 2026 |
| GABINETE Y ENERGIA | Panel solar | Unidad | 180 | $60 | Feb / 2026 |
| GABINETE Y ENERGIA | Bateria Ciclo profundo | Unidad | 360 | $80 | Feb / 2026 |
| GABINETE Y ENERGIA | Gabinete | Unidad | 180 | $90 | Feb / 2026 |
| TRANSMISION | Kit Starlink mini | Unidad | 40 | $277 | Feb / 2026 |
| TRANSMISION | Antenas repetidoras | Unidad | 40 | $1,100 | Feb / 2026 |
| CENTRO DE MONITOREO | Workstation | Unidad | 1 | $1,800 | Feb / 2026 |

**Total CAPEX esperado: ~$7,169,660**

> **¿Por qué todos en Feb 2026?** Porque el Excel muestra que todos los activos se compran en M0 (mes de instalación). Si en otro proyecto compraras equipos en meses distintos, pondrías fechas diferentes y el sistema los distribuye al mes correcto.

---

## PASO 4 — OPEX Nómina

**¿De dónde salen estos datos?** → Pestaña **F01 NÓMINA** del Excel

> **Regla:** Son personas que trabajan en el proyecto. Si son empleados fijos su costo se repite todos los meses. El sistema calcula automáticamente IMSS, prestaciones e ISR.

Agrega estos puestos:

| Puesto | Tipo | Cant. | Salario/mes |
|---|---|---|---|
| Especialista telemetría | **Fijo** | 1 | $25,000 |
| Técnico instrumentista | **Fijo** | 1 | $20,000 |

**¿Qué significa "Fijo"?** → El sistema multiplica el costo por todos los meses del proyecto automáticamente. La nómina nunca para.

**Costo real calculado por el sistema:**
- Especialista: $25,000 × (1 + 0.32 + 0.40 + 0.05) × 1 = **$44,250/mes**
- Técnico: $20,000 × 1.77 = **$35,400/mes**
- Total nómina mensual: **$79,650/mes**

---

## PASO 5 — OPEX Materiales

**¿De dónde salen estos datos?** → Pestaña **SERVICIO** del Excel, sección EGRESOS

> **Regla clave del coordinador:** La UNIDAD es la naturaleza del bien (Servicio, Pieza, Global). La PERIODICIDAD es cada cuánto se repite. NO usar "Mes" como unidad.

Agrega estas partidas:

| Categoría | Descripción | Unidad | Cant. | Monto | Periodicidad | Mes inicio |
|---|---|---|---|---|---|---|
| ARRENDA DE INMUEBLES Y SERV | Arrendamiento inmuebles y servicios | Servicio | 1 | $13,000 | **Mensual** | Mar (M1) |
| SERV TELEFONIA CELULAR Y RADIO | Telefonía celular y radio | Servicio | 1 | $66,000 | **Mensual** | Mar (M1) |
| SERVICIOS | Cuadrilla de instalación | Servicio | 1 | $288,000 | **Mensual** | Mar (M1) |
| SERVICIOS | Herramienta (pago único) | Global | 1 | $430,000 | **Anual** | Mar (M1) |
| INSUMOS OPERATIVOS | Insumos operativos varios | Servicio | 1 | $2,700 | **Mensual** | Mar (M1) |
| INSUMOS DE OFICINA | Papelería, aseo, cafetería | Servicio | 1 | $2,700 | **Mensual** | Mar (M1) |
| VEHICULOS Y COMBUSTIBLE | Combustible y operación vehículos | Servicio | 1 | $26,217 | **Mensual** | Mar (M1) |

> **Ojo con HERRAMIENTA:** En el Excel aparece $430,000 SOLO en M1 (Marzo) y cero en todos los demás meses. Por eso va con periodicidad **Anual** — significa que solo ocurre una vez. No es mensual aunque esté en OPEX.

> **¿Por qué mes inicio Mar (M1)?** Porque M0 es instalación (Febrero) y la operación empieza en Marzo.

---

## PASO 6 — Guardar

Clic en **Guardar** (botón verde abajo a la derecha)

Debe aparecer la notificación "✓ Costos guardados"

---

## PASO 7 — Resumen mensual

Clic en **Ver Resumen mensual** (aparece arriba a la derecha después de guardar)

### Captura de ingresos

En la pestaña **SERVICIO** del Excel, fila **FACTURACIÓN**, los valores mes a mes son:

| M0 (Feb) | M1 (Mar) | M2 (Abr) | M3 (May) | M4-M11 |
|---|---|---|---|---|
| $0 | $669,600 | $648,000 | $648,000 | variable |

En la app, en la sección **Precio fijo del servicio**:
- No uses precio fijo porque los meses no son todos iguales
- En cambio usa **+ Agregar ingreso** para cada mes:

| Mes | Año | Descripción | Monto |
|---|---|---|---|
| M1 - Mar | 2026 | Facturación Marzo | $669,600 |
| M2 - Abr | 2026 | Facturación Abril | $648,000 |
| M3 - May | 2026 | Facturación Mayo | $648,000 |
| M4 - Jun | 2026 | Facturación Junio | $669,600 |
| M5 - Jul | 2026 | Facturación Julio | $669,600 |
| M6 - Ago | 2026 | Facturación Agosto | $648,000 |
| M7 - Sep | 2026 | Facturación Septiembre | $648,000 |
| M8 - Oct | 2026 | Facturación Octubre | $669,600 |
| M9 - Nov | 2026 | Facturación Noviembre | $669,600 |
| M10 - Dic | 2026 | Facturación Diciembre | $648,000 |
| M11 - Ene | 2027 | Facturación Enero | $648,000 |
| M12 - Feb | 2027 | Facturación Febrero | $669,600 |

**Total ingresos esperado: $7,956,800**

---

## ¿Qué debes ver en el Resumen mensual?

### Tabla SERVICIO esperada:

| Categoría | M0 (Feb) | M1 (Mar) | M2 (Abr) | M3-M11 |
|---|---|---|---|---|
| INGRESOS | $0 | $669,600 | $648,000 | variable |
| CAPEX | $7,169,660 | $0 | $0 | $0 |
| OPEX | $0 | $902,107 | $472,107 | $184,107 |
| EGRESOS | $7,169,660 | $902,107 | $472,107 | $184,107 |

### ¿Por qué M1 tiene $902,107 de OPEX y M2 solo $472,107?

Porque en M1 (Marzo) ocurre:
- Nómina: $79,650
- Arrenda: $13,000
- Telefonía: $66,000
- **Herramienta: $430,000** ← solo este mes (periodicidad anual)
- Cuadrilla: $288,000
- Insumos: $5,400
- Vehículos: $26,217
- **Total M1: $908,267**

Y en M2 (Abril) la Herramienta ya no aparece:
- Sin herramienta: $908,267 - $430,000 = **$478,267**

**Ese es exactamente el comportamiento que dice el coordinador: no todos los meses son iguales.**

---

## ¿Cómo usar esto para proyectos futuros?

Cuando llegue un nuevo proyecto:

1. Abres el Excel del presupuesto
2. De **F00 INVERSIÓN** sacas el CAPEX con sus fechas de compra
3. De **F01 NÓMINA** sacas los puestos y salarios
4. De la pestaña **SERVICIO** sacas los gastos operativos y su periodicidad
5. De la fila **FACTURACIÓN** sacas los ingresos mes a mes
6. Capturas todo en la app siguiendo esta guía
7. El Resumen mensual te da las tablas y gráficas automáticamente

---

## Funcionalidad "Partir de un presupuesto anterior"

Cuando ya tienes Cuervito guardado en el sistema y llega un proyecto similar:

1. **+ Nuevo presupuesto** → Partir de un presupuesto anterior
2. Seleccionas **Cuervito** de la lista
3. Se cargan TODAS las partidas de Cuervito
4. Modificas solo lo que cambia (precios, cantidades, fechas)
5. Guardas como nuevo presupuesto

Esto te ahorra capturar desde cero cuando los proyectos son similares.

---

*GEOLIS SA DE CV — Guía de captura de presupuestos — Módulo v1.5 MVP*
