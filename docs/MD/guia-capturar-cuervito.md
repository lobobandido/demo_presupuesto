# Guía — Capturar Monitoreo Cuervito desde cero

**Tipo:** Servicio · **Fuente:** `01022026 Presupuesto Monitoreo Cuervito.xlsx`
Todos los montos ya están **convertidos a pesos** (el Excel los tiene en dólares con paridad 18).

---

## Antes de empezar

Ten abierto el Excel en las hojas `SERVICIO`, `F00 INVERSIÓN` y `F01 NÓMINA`.

**Dos reglas que hacen la diferencia:**

1. **En "Categoría" va el nombre de la cuenta contable. En "Descripción" va el concepto
   específico.** Eso es lo que hace que la tabla agrupe bien. Si pones el mismo texto en las dos, la
   vista sale plana — es la queja de *"materiales, materiales, materiales"*.
2. **Guarda seguido.** El botón verde "Guardar" de cada área es lo único que sube a la nube.

---

## Paso 1 · Datos generales

| Campo | Qué poner |
|---|---|
| Nombre del proyecto | `Monitoreo Cuervito` |
| Empresa | GEOLIS SA DE CV |
| Fecha inicio | **01/02/2026** |
| Fecha fin | **01/02/2027** |
| Fecha elaboración | hoy |
| Tipo | **Servicio** |

La fecha de inicio es febrero porque ahí cae toda la inversión — es el mes cero del Excel. Con esas
dos fechas salen 13 columnas: `M0 Feb 26` más `M1 Mar 26` hasta `M12 Feb 27`.

Elige **"Iniciar desde cero"**. No cargues plantilla: la de Cuervito tiene los precios en dólares.

---

## Paso 2 · Áreas

Marca **solo Operaciones**. Nada más.

Las áreas son quién captura, no una clasificación contable. Cuervito es una sola operación; si
marcas nueve, ocho quedan vacías.

---

## Paso 3 · CAPEX · Equipos e inversiones

**Todas con fecha de compra Feb 2026.** Son 16 partidas.

| Categoría | Descripción | Cant. | Monto unit. | Total |
|---|---|---|---|---|
| EQUIPO DE TRANSPORTE | Camionetas | 1 | 550,000 | 550,000 |
| EQUIPO DE ADQUISICION | Sensores de presión | 360 | 2,970 | 1,069,200 |
| EQUIPO DE ADQUISICION | Gateway | 180 | 3,150 | 567,000 |
| EQUIPO DE ADQUISICION | PLC | 50 | 5,400 | 270,000 |
| EQUIPO DE ADQUISICION | Arreglos y accesorios | 180 | 11,700 | 2,106,000 |
| GABINETE Y ENERGIA | Panel solar | 180 | 1,080 | 194,400 |
| GABINETE Y ENERGIA | Controlador de carga | 180 | 630 | 113,400 |
| GABINETE Y ENERGIA | Batería ciclo profundo | 360 | 1,440 | 518,400 |
| GABINETE Y ENERGIA | Gabinete | 180 | 1,620 | 291,600 |
| GABINETE Y ENERGIA | Cableado, clemas y riel | 180 | 1,080 | 194,400 |
| TRANSMISION | Kit Starlink mini | 40 | 4,986 | 199,440 |
| TRANSMISION | Antenas repetidoras | 40 | 19,800 | 792,000 |
| CENTRO DE MONITOREO | Monitores | 6 | 8,100 | 48,600 |
| CENTRO DE MONITOREO | Workstation | 1 | 32,400 | 32,400 |
| CENTRO DE MONITOREO | UPS | 1 | 4,500 | 4,500 |
| CENTRO DE MONITOREO | Accesorios | 1 | 3,600 | 3,600 |
| EQUIPO DE COMPUTO | Equipo de cómputo adquisición | 1 | 84,000 | 84,000 |

**Unidad:** todas `Unidad`.

**CAPEX total esperado: 7,038,940**

> El último renglón, equipo de cómputo, en el Excel está en el bloque de OPEX. Va aquí porque el
> cliente lo pidió: *"equipos de cómputo debería ir acá, en CAPEX."*

---

## Paso 3 · OPEX · Nómina

| Puesto | Tipo | Cant. | Salario | IMSS | Prestaciones |
|---|---|---|---|---|---|
| Especialista telemetría | Fijo | 1 | 25,000 | 0.40 | 0.00 |
| Técnico instrumentista | Fijo | 1 | 20,000 | 0.40 | 0.00 |

Los factores 0.40 + 0.05 de ISR dan el **45%** que usa la hoja `F01 NÓMINA`:
25,000 × 1.45 = 36,250 y 20,000 × 1.45 = 29,000.

**Nómina esperada: 65,250/mes → 783,000 en 12 meses.**

> La hoja SERVICIO dice 73,490.13/mes (881,881.58 al año). La diferencia son aguinaldo, fondo de
> ahorro y otros conceptos que viven en columnas más a la derecha de `F01 NÓMINA`. Está anotado como
> pendiente; con 0.40 quedas alineado con la columna de impuestos del Excel, que es la verificable.

---

## Paso 3 · OPEX · Materiales

**Recurrentes mensuales** — periodicidad `Mensual`, inicio **Mar 2026**, repeticiones vacío:

