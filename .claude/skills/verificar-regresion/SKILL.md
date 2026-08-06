---
name: verificar-regresion
description: Protocolo de verificación para cambios que tocan cálculo, distribución, agrupación, exportación o cualquier cosa que produzca un número (KPIs, tabla SERVICIO/FLUJO, Excel exportado). Úsalo antes y después de tocar distribuirOpex, distribuirNomina, mesIndexCapex, calcularNumMesesOp, calcularSerieMensual, construirFilasServicio, exportarExcel, guardarArea, guardarPres, totalCat, totalNom, totalOpexAnualCat, o cualquier función que alimente un monto en pantalla.
---

# Verificar regresión antes de tocar un cálculo

`npm run build` limpio **no es evidencia** de que un cambio de cálculo funciona. No hay tipado en
este proyecto: una variable eliminada que sigue usándose en otro lado compila sin error y truena
solo al hacer clic. La única verificación real es numérica, antes y después.

## Regla dura, sin excepción

**Ninguna prueba automatizada escribe en Supabase.** Nada de Playwright/Puppeteer creando,
editando o borrando registros — esa fue la causa exacta de la pérdida de datos del 6 de agosto.
Todo lo de este protocolo se hace con **lecturas GET** (API REST o la UI ya cargada) y con
**pruebas manuales en navegador que hace el usuario**, no el agente.

## Procedimiento

1. **Antes del cambio:**
   - Abrir un presupuesto con datos reales (no vacío).
   - Anotar los cinco KPIs de Resumen mensual: Ingresos, CAPEX, OPEX, Total egresos, Utilidad
     y margen.
   - Exportar el Excel y guardar la hoja SERVICIO como referencia (celda por celda, no solo los
     totales visibles).

2. **Hacer el cambio.**

3. **`npm run build` limpio.** Necesario, no suficiente — pasa a los pasos siguientes igual.

4. **Después del cambio:**
   - Volver a anotar los cinco KPIs del mismo presupuesto.
   - Volver a exportar el Excel.
   - Comparar la hoja SERVICIO **celda por celda** contra la referencia del paso 1.

5. **Si algo se movió:** detenerse y pedir reversión. No "arreglarlo sobre la marcha" ni asumir
   que el movimiento es un efecto secundario esperado — si no estaba en el criterio de aceptación
   del cambio, es una regresión hasta que se demuestre lo contrario.

6. **Reportar los dos momentos**, no un "sí coinciden" — los números de antes y después, pegados,
   para que quien lea el reporte pueda verificar sin repetir el trabajo.

## Qué SÍ cuenta como evidencia

- Números de KPIs y celdas de Excel, de antes y de después, comparados explícitamente.
- Lectura de código que traza la línea completa desde el dato capturado hasta el número mostrado
  (mismo criterio que usa el agente `auditor-montos`).
- Verificación manual en navegador hecha por el usuario.

## Qué NO cuenta como evidencia

- `npm run build` limpio, solo.
- "Debería funcionar" sin haber corrido el número real.
- Una prueba automatizada de navegador — está prohibida contra Supabase de producción, y no la
  reemplaza este protocolo: quien prueba en navegador es el usuario.
