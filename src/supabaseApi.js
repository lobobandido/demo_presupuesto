import { supabase } from "./supabaseClient";

// ─── Mapeo camelCase (app) ↔ snake_case (Supabase) ──────────────────────────

function presToRow(form, precioFijo){
  return {
    nombre: form.nombre||"",
    empresa: form.empresa||"GEOLIS SA DE CV",
    tipo: form.tipo||"instalacion",
    estado: form.estado||"Borrador",
    fecha_inicio: form.fechaInicio||null,
    fecha_fin: form.fechaFin||null,
    fecha_elaboracion: form.fechaElaboracion||null,
    precio_fijo: precioFijo||0,
  };
}
function capexToRow(p){
  return {
    categoria: p.cat||"", descripcion: p.desc||"", unidad: p.unidad||"Unidad",
    cantidad: p.cantidad||0, monto: p.monto||0,
    mes_gasto_mes: p.mesGastoMes ? parseInt(p.mesGastoMes) : null,
    mes_gasto_anio: p.mesGastoAnio ? parseInt(p.mesGastoAnio) : null,
  };
}
function opexToRow(p){
  return {
    categoria: p.cat||"", descripcion: p.desc||"", unidad: p.unidad||"Servicio",
    cantidad: p.cantidad||0, monto: p.monto||0,
    periodicidad: p.periodicidad||"mensual",
    mes_inicio_opex: p.mesInicioOpex||1,
  };
}
function nominaToRow(p){
  return {
    puesto: p.puesto==="Otro" ? (p.puestoCustom||"Otro") : (p.puesto||""),
    tipo_personal: p.tipoPersonal||"fijo",
    cantidad: p.cantidad||1,
    salario: p.salario||0,
    imss: p.imss??F_IMSS_DEFAULT, prestaciones: p.prestaciones??F_PREST_DEFAULT, isr: p.isr??F_ISR_DEFAULT,
    meses_contrato: p.mesesContrato||12,
    mes_inicio: p.mesInicio||1,
  };
}
const F_IMSS_DEFAULT=0.32, F_PREST_DEFAULT=0.40, F_ISR_DEFAULT=0.05;

// ─── LISTAR ──────────────────────────────────────────────────────────────────
export async function listarPresupuestos(){
  if(!supabase) return [];
  const {data, error} = await supabase.from("presupuestos")
    .select("id,nombre,empresa,tipo,estado,fecha_inicio,fecha_fin,updated_at")
    .order("updated_at",{ascending:false});
  if(error){ console.error("[supabase] listarPresupuestos:", error.message); return []; }
  return (data||[]).map(r=>({
    id:r.id, nombre:r.nombre, empresa:r.empresa, tipo:r.tipo, estado:r.estado,
    fecha:r.fecha_inicio, fechaInicio:r.fecha_inicio, fechaFin:r.fecha_fin,
    _remoto:true,
  }));
}

// ─── ELIMINAR (borra el presupuesto y, por cascada, sus áreas/partidas) ─────
export async function eliminarPresupuestoDeNube(id){
  if(!supabase) return {ok:false, error:"Supabase no configurado"};
  const {error} = await supabase.from("presupuestos").delete().eq("id", id);
  if(error){ console.error("[supabase] eliminarPresupuesto:", error.message); return {ok:false, error:error.message}; }
  console.log("[supabase] presupuesto eliminado:", id);
  return {ok:true};
}

// ─── CATÁLOGO DE ALMACÉN (búsqueda para autocompletar Categoría en CAPEX/OPEX) ─
export async function buscarArticulosAlmacen(query){
  if(!supabase || !query || query.trim().length<3) return [];
  const q = query.trim().replace(/[%_,()]/g,"");
  // Cada palabra debe aparecer en la descripción (AND) — así "tubo acero" encuentra
  // "TUBO DE ACERO AL CARBON..." aunque no sea una frase contigua — o el texto
  // completo puede matchear directo el grupo o el código del artículo.
  const palabras = q.split(/\s+/).filter(Boolean);
  if(palabras.length===0) return [];
  const descAnd = palabras.map(w=>`descripcion.ilike.%${w}%`).join(",");
  const filtro = `and(${descAnd}),nombre_grupo.ilike.%${q}%,codigo_articulo.ilike.%${q}%`;
  const {data,error} = await supabase.from("catalogo_almacen")
    .select("codigo_articulo,descripcion,unidad_medida,nombre_grupo")
    .or(filtro)
    .limit(6);
  if(error){ console.error("[supabase] buscarArticulosAlmacen:", error.message); return []; }
  return data||[];
}