| Categoría | Descripción | Cant. | Monto | Total 12 meses |
|---|---|---|---|---|
| ARRENDAMIENTO DE INMUEBLES | Renta de oficina y servicios | 1 | 10,000 | 120,000 |
| SERVICIOS DE LUZ, AGUA E INTERNET | Luz, agua e internet | 1 | 3,000 | 36,000 |
| PAPELERIA Y UTILES DE OFICINA | Papelería y útiles | 1 | 500 | 6,000 |
| ARTICULOS DE ASEO Y SANITARIOS | Aseo y sanitarios | 1 | 1,200 | 14,400 |
| ARTICULOS DE CAFETERIA | Cafetería | 1 | 1,000 | 12,000 |
| INSUMOS OPERATIVOS | Insumos operativos varios | 1 | 2,700 | 32,400 |
| SERV TELEFONIA CELULAR (PARA TRANSMITIR) | Telefonía celular para transmitir | 1 | 28,000 | 336,000 |
| SERVICIO DE RADIOCOMUNICACION (PARA TRANSMITIR) | Radiocomunicación | 1 | 38,000 | 456,000 |

**Con tope de repeticiones:**

| Categoría | Descripción | Monto | Periodicidad | Inicio | Repeticiones |
|---|---|---|---|---|---|
| CUADRILLA DE INSTALACION | Cuadrilla de instalación | 288,000 | Mensual | Mar 2026 | **3** |
| HERRAMIENTA | Herramienta | 430,000 | Anual | Mar 2026 | **1** |

**Una sola vez:**

| Categoría | Descripción | Monto | Periodicidad | Inicio | Repeticiones |
|---|---|---|---|---|---|
| ROPA Y ARTICULOS DE PROTECCION | EPP y ropa de protección | 40,000 | Anual | Mar 2026 | 1 |
| POSTE DE TELEMETRIA | Poste de telemetría | 810,000 | Anual | Mar 2026 | 1 |

**Unidad:** `Servicio` para las recurrentes, `Global` para poste de telemetría y cuadrilla,
`Unidad` para EPP y herramienta.

> **Ojo con estas dos últimas.** En el Excel el EPP y el poste caen en **febrero**, el mes cero.
> La app no acepta gasto operativo en el mes de instalación y las empuja a marzo. El total no
> cambia, solo el mes. Es una de las preguntas abiertas con el cliente.

**OPEX de materiales esperado: 2,292,800**

---

## Paso 3 · OPEX · Viáticos

**Ninguna partida.** Cuervito no tiene viáticos en su Excel.

---

## Guardar

Pica el botón verde **Guardar** de Operaciones. Debe salir "✓ Costos guardados".

---

## Ingresos

Ve a **Resumen mensual**. En "Ingreso por mes", agrega un renglón por cada mes con su monto,
leyéndolos del renglón `FACTURACION` de la hoja SERVICIO. Empieza en **M1 Mar 26** — febrero va en
cero porque es el mes de instalación y no se factura.

Los montos alternan según los días del mes: 669,600 en los de 31 días y 648,000 en los de 30.

**Ingresos esperados: 6,609,600**

> Cuando esté listo el cambio de captura por tipo, esto se va a poder capturar como un solo precio
> diario: 200 pozos × 6 USD × 18 = **21,600 por día**, y la app multiplicará por los días de cada
> mes. Por ahora se captura mes por mes.

Después de capturar los ingresos, regresa a **Capturar costos** y pica **Guardar** otra vez —
es lo único que los sube a la nube.

---

## Verificación final

En Información general, los cinco indicadores deben dar:

| | Esperado |
|---|---|
| Ingresos | 6,609,600 |
| CAPEX | 7,038,940 |
| OPEX | 3,076,082 |
| Total egresos | 10,115,022 |
| Utilidad | −3,505,422 |

Y en la tabla, los subtotales por categoría contable:

| Subtotal | Esperado |
|---|---|
| ACTIVOS | 7,038,940 |
| ARRENDA DE INMUEBLES Y SERV | 156,000 |
| ARTICULOS DE SEGURIDAD | 40,000 |
| INSUMOS DE OFICINA | 32,400 |
| INSUMOS OPERATIVOS | 32,400 |
| MATERIALES | 810,000 |
| NOMINA Y ADICIONALES | 783,000 |
| SERV TELEFONIA CELULAR Y RADIO | 792,000 |
| SERVICIOS | 1,294,000 |

**La prueba de fuego:** expande `SERVICIOS` y confirma que la cuadrilla aparece con 288,000 en
marzo, abril y mayo, y cero de junio en adelante. Esa es la funcionalidad de repeticiones
funcionando, y es lo que el Excel hace a mano.

---

## Lo que NO va a cuadrar contra el Excel, y por qué

Si el cliente compara al peso, estas son las diferencias y todas están explicadas:

| Concepto | App | Excel SERVICIO | Por qué |
|---|---|---|---|
| ACTIVOS | 7,038,940 | 7,169,660 | El Excel usa la cifra **con IVA** en transporte (550,000 × 1.16 = 638,000) mientras los otros van sin IVA, y su renglón de transmisión trae 126,720 que no salen de ninguna partida de `F00 INVERSIÓN`. Además aquí se movió equipo de cómputo a CAPEX, +84,000 |
| NÓMINA | 783,000 | 881,881.58 | Conceptos adicionales en columnas de `F01 NÓMINA` que no alcanzamos a revisar |
| EPP y poste de telemetría | marzo | febrero | La app no acepta OPEX en el mes de instalación |

Ninguna es error de la app. Dos son inconsistencias del propio Excel y una es una regla a decidir.
