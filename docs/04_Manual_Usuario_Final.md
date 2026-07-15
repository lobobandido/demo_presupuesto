# Manual de Usuario Final — Módulo de Presupuestos GEOLIS
**Para:** cualquier persona que vaya a capturar o revisar un presupuesto en la app | **Versión:** MVP

> Este manual explica **cómo usar la app, pantalla por pantalla**. Si buscas cómo leer el Resumen mensual para tomar decisiones de negocio (KPIs, márgenes, flujo de efectivo), revisa `02_Guia_Negocio_Toma_Decisiones.md`. Si quieres ver un ejemplo completo capturado de principio a fin, revisa `docs/Guia_Crear_Presupuesto_Cuervito.md`.

---

## 1. ¿Qué es esta app?

Es el módulo digital donde Geolis captura sus presupuestos de proyecto (instalación, servicio, departamento o suministro), en vez de hacerlo en un Excel en blanco. Guarda todo en la nube (Supabase), así que lo que capturas queda disponible la próxima vez que entres, desde cualquier computadora.

---

## 2. Navegación general

Del lado izquierdo siempre ves el mismo menú, con 5 pasos:

| Paso | Nombre | Qué haces ahí |
|---|---|---|
| — | **Presupuestos** | Lista de todos tus presupuestos guardados — aquí entras a uno existente, lo eliminas, o creas uno nuevo |
| 1 | **Info general** | Nombre del proyecto, empresa, fechas, tipo |
| 2 | **Áreas** | Quién participa (Operaciones, Construcción, TI, etc.) |
| 3 | **Capturar costos** | CAPEX, Nómina, Materiales, Viáticos por cada área |
| 4 | **Resumen mensual** | Tablas, gráficas y KPIs calculados automáticamente |

Un círculo con palomita ✓ en el menú indica un paso ya completado. Un punto amarillo indica el paso en el que estás parado.

En celular o tablet el menú se colapsa a solo íconos para ahorrar espacio — sigue funcionando igual, solo toca el ícono correspondiente.

---

## 3. Crear un presupuesto nuevo

Desde la pantalla **Presupuestos**, botón **+ Nuevo presupuesto**. Ahí eliges una de tres formas de arrancar:

### 3.1 Iniciar desde cero
Empiezas con todo vacío. Úsalo cuando el proyecto no se parece a ninguno anterior.

### 3.2 Partir de un presupuesto anterior
Eliges un presupuesto ya guardado **del mismo tipo** (instalación, servicio, departamento o suministro — el buscador solo te muestra los de tu mismo tipo) y se copian todas sus áreas y partidas como punto de partida. Modificas solo lo que cambia (precios, cantidades, fechas) y guardas como un presupuesto nuevo — el original no se toca.

> Úsalo para: "Perdiz tiene un alcance nuevo, necesito un presupuesto parecido al anterior pero con bombas adicionales."

### 3.3 Clonar desde la lista
En la pantalla **Presupuestos**, cada fila tiene un botón para clonar ese presupuesto directamente (sin pasar por el asistente de "Nuevo presupuesto"). Hace lo mismo que la opción 3.2, pero más rápido cuando ya sabes exactamente cuál quieres copiar.

---

## 4. Paso 1 — Info general

| Campo | Notas |
|---|---|
| Nombre del proyecto | Libre |
| Empresa | Por defecto GEOLIS SA DE CV |
| Tipo | **Instalación** / **Servicio** (generan ingresos) · **Departamento** / **Suministro** (gasto interno, sin ingresos) |
| Fecha inicio | Define el mes de instalación (**M0**) |
| Fecha fin | Define cuántos meses dura el proyecto (hasta M12) |
| Fecha elaboración | Cuándo se está armando el presupuesto (por defecto, hoy) |

> **Importante:** la fecha de inicio es la referencia contra la que se calculan todas las distribuciones mensuales de CAPEX y OPEX más adelante — no la cambies después de haber capturado costos, o los meses se recalculan.

---

## 5. Paso 2 — Áreas / Participantes

Marca qué áreas van a capturar costos en este presupuesto (Operaciones, Construcción, Electricidad, SSPA, HPS, TI, Finanzas, etc., según el tipo de proyecto). Cada área capturará sus propios costos por separado en el paso 3, y el sistema los suma todos en el Resumen.

---

## 6. Paso 3 — Capturar costos

Para cada área seleccionada verás 4 secciones: **CAPEX**, **OPEX · Nómina**, **OPEX · Materiales**, **OPEX · Viáticos**.

### 6.1 CAPEX — Equipos e inversiones
Compras únicas (equipos, vehículos, activos). Por cada partida capturas Categoría, Descripción, Unidad, Cantidad, **Fecha de compra real** (mes y año) y Monto unitario.

> La fecha de compra es la que decide en qué mes del proyecto aparece ese gasto en el Resumen — si compras algo en el mes 4 del proyecto, ahí es donde va, no se reparte entre todos los meses.

### 6.2 OPEX · Nómina y Mano de Obra
Por cada puesto: salario, cantidad de personas, y **tipo de personal**:
- **Fijo** → su costo se repite todos los meses del proyecto, automáticamente
- **Contrato / Outsourcing** → defines cuántos meses dura el contrato y desde qué mes arranca; el sistema solo lo carga en esos meses

El sistema calcula el costo real (salario + IMSS + prestaciones + ISR) automáticamente, no captures esas cargas a mano.

### 6.3 OPEX · Materiales y Viáticos
Gastos recurrentes. Por cada partida defines:
- **Periodicidad**: mensual, bimestral, trimestral, semestral o anual
- **Mes de inicio**: eliges un mes/año de calendario real (igual que en CAPEX) y el sistema calcula automáticamente en qué mes del proyecto arranca

