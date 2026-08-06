## Cambios de comportamiento

Registro de cambios intencionales que alteran resultados numéricos respecto a versiones
anteriores de la app — para no confundirlos con regresiones al comparar contra un Excel viejo
o un cálculo hecho a mano.

### `imss`/`prestaciones`/`isr` en nómina: `||` → `??` (2026-08-06, commit `4e4d6e8`)

**Antes:** `distribuirNomina`, `NominaTable`, `totalNom` y `exportarExcel` armaban el factor de
carga social con `(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR)`. Como `0` es falsy en
JavaScript, capturar `0` en cualquiera de esos tres campos hacía que el cálculo usara el valor por
omisión (imss 0.32, prestaciones 0.40, isr 0.05) en vez del cero capturado.

**Ahora:** el mismo factor usa `??` en vez de `||` para esos tres campos exclusivamente
(`p.cantidad||1` y `p.salario||0` no cambiaron — ahí el cero sí debe caer al valor por omisión).
Un `0` capturado se respeta tal cual.

**Efecto:** si algún puesto de nómina ya guardado tiene `0` explícito en `imss`, `prestaciones` o
`isr`, su costo mensual/anual y el Excel exportado van a dar un número **menor** que antes de este
cambio — es el comportamiento correcto, no una regresión. Puestos con los tres campos en sus
valores por omisión (0.32/0.40/0.05) dan exactamente el mismo resultado que siempre, porque `||` y
`??` solo difieren cuando el valor es `0`, `""`, `NaN` o `false`.
