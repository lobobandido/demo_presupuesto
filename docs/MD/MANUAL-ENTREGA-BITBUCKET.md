# Manual · Entrega del repo a Bitbucket

**Para:** Adolfo Ramírez — GEOLIS
**Escrito:** 11 de septiembre de 2026
**Sirve para:** preparar una copia limpia del módulo de presupuestos y subirla al
repo corporativo de Bitbucket, desde donde el equipo la migrará a Django.

Este documento es autocontenido. Se puede ejecutar en otra sesión, otro día, sin
haber leído la conversación en la que se decidió.

---

## Qué es esto y qué no es

| | |
|---|---|
| **Tu repo de GitHub** | Se queda **intacto**, con todo su historial, y sigue desplegando en Vercel. No se toca en ningún paso. |
| **La copia para Bitbucket** | Un **snapshot** de los archivos, sin historial de git, con un solo commit de importación inicial. |
| **Qué pasa después** | El equipo de la empresa la migra a Django. Por eso conviene dejarles datos y un README, no sólo código. |

Mover código a un repo corporativo con un commit de «importación inicial» es lo
normal: nadie espera que llegue el historial de trabajo personal de quien lo
construyó. Si alguien pregunta con qué herramientas se desarrolló, se dice y ya.

---

## ANTES DE EMPEZAR — dos condiciones

**1. La rama de gráficas tiene que estar fusionada a `main` y verificada.**
No se saca un snapshot de trabajo a medias. Comprueba:

```bash
cd ~/geolis-presupuestos
git checkout main
git log --oneline -1 origin/main
```

Ese hash debe incluir ya el trabajo de gráficas.

**2. El árbol de trabajo tiene que estar limpio.**

```bash
git status
```

Debe decir *«nada para hacer commit, el árbol de trabajo está limpio»*. Si aparecen
archivos de `docs/catalogo/` modificados, son re-guardados de LibreOffice, no
cambios reales:

```bash
git restore docs/catalogo/
```

---

## PASO 1 · Sacar el snapshot

`git archive` exporta los archivos **sin `.git` y sin historial**. Por eso no hay
nada que limpiar después, ni ramas, ni `.bak`, ni riesgo para el repo original.

```bash
cd ~
rm -rf geolis-bitbucket && mkdir geolis-bitbucket
cd ~/geolis-presupuestos
git archive main | tar -x -C ~/geolis-bitbucket
cd ~/geolis-bitbucket
ls -la
```

A partir de aquí **todo el trabajo ocurre en `~/geolis-bitbucket`**. El repo
original ya no se toca.

> **No uses `git clone`.** Un clon trae el historial completo, que es justo lo que
> no queremos arrastrar al repo corporativo.

---

## PASO 2 · Quitar lo que no va

```bash
cd ~/geolis-bitbucket
rm -rf .claude CLAUDE.md docs/MD
rm -f docs/SPEC-*.md
find . -name "*.bak" -delete
find . -name ".~lock.*#" -delete
find . -name ".DS_Store" -delete
```

**Cuidado: no borres `docs/` completo.** Hay que distinguir dos cosas:

| Se quita — bitácoras de proceso | **Se conserva — datos que el equipo necesita** |
|---|---|
| `docs/MD/ESTADO-ACTUAL.md` | `docs/catalogo/catalogo-articulos-completo.csv` (16,668 artículos) |
| `docs/SPEC-*.md` | `docs/catalogo/catalogo-grupos-subgrupos.csv` (342 subgrupos) |
| `CLAUDE.md`, `.claude/` | `docs/catalogo/referencia-rubros-subcuentas.csv` (18 rubros / 138 subcuentas) |
| | `docs/catalogo/mapeo-almacen-contable.csv` |
| | `docs/catalogo_contable_2027.csv` |

Esos CSV son el catálogo oficial validado contra el codificador. Si no van, el
equipo de Django tiene que volver a pedírselos a Anel y a rehacer la validación.

Verifica qué quedó:

```bash
ls -R docs/
```

---

## PASO 3 · Las credenciales — no te saltes esto

Subir una llave de Supabase a un repo corporativo es un incidente de seguridad
real, y mucho más grave que cualquier comentario.