> Ejemplo: una renta anual de $430,000 que solo se paga una vez al año debe ir con periodicidad **Anual**, no Mensual — si la pones mensual, la app la va a repetir los 12 meses y el total quedará 12 veces más alto de lo real.

### 6.4 Cómo funciona el campo Categoría
Al escribir en **Categoría** pasa esto:

1. Si eliges una opción de la lista fija (las categorías más comunes de CAPEX u OPEX), listo.
2. Si escribes algo nuevo, aparece **"Crear categoría..."** — al confirmar, si el texto no coincide con ninguna de las 27 categorías contables oficiales de Geolis, se abre una ventana preguntando **"¿A qué categoría contable pertenece?"**. Eliges una (o "No sé / Dejar sin categoría contable"), y la próxima vez que escribas ese mismo texto ya no te preguntará — queda memorizado.
3. Mientras escribes, aparecen dos cajas de sugerencias debajo:
   - **Sugerencias del historial** — partidas que tú mismo ya capturaste antes en otros presupuestos
   - **Artículos del almacén** — artículos reales del catálogo de almacén de Geolis (busca por palabra en la descripción); si eliges uno, se llenan Descripción y Unidad automáticamente

> Las 27 categorías contables oficiales no se pueden modificar libremente — vienen directamente del área de finanzas de Geolis.

### 6.5 Guardar
Botón **Guardar** (verde, abajo a la derecha de cada área). Aparece la notificación "✓ Costos guardados". Puedes ir y volver entre áreas y guardar cada una por separado, no es necesario terminar todo de un jalón.

---

## 7. Paso 4 — Resumen mensual

Aquí se ve todo lo capturado convertido en tablas financieras: KPIs (Ingresos, CAPEX, OPEX, Egresos totales, Utilidad y Margen), la tabla SERVICIO, la tabla FLUJO, y dos gráficas. Para aprender a **interpretar** estos números y tomar decisiones de negocio con ellos, ve `02_Guia_Negocio_Toma_Decisiones.md` — ahí está explicado a fondo.

Dos avisos que puedes ver aquí y qué significan:

| Aviso | Qué significa | Qué hacer |
|---|---|---|
| ⚠ N partidas sin fecha de compra | Alguna partida CAPEX no tiene mes/año capturado — se está contando en M0 por defecto | Ve a Capturar costos y completa la fecha real |
| ⚠ N partidas sin categoría contable asignada | Alguna partida quedó sin mapear a una de las 27 categorías oficiales (elegiste "No sé" o nunca la confirmaste) | Ve a Capturar costos, vuelve a escribir esa categoría y confírmala en la ventana de mapeo |

### Ingresos
Dos formas de capturarlos:
- **Precio fijo mensual** — si el cliente paga lo mismo todos los meses, captura un solo monto y se multiplica automáticamente
- **Ingresos adicionales** — para meses con montos distintos (ej. facturación variable), agrega uno por uno con su mes, año, descripción y monto

---

## 8. Exportar

- **Excel** — genera un `.xlsx` con hojas SERVICIO, FLUJO, EGRESOS (detalle de partidas) e INFO (resumen ejecutivo), con formato de moneda.
- **PDF** — genera una versión imprimible del Resumen mensual completo (tablas y gráficas), útil para presentar al director o enviar al cliente.

---

## 9. Gestionar presupuestos existentes

En la lista de **Presupuestos**, cada fila tiene botones para:
- **Abrir** — retoma la edición donde la dejaste
- **Clonar** — crea una copia (ver 3.3)
- **Eliminar** — borra el presupuesto permanentemente, de la app y de la base de datos. **Esta acción no se puede deshacer** — la app pide confirmación antes de borrar.

---

## 10. Uso en celular / tablet

La app es responsive: en pantallas angostas, las tablas con muchas columnas (partidas, meses) se pueden deslizar horizontalmente con el dedo — busca la sombra en el borde derecho de la tabla, indica que hay más columnas si sigues deslizando.

---

## 11. Preguntas frecuentes

**¿Por qué mi gasto anual aparece 12 veces más alto de lo que debería?**
Revisa la periodicidad de esa partida — probablemente está en "Mensual" cuando debería ser "Anual" (ver 6.3).

**¿Por qué todo mi CAPEX aparece en el primer mes?**
Revisa que cada partida tenga su fecha de compra real capturada (mes y año) — sin fecha, cae en M0 por defecto (ver 6.1).

**Escribí una categoría y no me dejó guardarla sin elegir algo, ¿es un error?**
No — es intencional. Si no reconoces a qué categoría contable pertenece, elige "No sé / Dejar sin categoría contable"; el presupuesto se guarda igual, solo aparecerá marcado en el aviso del Resumen para revisarlo después.

**¿Puedo perder mi trabajo si cierro el navegador sin guardar?**
La app guarda automáticamente en tu navegador mientras capturas, pero para que quede disponible en la nube (y en otras computadoras) siempre da clic en **Guardar** en cada área antes de salir.

---

## 12. Ver también

- `02_Guia_Negocio_Toma_Decisiones.md` — cómo interpretar el Resumen mensual para tomar decisiones
- `docs/Guia_Crear_Presupuesto_Cuervito.md` — ejemplo real completo, capturado de principio a fin
- `01_Bitacora_Tecnica_Cambios.md` — historial técnico de cambios (para el equipo de desarrollo)

---

*GEOLIS SA DE CV — Manual de usuario — Módulo de Presupuestos*
