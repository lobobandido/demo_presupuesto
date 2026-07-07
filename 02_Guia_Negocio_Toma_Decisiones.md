# GEOLIS — Módulo de Presupuestos
## Guía de negocio: qué hace la app y cómo tomar decisiones con ella
**Para:** Project Managers, Supervisores, Directivos | **Versión:** MVP 1.0

---

## ¿Para qué sirve esta app?

Antes de esta app, elaborar un presupuesto en Geolis significaba abrir un Excel en blanco, recordar de memoria las categorías contables correctas, capturar cada número a mano y luego enviar el archivo por correo para que alguien más lo revisara.

Esta app digitaliza ese proceso. No cambia la lógica de cómo Geolis construye sus presupuestos — la mantiene exactamente igual, pero la hace más rápida, más ordenada y con menos errores.

---

## Los 4 tipos de presupuesto que maneja

| Tipo | ¿Cuándo usarlo? | ¿Genera ingresos? |
|---|---|---|
| **Instalación** | Proyecto de campo: monitoreo, instalación de equipo, bombas, pozos | Sí — facturación mensual al cliente |
| **Servicio** | Contrato de servicio recurrente con PEMEX u otro cliente | Sí — facturación mensual al cliente |
| **Departamento** | Presupuesto interno de un área: TI, Finanzas, Innovación | No |
| **Suministro** | Compra o entrega de materiales sin contrato de servicio | No |

> **Regla de oro:** Si le vas a facturar a alguien, es Instalación o Servicio. Si es gasto interno de Geolis, es Departamento o Suministro.

---

## Cómo funciona el flujo paso a paso

### Paso 1 — Info general

Se captura el nombre del proyecto, la empresa, las fechas de inicio y fin, y el tipo de presupuesto.

**Por qué importan las fechas:** la fecha de inicio define cuándo comienza la instalación (M0) y la fecha de fin define cuántos meses tiene el proyecto. Esto afecta directamente los cálculos de flujo de efectivo.

La app sugiere automáticamente una plantilla base. Para proyectos de Instalación y Servicio carga la estructura del presupuesto de Monitoreo Cuervito — un presupuesto real que ya usó Geolis — como punto de partida.

### Paso 2 — Participantes (Áreas)

Se seleccionan las áreas que van a capturar costos. Cada área es responsable de su propia sección.

**¿Por qué esto es importante?** En un proyecto grande, Construcción no sabe cuánto va a gastar Logística, y SSPA no sabe cuánto necesita Mantenimiento. Al separar por área, cada responsable captura solo lo que conoce, y el sistema suma todo al final.

Para proyectos de Instalación y Servicio las áreas son las de campo: Operaciones, Construcción, Electricidad, SSPA, HPS, etc.

Para presupuestos de Departamento las áreas son internas: TI, Innovación y Tecnología, Finanzas.

### Paso 3 — Captura de costos

Cada área captura 4 tipos de costos:

#### CAPEX — Equipos e inversiones
Son los gastos que se hacen **una sola vez**, generalmente al inicio del proyecto.

Ejemplos del presupuesto real de Cuervito que ya viene precargado:
- Camionetas — 1 unidad × $550,000
- Sensores de presión — 360 unidades × $165
- Gateway — 180 unidades × $175
- Kit Starlink mini — 40 unidades × $277
- Workstation — 1 unidad × $1,800

> **Regla de negocio:** Todo lo que se compra y queda como activo de la empresa o del proyecto es CAPEX. En los estados financieros se deprecia, no se gasta directamente.

#### OPEX — Nómina y Mano de Obra
Es el costo real de las personas que trabajan en el proyecto, incluyendo todas las cargas sociales.

La app calcula automáticamente:
```
Costo real = Salario base × (1 + IMSS 32% + Prestaciones 40% + ISR 5%) × Cantidad de personas
```

Ejemplo: Especialista en telemetría con salario de $25,000/mes en realidad le cuesta a Geolis **$44,250/mes** porque hay que sumar IMSS, vacaciones, aguinaldo e ISR.

> **Por qué esto importa:** muchas empresas presupuestan solo el salario neto y se llevan la sorpresa cuando la nómina real es 77% más cara. Esta app lo calcula correctamente desde el inicio.

#### OPEX — Materiales
Gastos recurrentes mes a mes: combustible, insumos, servicios de telefonía, arrendamiento.

Ejemplos del presupuesto Cuervito:
- Servicio Starlink y radio — $66,000/mes
- Arrendamiento de inmuebles — $13,000/mes
- Insumos operativos — $2,700/mes
- Vehículos y combustible — $26,216/mes

#### OPEX — Viáticos
Hospedaje, alimentación, casetas y traslados del equipo en campo.

### Paso 4 — Resumen mensual

Aquí está el valor real de la app. El resumen traduce todo lo que se capturó en información financiera para tomar decisiones.