```bash
cd ~/geolis-bitbucket
ls -la | grep -i env
grep -rn "supabase.co\|SUPABASE\|anon" src/ --include="*.js" --include="*.jsx" | head -20
cat .gitignore
```

Qué buscar:

- Un archivo `.env` o `.env.local` que se haya colado en el snapshot.
- La URL del proyecto y la llave anónima escritas directamente en
  `src/supabaseClient.js`.

Si aparecen, **sácalas antes del push.** Deja en su lugar un `.env.example` con
los nombres de las variables y sin valores:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

y asegúrate de que `.gitignore` incluya `.env` y `.env.local`.

---

## PASO 4 · Limpieza de comentarios

El criterio es sencillo y se sostiene solo: **la bitácora va en el control de
versiones, no en el archivo fuente.** Un comentario que dice «oculto el
2026-09-XX, pedido de Luis, Tarea 4» es una entrada de bitácora metida en el
código, y eso está mal escrito lo haya escrito quien lo haya escrito.

Qué se quita:

- Fechas entre paréntesis y nombres de personas
- «Tarea N», «Fase N.N», referencias a commits y a `App.jsx:línea`
- Bloques de comentario de tipo ensayo, de más de 6 o 7 líneas
- `console.error()` multilínea con pasos numerados dentro de los
  `if (import.meta.env.DEV) { ... }`

**Qué NO se quita.** Los comentarios que explican *por qué* algo está oculto o
desactivado le sirven al siguiente que abra el archivo. Recórtalos, no los borres:

```jsx
/* Oculto: duplicaba los totales del RESUMEN GENERAL.
   El dato sigue en la BD y en la exportación. Para reactivar, quitar el comentario. */
```

Eso dice qué, por qué y cómo revertirlo, sin fecha ni nombres. Es un buen
comentario.

Si usas un script de limpieza automática, córrelo sobre esta copia, nunca sobre el
repo original.

---

## PASO 5 · Verificar que nada se rompió

Un script de expresiones regulares sobre comentarios **puede romper código**: un
`//` dentro de una cadena —cualquier `https://`— o un `/*` dentro de un template
literal. Por eso este paso no es opcional.

```bash
cd ~/geolis-bitbucket
npm install
npm run build
npm run dev
```

Con la app corriendo, abre **PRC LITORAL-BECH** y comprueba:

1. Los cinco KPI del encabezado.
2. Las tres tablas: RESUMEN GENERAL, SERVICIO y FLUJO.
3. Las cuatro tarjetas de gráficas.
4. Exporta **Excel para Apps** y **Excel visual**, y compara los md5:

```bash
md5sum ~/Descargas/*.xlsx
```

Deben ser `432aa4f5…` y `611c65f5…`, los mismos de siempre. Si coinciden y el
build pasó, la limpieza no tocó nada que importe.

Si algo falla, borra `~/geolis-bitbucket` y vuelve al PASO 1. No hay nada que
recuperar: el original nunca se tocó.

---

## PASO 6 · El README para el equipo de Django

Es lo que más les va a servir y lo que mejor te luce. El contenido está en el
anexo al final de este documento; guárdalo como `README.md` en la raíz de
`~/geolis-bitbucket`.

---

## PASO 7 · Subir a Bitbucket

```bash
cd ~/geolis-bitbucket
git init
git add -A
git status          # revisa la lista ANTES de commitear
git commit -m "Importación inicial — módulo de captura de presupuestos"
git remote add origin <URL-DEL-REPO-DE-BITBUCKET>
git branch -M main
git push -u origin main
```

El `git status` antes del commit es la última oportunidad de ver si se coló un
`.env`, un `.bak` o un `node_modules`. Léelo.

Después del push, confirma que llegó:

```bash
git log --oneline -1 origin/main
```

---

## Lista de comprobación final

- [ ] Las gráficas están fusionadas a `main` y verificadas
- [ ] El snapshot se sacó con `git archive`, no con `git clone`
- [ ] No hay `.git` viejo, ni `.claude/`, ni `CLAUDE.md`, ni `docs/MD/`
- [ ] **Los CSV del catálogo sí van**
- [ ] **No hay ninguna credencial de Supabase en el árbol**
- [ ] `.gitignore` cubre `.env`, `.env.local` y `node_modules`
- [ ] `npm run build` pasa limpio
- [ ] Los dos Excel dan `432aa4f5…` y `611c65f5…`
- [ ] El `README.md` está en la raíz
- [ ] El repo de GitHub sigue intacto y Vercel sigue desplegando

