-- crear_catalogo_subgrupos_articulos.sql — 2026-09-10
-- PASO 1 del Bloque 2A: DOS TABLAS NUEVAS para el codificador oficial de almacén.
-- No toca catalogo_almacen (sus 500 registros de semilla siguen intactos) ni
-- ninguna otra tabla existente. Hoy nadie lee estas dos tablas: el buscador que
-- las use se hace después, cuando estén cargadas y revisadas.
--
-- Por qué dos tablas: hay 342 subgrupos pero solo 233 artículos, porque de
-- materiales todavía no existe el detalle. En una sola tabla, los 312 subgrupos
-- de materiales quedarían invisibles.
--
-- Después de correr esto: scripts/carga_catalogo_subgrupos.sql y
-- scripts/carga_catalogo_articulos.sql (solo INSERT).

create table if not exists catalogo_subgrupos (
  id uuid primary key default uuid_generate_v4(),
  grupo text not null,
  nombre_grupo text not null,
  subgrupo text not null,
  nombre_subgrupo text not null,
  unidad_medida text,
  rubro_contable text,          -- NULL hasta que Anel devuelva el mapeo
  subcuenta_contable text,      -- NULL hasta que Anel devuelva el mapeo
  created_at timestamptz default now(),
  unique (grupo, subgrupo)
);

create table if not exists catalogo_articulos (
  id uuid primary key default uuid_generate_v4(),
  codigo_articulo text not null unique,
  grupo text not null,
  subgrupo text not null,
  descripcion text not null,
  unidad_medida text,
  created_at timestamptz default now()
);

alter table catalogo_subgrupos enable row level security;
alter table catalogo_articulos enable row level security;
create policy public_all on catalogo_subgrupos for all using (true) with check (true);
create policy public_all on catalogo_articulos  for all using (true) with check (true);
grant all on catalogo_subgrupos to anon, authenticated, service_role;
grant all on catalogo_articulos  to anon, authenticated, service_role;
