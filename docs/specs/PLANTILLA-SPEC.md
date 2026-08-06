# Plantilla — Spec de cambio

Copiar esta plantilla al crear un spec nuevo en `docs/`. Llenar las seis secciones; ninguna es
opcional. Si una sección queda vacía, es señal de que el spec no está listo para implementarse.

---

## Problema observado

Qué está pasando hoy, con evidencia concreta (captura, número, cita textual del cliente). No
"algo no cuadra" — el número exacto, la pantalla exacta, el paso exacto para reproducirlo.

## Comportamiento esperado

Qué debería pasar en su lugar, con el mismo nivel de concreción: el número correcto, la pantalla
correcta, el rótulo correcto. Si hay un Excel o cálculo de referencia, citarlo aquí.

## Archivos y funciones tocadas

Lista explícita de qué se va a abrir. Si alguna de las funciones de la lista de "no abrir sin
motivo explícito" de `CLAUDE.md` está aquí, decirlo — es la señal de que el cambio necesita
verificación numérica antes/después, no solo `npm run build`.

## Riesgo de regresión

Qué otras pantallas, cálculos o exportaciones podrían moverse como efecto colateral de este
cambio. Si la respuesta es "ninguno", justificar por qué (ej. el cambio es puramente de rótulo/
navegación y no toca ninguna función de cálculo).

## Criterio de aceptación verificable

Cómo se sabe que el cambio quedó bien, en términos de números o pantallas concretas — no "se ve
bien". Si el cambio toca cálculo, incluir aquí los KPIs/celdas de referencia antes y después
(ver skill `verificar-regresion`).

## Caminos de UI a recorrer a mano

Lista exacta de clics/pantallas que el usuario debe recorrer para confirmar el cambio en
navegador. Recordar: ninguna prueba automatizada corre esto — es una lista para que el usuario
la seleccione a mano.