---

## Cómo leer el Resumen mensual para tomar decisiones

### Los 5 KPIs principales

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┐
│  INGRESOS   │    CAPEX    │    OPEX     │   EGRESOS   │   UTILIDAD      │
│  (factura.) │ (inversión) │ (operación) │   TOTALES   │   Y MARGEN      │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────────┘
```

**¿Qué me dice cada uno?**

- **Ingresos** — cuánto le vamos a facturar al cliente en el año. Si este número es cero, el proyecto no genera dinero (presupuesto interno).

- **CAPEX** — cuánta inversión inicial necesita el proyecto. Este dinero sale de golpe al inicio. Si es muy alto, puede representar un riesgo de liquidez.

- **OPEX** — cuánto cuesta operar el proyecto cada mes. Este número sale mes a mes durante toda la vida del contrato.

- **Egresos totales** — la suma de todo lo que sale: CAPEX + OPEX. Es lo que el proyecto le cuesta a Geolis.

- **Utilidad y margen** — lo que queda después de pagar todo. Si el margen es negativo, el proyecto está perdiendo dinero. Si es muy bajo (menos del 10-15%), hay que revisar los costos antes de firmar.

---

### Tabla SERVICIO — ¿Cuándo entra el dinero y cuándo sale?

Esta tabla responde la pregunta más importante en cualquier proyecto: **¿en qué meses tenemos más gastos que ingresos?**

```
         M0(Inst.) M1      M2      M3  ...  M12
INGRESOS    —    $6.4M   $6.4M   $6.4M     $6.4M
CAPEX     $906K    —       —       —          —
OPEX        —    $471K   $471K   $471K     $471K
EGRESOS   $906K  $471K   $471K   $471K     $471K
```

**Lectura:** En M0 (instalación) gastamos $906K en equipos y no cobramos nada. A partir de M1 empezamos a cobrar $6.4M y gastar $471K. El flujo se vuelve positivo desde el primer mes de operación.

> **Decisión de negocio:** Si los egresos de M0 son muy altos y la facturación tarda en llegar, el proyecto necesita financiamiento puente. Esto hay que negociarlo antes de arrancar.

---

### Tabla FLUJO — ¿El proyecto genera o consume caja?

```
         M0        M1       M2  ...