// ─── GUARDAR (crea o reemplaza por completo el presupuesto en la nube) ──────
export async function guardarPresupuestoEnNube({pres, form, areas, costos, ingAdicionales, precioFijo}){
  if(!supabase) return null;
  const row = presToRow(form||pres||{}, precioFijo);
  const idExistente = pres && typeof pres.id==="string" ? pres.id : null;
  console.log(`[supabase] guardarPresupuestoEnNube: ${idExistente?"UPDATE existente "+idExistente:"INSERT nuevo"} — areas=${(areas||[]).length}`);

  let presupuestoId = idExistente;
  if(presupuestoId){
    const {error} = await supabase.from("presupuestos").update(row).eq("id",presupuestoId);
    if(error){ console.error("[supabase] update presupuesto:", error.message); return null; }
  } else {
    const {data,error} = await supabase.from("presupuestos").insert(row).select("id").single();
    if(error){ console.error("[supabase] insert presupuesto:", error.message); return null; }
    presupuestoId = data.id;
    console.log("[supabase] presupuesto creado con id:", presupuestoId);
  }

  // Reemplazo completo de áreas/partidas (cascada borra partidas hijas automáticamente)
  const {error:delErr} = await supabase.from("areas_presupuesto").delete().eq("presupuesto_id",presupuestoId);
  if(delErr) console.error("[supabase] delete areas:", delErr.message);

  for(let orden=0; orden<(areas||[]).length; orden++){
    const areaId = areas[orden];
    const datosArea = costos?.[areaId] || {};
    const {data:areaRow, error:areaErr} = await supabase.from("areas_presupuesto")
      .insert({presupuesto_id:presupuestoId, area_id:areaId, estado:datosArea.estado||"pendiente", orden})
      .select("id").single();
    if(areaErr){ console.error("[supabase] insert area:", areaErr.message); continue; }
    const areaUuid = areaRow.id;

    const capexRows=(datosArea.capex||[]).map((p,i)=>({...capexToRow(p),area_id:areaUuid,presupuesto_id:presupuestoId,orden:i}));
    if(capexRows.length){ const {error} = await supabase.from("partidas_capex").insert(capexRows); if(error) console.error("[supabase] insert capex:",error.message); }

    const matRows=(datosArea.mat||[]).map((p,i)=>({...opexToRow(p),area_id:areaUuid,presupuesto_id:presupuestoId,orden:i}));
    if(matRows.length){ const {error} = await supabase.from("partidas_opex_mat").insert(matRows); if(error) console.error("[supabase] insert mat:",error.message); }

    const viaRows=(datosArea.via||[]).map((p,i)=>({...opexToRow(p),area_id:areaUuid,presupuesto_id:presupuestoId,orden:i}));
    if(viaRows.length){ const {error} = await supabase.from("partidas_opex_via").insert(viaRows); if(error) console.error("[supabase] insert via:",error.message); }

    const nomRows=(datosArea.nomina||[]).map((p,i)=>({...nominaToRow(p),area_id:areaUuid,presupuesto_id:presupuestoId,orden:i}));
    if(nomRows.length){ const {error} = await supabase.from("nomina").insert(nomRows); if(error) console.error("[supabase] insert nomina:",error.message); }
  }

  // Ingresos adicionales: reemplazo completo
  await supabase.from("ingresos_adicionales").delete().eq("presupuesto_id",presupuestoId);
  const ingRows=(ingAdicionales||[]).map(x=>({presupuesto_id:presupuestoId,descripcion:x.desc||"",mes:x.mes||1,anio:x.anio||new Date().getFullYear(),monto:x.monto||0}));
  if(ingRows.length){ const {error} = await supabase.from("ingresos_adicionales").insert(ingRows); if(error) console.error("[supabase] insert ingresos_adicionales:",error.message); }

  console.log(`[supabase] guardado OK: presupuesto ${presupuestoId} — ${(areas||[]).length} área(s), ${ingRows.length} ingreso(s) adicional(es)`);
  return presupuestoId;
}