---

## ANEXO · Contenido del README.md

```markdown
# Módulo de captura de presupuestos — GEOLIS

Aplicación web para capturar y consolidar los presupuestos anuales de las áreas
de instalación, servicio y por departamento.

## Stack actual

- React 18 + Vite
- Supabase (PostgreSQL + PostgREST + RLS)
- Excel generado en el navegador con `xlsx-js-style`
- Gráficas en SVG, sin dependencias externas

## Estructura

    src/App.jsx           toda la interfaz y los cálculos
    src/supabaseApi.js    TODO el acceso a datos pasa por aquí
    src/supabaseClient.js cliente de Supabase
    docs/catalogo/        catálogo de almacén y catálogo contable (CSV)

## Lo más importante para migrar a Django

**`supabaseApi.js` es la costura.** Todo el acceso a datos de la aplicación pasa
por ese archivo. Eso convierte la migración en reescribir un archivo, no seis mil
líneas de interfaz.

Y **Supabase es PostgreSQL**: la base no se migra, se hace `pg_dump` y se
restaura. Lo que se sustituye es la capa PostgREST que hoy hace de API.

### Etapas sugeridas

| # | Etapa | Qué se hace | Días |
|---|---|---|---|
| 1 | Blindar la costura | Verificar que no quede ninguna llamada a `supabase.` fuera de `supabaseApi.js` | 1 |
| 2 | Modelos | `pg_dump` → restaurar → `manage.py inspectdb` → limpiar a mano | 2–3 |
| 3 | API | Django REST Framework, un ViewSet por tabla, **con los mismos nombres de campo** que hoy, más los endpoints de negocio: exportar, importar, resumen | 5–7 |
| 4 | Cambiar la costura | `supabaseApi.js` → `api.js` apuntando a Django. Un solo archivo tocado; el front no se entera | 2 |
| 5 | Autenticación | Django trae usuarios, grupos y permisos de fábrica | 3–5 |

### Lo que se gana

- **Usuarios reales.** Hoy no hay autenticación: las políticas RLS son
  `public_all USING(true)`, o sea que quien tiene la liga entra y edita. Con
  varios capturistas en paralelo eso es un riesgo, no una incomodidad.
- **Excel en el servidor.** `openpyxl` escribe estilos sin librería bifurcada, y
  `xlwt` genera el `.xls` BIFF8 que pide contabilidad, de forma nativa.
- **El importador donde debe estar.** Procesar un Excel de miles de renglones en
  el navegador es frágil; en el servidor es `pandas.read_excel` + `bulk_create`.

### Antes de arrancar hay que decidir

1. **¿Los cálculos se quedan en el front o se van al servidor?**
   Hoy `distribuirOpex`, `calcularSerieMensual`, `macroDeCategoria`,
   `serieACalendario` y `emitirPorRubro` viven en `App.jsx`. Conviene moverlos,
   porque el importador y el comparativo real los van a necesitar del lado
   servidor — pero como **fase 2**, no durante la migración. Mover cálculo y
   cambiar backend a la vez es la receta para no saber qué se rompió.
2. **¿El front sigue en Vercel o lo sirve Django?**
3. **`App.jsx` con más de 6,000 líneas.** Hay que partirlo por pantallas, pero
   antes o después de la migración, nunca durante.

## Catálogos

`docs/catalogo/` trae el catálogo de almacén oficial, validado contra el
codificador de la empresa:

- 44 grupos, 342 subgrupos, 16,668 artículos
- El catálogo contable: 18 rubros, 138 subcuentas
- `mapeo-almacen-contable.csv` — la traducción entre ambas taxonomías, pendiente
  de que contabilidad la complete

Las dos taxonomías son independientes: el almacén clasifica por
grupo → subgrupo → artículo, y contabilidad por rubro → subcuenta. No hay puente
automático entre ellas; los nombres coinciden en 2 de 64 casos.
```