FLUJO    -$906K   +$5.9M   +$5.9M
ACUM.    -$906K   +$5.0M   +$10.9M
```

**Lectura:** En M0 la caja baja $906K. Desde M1 sube $5.9M por mes. El acumulado se vuelve positivo a partir de M1 y sigue creciendo.

> **Señal de alerta:** Si el flujo acumulado nunca se vuelve positivo, el proyecto es inviable financieramente. Si tarda muchos meses en recuperar la inversión, hay que renegociar los términos de facturación o reducir el CAPEX inicial.

---

### Gráfica I — Flujo de efectivo

Las barras muestran cuánto entra o sale **cada mes**:
- **Barra amarilla** = mes positivo (entra más de lo que sale)
- **Barra roja** = mes negativo (sale más de lo que entra — esto pasa en M0)

La línea muestra el saldo acumulado. Si la línea sube constantemente, el proyecto es sano. Si baja o se estanca, hay un problema.

> **Para el director:** esta gráfica es la respuesta visual a "¿este proyecto es buen negocio?". Si las barras son casi todas amarillas y la línea sube, es buen negocio.

---

### Gráfica II — OPEX por categoría

Muestra qué categorías de gasto son las más pesadas mes a mes.

**Cómo usarla para ajustar el presupuesto:**

1. Identifica las líneas más altas — esas son las categorías donde más se gasta
2. Pregunta: ¿ese gasto es necesario? ¿Se puede reducir?
3. Ajusta los montos en la captura y vuelve al resumen para ver el impacto

> **Ejemplo real del proyecto Cuervito:** la categoría más pesada es NOMINA Y ADICIONALES ($174K/mes). La segunda es SERV TELEFONÍA CELULAR Y RADIO ($66K/mes). Antes de firmar un contrato, estas dos categorías merecen una revisión detallada.

---

## Categorías contables — por qué importan

Cuando un usuario crea una categoría nueva (por ejemplo "silla de oficina"), la app pregunta: ¿a cuál categoría contable pertenece?

La respuesta correcta sería **INSUMOS DE OFICINA**.

**¿Por qué esto importa?** El área de contabilidad de Geolis clasifica todos los gastos en cuentas contables específicas. Si el presupuesto no usa las categorías correctas, los estados financieros no cuadran y la auditoría se complica.

Las 27 categorías macro contables vienen directamente del archivo de presupuesto real de Geolis y no se pueden modificar sin aprobación del área de finanzas.

---

## Funciones de gestión de presupuestos

### Editar un presupuesto en Borrador
Si el presupuesto todavía no se ha aprobado, cualquier usuario puede editarlo. Se regresa al paso 1 con todos los datos precargados. Los cambios se guardan sobre el mismo presupuesto.

### Clonar un presupuesto existente
Si vas a hacer un proyecto similar a uno anterior (por ejemplo, un nuevo proyecto de monitoreo parecido a Cuervito), puedes clonar ese presupuesto. Se crea una copia con todos los datos y partidas, que puedes modificar sin afectar el original.

> **Caso de uso real mencionado en la reunión:** "Perdiz tiene un alcance nuevo, necesito actualizar el presupuesto. Puedo clonar el de Perdiz anterior y ajustar las bombas adicionales."

### Exportar a PDF
Genera una versión imprimible del Resumen mensual con todas las gráficas y tablas. Útil para presentar al director o enviar al cliente.

### Exportar a Excel
Genera un archivo `.xlsx` con 4 hojas:
- **SERVICIO** — igual a la pestaña SERVICIO del Excel de Geolis
- **FLUJO** — igual a la pestaña FLUJO del Excel de Geolis
- **EGRESOS** — detalle de todas las partidas capturadas
- **INFO** — resumen ejecutivo del presupuesto

El Excel tiene formato de moneda (`$1,234,567.89`) en todas las celdas numéricas.

---

## ¿La app sirve para tomar decisiones? Sí, con estas capacidades actuales

| Pregunta de negocio | ¿La app la responde hoy? |
|---|---|
| ¿Cuánto cuesta este proyecto en total? | ✅ Sí — KPI Total egresos |
| ¿El proyecto es rentable? | ✅ Sí — KPI Utilidad y Margen% |
| ¿En qué meses necesitamos más caja? | ✅ Sí — Tabla SERVICIO y Gráfica I |
| ¿Cuándo recuperamos la inversión inicial? | ✅ Sí — Flujo acumulado |
| ¿Qué categoría de gasto es la más pesada? | ✅ Sí — Gráfica II |
| ¿Cuánto cuesta realmente cada puesto de nómina? | ✅ Sí — Tabla de nómina con fórmula |
| ¿Este proyecto es similar a uno anterior? | ✅ Sí — Clonar presupuesto |
| ¿Qué pasa si reduzco el CAPEX? | ✅ Sí — Editar y el resumen se actualiza en tiempo real |
| ¿Comparar dos presupuestos? | ⏳ Pendiente — próxima fase |
| ¿Comparar presupuestado vs ejecutado? | ⏳ Pendiente — requiere módulo de ejecución |
| ¿Multiusuario con roles y aprobaciones? | ⏳ Pendiente — requiere backend Django |
| ¿Guardar en servidor de la empresa? | ⏳ Pendiente — requiere migración a infraestructura Geolis |

---

## Lo que viene en la siguiente fase

1. **Backend Django + PostgreSQL** — los datos dejan de vivir en el navegador y se guardan en la base de datos de Geolis. Múltiples usuarios pueden trabajar sobre el mismo presupuesto sin pisarse.

2. **Autenticación y roles** — PM, Responsable de Área, Director. Cada rol ve solo lo que le corresponde y tiene permisos distintos.

3. **Flujo de aprobación** — Borrador → En revisión → Aprobado → Rechazado, con notificaciones al director.

4. **Comparativo presupuestado vs ejecutado** — conectar con el módulo de compras y nómina real para saber si el proyecto está dentro del presupuesto mes a mes.

5. **Vista de concentrado** — ver todos los proyectos activos en una sola pantalla, como el archivo CONCENTRADO VERACRUZ, pero en tiempo real.

---

## Glosario rápido

| Término | Qué significa en este contexto |
|---|---|
| **CAPEX** | Capital Expenditure — inversión en activos. Se gasta una sola vez. Ejemplo: camioneta, equipo de monitoreo. |
| **OPEX** | Operational Expenditure — gasto operativo recurrente. Se paga cada mes. Ejemplo: nómina, combustible, renta. |
| **M0** | Mes de instalación. Generalmente tiene CAPEX alto y cero facturación. |
| **Flujo efectivo** | Ingresos del mes menos egresos del mes. Puede ser negativo. |
| **Flujo acumulado** | Suma de todos los flujos desde M0 hasta el mes actual. Indica si el proyecto ya "pagó" su inversión. |
| **Margen** | Utilidad dividida entre ingresos, expresada en porcentaje. Un margen del 20% significa que por cada $100 facturados, $20 quedan como ganancia. |
| **Categoría contable** | Clasificación oficial de Geolis para registrar gastos en los estados financieros. Las usa el área de contabilidad. |

---

*GEOLIS SA DE CV — Guía de negocio interna — Módulo de Presupuestos v1.0 MVP — Julio 2026*