// ─── CARGAR (lee todo el presupuesto y lo devuelve en la forma que usa la app) ──
export async function cargarPresupuestoDeNube(id, {uid, initP, initN}){
  if(!supabase) return null;
  console.log("[supabase] cargarPresupuestoDeNube (solo lectura):", id);
  const {data:pres, error} = await supabase.from("presupuestos").select("*").eq("id",id).single();
  if(error||!pres){ console.error("[supabase] cargar presupuesto:", error?.message); return null; }

  const {data:areasRows, error:areasErr} = await supabase.from("areas_presupuesto").select("*").eq("presupuesto_id",id).order("orden");
  if(areasErr) console.error("[supabase] cargar areas:", areasErr.message);

  const [{data:capexRows},{data:matRows},{data:viaRows},{data:nomRows},{data:ingRows}] = await Promise.all([
    supabase.from("partidas_capex").select("*").eq("presupuesto_id",id).order("orden"),
    supabase.from("partidas_opex_mat").select("*").eq("presupuesto_id",id).order("orden"),
    supabase.from("partidas_opex_via").select("*").eq("presupuesto_id",id).order("orden"),
    supabase.from("nomina").select("*").eq("presupuesto_id",id).order("orden"),
    supabase.from("ingresos_adicionales").select("*").eq("presupuesto_id",id),
  ]);

  const uuidToAppId={};
  (areasRows||[]).forEach(a=>{ uuidToAppId[a.id]=a.area_id; });
  const costos={};
  (areasRows||[]).forEach(a=>{
    costos[a.area_id]={capex:[],mat:[],nomina:[],via:[],estado:a.estado||"pendiente"};
  });

  (capexRows||[]).forEach(r=>{
    const appId=uuidToAppId[r.area_id]; if(!appId||!costos[appId]) return;
    costos[appId].capex.push(initP({
      id:uid(), cat:r.categoria, desc:r.descripcion, unidad:r.unidad,
      cantidad:Number(r.cantidad), monto:Number(r.monto),
      mesGastoMes:r.mes_gasto_mes?String(r.mes_gasto_mes):"",
      mesGastoAnio:r.mes_gasto_anio?String(r.mes_gasto_anio):"",
    }));
  });
  (matRows||[]).forEach(r=>{
    const appId=uuidToAppId[r.area_id]; if(!appId||!costos[appId]) return;
    costos[appId].mat.push(initP({
      id:uid(), cat:r.categoria, desc:r.descripcion, unidad:r.unidad,
      cantidad:Number(r.cantidad), monto:Number(r.monto),
      periodicidad:r.periodicidad||"mensual", mesInicioOpex:r.mes_inicio_opex||1,
    }));
  });
  (viaRows||[]).forEach(r=>{
    const appId=uuidToAppId[r.area_id]; if(!appId||!costos[appId]) return;
    costos[appId].via.push(initP({
      id:uid(), cat:r.categoria, desc:r.descripcion, unidad:r.unidad,
      cantidad:Number(r.cantidad), monto:Number(r.monto),
      periodicidad:r.periodicidad||"mensual", mesInicioOpex:r.mes_inicio_opex||1,
    }));
  });
  (nomRows||[]).forEach(r=>{
    const appId=uuidToAppId[r.area_id]; if(!appId||!costos[appId]) return;
    costos[appId].nomina.push(initN({
      id:uid(), puesto:r.puesto, tipoPersonal:r.tipo_personal,
      cantidad:r.cantidad||1, salario:Number(r.salario),
      imss:Number(r.imss), prestaciones:Number(r.prestaciones), isr:Number(r.isr),
      mesesContrato:r.meses_contrato||12, mesInicio:r.mes_inicio||1,
    }));
  });

  // ingresos mensuales: se derivan del precio fijo (mismo criterio que la captura manual)
  const precioFijo = Number(pres.precio_fijo)||0;
  const meses = pres.fecha_inicio && pres.fecha_fin
    ? Math.max(1,Math.round((new Date(pres.fecha_fin)-new Date(pres.fecha_inicio))/(1000*60*60*24*30)))
    : 12;
  const ingresos = Array(13).fill(0);
  for(let i=1;i<=Math.min(12,meses);i++) ingresos[i]=precioFijo;

  console.log(`[supabase] cargado OK: ${(areasRows||[]).length} área(s), `+
    `${(capexRows||[]).length} CAPEX, ${(matRows||[]).length} OPEX-mat, ${(viaRows||[]).length} OPEX-via, `+
    `${(nomRows||[]).length} nómina, ${(ingRows||[]).length} ingreso(s) adicional(es)`);

  return {
    id: pres.id,
    nombre: pres.nombre, empresa: pres.empresa, tipo: pres.tipo, estado: pres.estado,
    fechaInicio: pres.fecha_inicio, fechaFin: pres.fecha_fin, fechaElaboracion: pres.fecha_elaboracion,
    fecha: pres.fecha_inicio,
    _areas: (areasRows||[]).map(a=>a.area_id),
    _costos: costos,
    _capexPM: [],
    _opexPM: [],
    _ingresos: ingresos,
    _precioFijo: precioFijo,
    _ingAdicionales: (ingRows||[]).map(r=>({id:uid(),desc:r.descripcion,mes:r.mes,anio:r.anio,monto:Number(r.monto)})),
  };
}
