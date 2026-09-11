# SPEC 07 · GRÁFICAS

Punto 7 del backlog: rediseño de las gráficas del Resumen (vista Ver). Versionada
el 2026-09-11 para que no vuelva a faltar. Las decisiones tomadas antes de codificar
van al final (sección 8).

## 1 · Qué se retira

- «OPEX por categoría — líneas por categoría contable mes a mes» (`CatLinesChart`,
  hasta ~50 series en un plano).
- «Flujo de efectivo» en su forma actual (`FlowChart`: barras del flujo mensual y
  línea del acumulado en el mismo plano, con eje simétrico ±máximo que aplasta las
  barras).

Los dos componentes se quitan de `GraficasPresupuesto`; su código queda definido
en `src/App.jsx` sin consumidor.

## 2 · Qué se construye

Cuatro tarjetas, una métrica cada una. Todas leen series YA calculadas por
`calcularSerieMensual` y `construirFilasServicio`; ninguna recalcula nada.

## 3 · Reglas que no se negocian

- Nunca dos escalas ni dos ejes Y en un plano.
- Máximo 8 series de color; la novena entra en «Otros».
- El color sigue a la entidad, no a su posición.
- Paleta en orden fijo, sin ciclar (sección 5).
- Leyenda siempre con 2+ series; ninguna con una sola. Con 4 o menos, además
  etiqueta directa sobre la marca.
- Texto en tinta normal (`C.grayMid`), nunca del color de la serie.
- Eje y etiqueta de barra abreviados ($75.3M). Tooltip con la cifra completa (`fmt`).
- Tooltip obligatorio en toda marca.

## 4 · Las cuatro tarjetas

### TARJETA 1 · Ingresos vs Egresos por mes
- Forma: barras agrupadas, dos por mes. Series: `mIngresos` y `mEgresos`.
- Mismas unidades, misma escala: aquí sí van juntas.
- Leyenda presente + etiqueta directa encima de cada barra.
- Colores: Ingresos `#2E6FD0`, Egresos `#C4571C`.
- Etiquetas a dos alturas dentro de cada mes (ajuste 2026-09-11): la de Ingresos
  más arriba de su barra, la de Egresos más pegada a la suya. Alternan alto/bajo a
  lo largo del eje y separan también las de meses vecinos. No se baja la fuente.

### TARJETA 2 · Flujo mensual
- Forma: barras, una por mes, UNA serie con polaridad. Serie: `mFlujo`.
- Oro `#B0870A` si el mes es positivo, rojo `#9E3A2E` si es negativo.
- Sin leyenda. Línea del cero visible y etiquetada.
- Etiqueta de valor sobre cada barra; las negativas, debajo.

### TARJETA 3 · Flujo acumulado
- Forma: línea con área tenue debajo, UNA serie, EJE PROPIO. Serie: `mFlujoAcum`.
- Color `#2E6FD0`. Marcadores de 8 px o más en cada mes.
- Etiqueta directa sólo en el primer y el último punto.
- Esta tarjeta es la corrección de fondo: separada de la 2, la escala vuelve a ser
  la del flujo mensual y los −$26.7M de febrero se ven.

### TARJETA 4 · Egresos por rubro — los ocho mayores
- Forma: barras HORIZONTALES, de mayor a menor. Fuente: `filasServicio`.
- Horizontales porque los nombres son largos (SERV TELEFONIA CELULAR Y RADIO).
- Los 8 rubros con más dinero en el año; el resto sumado en «Otros», gris `#8A8A85`.
- **Un solo color para las ocho barras de rubro: `#C4571C`**, el mismo de Egresos en
  la tarjeta 1 (ajuste 2026-09-11). Con el nombre pegado a cada barra el color no
  carga identidad, y así no hay color-por-posición (el rubro más grande no cambia de
  color de un presupuesto a otro). «Otros» sigue en `#8A8A85` y ⚠ SIN CATEGORÍA en
  `#B3261E`.
- SIN CATEGORÍA aparte, al final, según la decisión 8.2b.
- Etiqueta de valor al final de cada barra. Sin leyenda: cada barra lleva su nombre.

SE RETIRAN: `FlowChart` (2457) y `CatLinesChart` (2528) de `GraficasPresupuesto`.

## 5 · Paleta (orden fijo, sin ciclar)

| # | Color |
|---|---|
| 1 | `#B0870A` |
| 2 | `#2E6FD0` |
| 3 | `#C4571C` |
| 4 | `#1F8FA8` |
| 5 | `#7B4BC7` |
| 6 | `#15794E` |
| 7 | `#E0678F` |
| 8 | `#9E3A2E` |
| «Otros» | `#8A8A85` |
| alerta SIN CATEGORÍA | `#B3261E` (NO es color de serie) |

Validada: banda de luminosidad, piso de croma, separación para daltonismo (peor par
ΔE 9.9) y contraste ≥3:1 contra fondo claro. No la cambies.

## 6 · Construcción

- Líneas 2 px. Marcadores ≥8 px.
- Extremos de barra redondeados 4 px sólo del lado del dato, base pegada al eje.
- 2 px de separación entre barras adyacentes.
- Eje y etiqueta sobre barra: abreviado ($75.3M). `<title>`: cifra completa con `fmt`.
- Nunca etiquetar cada punto de una línea.
- Texto en `C.grayMid`, nunca del color de la serie.
- Las cuatro tarjetas conservan la clase `chart-card` para el PDF.

## 7 · Verificación — en PRC LITORAL-BECH y en Cuervito

1. Ninguna gráfica tiene dos escalas ni dos ejes Y.
2. Ninguna pasa de 8 series de color más «Otros».
3. Los colores salen de la paleta, en orden, sin repetir tono.
4. Con 2+ series hay leyenda; con una sola no la hay.
5. Cada barra lleva su valor visible; cada marca responde con la cifra completa.
6. CRITERIO DURO: el flujo de febrero de PRC LITORAL-BECH (−$26,721,991.06) se ve
   como una barra roja de tamaño legible, no como una lasca de dos píxeles.
7. Los cinco KPI, las tres tablas y los dos Excel salen idénticos (md5 igual).
8. Las cuatro tarjetas salen completas en el PDF.

## 8 · Decisiones tomadas antes de codificar (2026-09-11)

1. **Librería:** ninguna. SVG a mano, sin dependencia nueva. Cuatro componentes nuevos
   junto a los actuales, mismo patrón (`viewBox` fijo, ancho 100%, texto en
   `C.grayMid`), tooltip con `<title>` en cada marca.
2. **Tarjeta 4:**
   - a) El total por rubro se toma de la fila `subtotal` si existe y, si no, de la
     fila `detalle` con su `macro` (caso `esUnaSolaIgualAMacro`: un rubro con una
     sola subcuenta que se llama igual que él no genera subtotal).
   - b) SIN CATEGORÍA **no entra al top 8 ni se mezcla en «Otros»**. Va aparte,
     siempre al final, rotulada «⚠ SIN CATEGORÍA» y en rojo de alerta `#B3261E`, que
     no es color de serie. Sólo se dibuja si su total es distinto de cero. Razón: es
     una alarma de captura, no una categoría de gasto; enterrarla en «Otros» esconde
     justo lo que hay que ver.
3. **`catOpexSeries`** se deja intacto dentro de `calcularSerieMensual` (función
   protegida por la regla 4 de CLAUDE.md), con un comentario que dice que quedó sin
   consumidor tras este rediseño, para que nadie lo borre ni lo reviva por error.

## NO SE TOCA

Cálculos, distribución mensual, Tabla FLUJO, los tres exportadores, la base de datos.
