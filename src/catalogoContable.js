// ARCHIVO GENERADO — NO EDITAR A MANO.
//
// Fuente: docs/catalogo_contable_2027.csv (142 filas · 141 subcuentas
// distintas · 18 rubros). Ese CSV viene de finanzas y es LA fuente de
// verdad del mapeo subcuenta → rubro contable.
//
// Para regenerarlo, después de que finanzas actualice el CSV:
//     node scripts/gen-catalogo-contable.mjs
// Para verificar que está al día (falla si el CSV cambió y esto no):
//     node scripts/gen-catalogo-contable.mjs --check
//
// POR QUÉ ESTE ARCHIVO EXISTE: el CSV vive en docs/, fuera de src/, así que el
// bundle no lo puede importar. Antes el mapeo se transcribía a mano en
// SUBCAT_MAPPING y se quedó atrás: 91 categorías del menú caían en SIN CATEGORÍA
// aunque el CSV ya dijera a qué rubro pertenecen. Generarlo elimina la
// transcripción y con ella la posibilidad de que se vuelvan a despegar.
//
// El orden es el del CSV, que es el del Excel de la contadora. No alfabetizar.

export const SUBCUENTAS_CONTABLES = [
  ["EQUIPO DE TRANSPORTE"                                  , "ACTIVOS"],
  ["EQUIPO DE MOBILIARIO"                                  , "ACTIVOS"],
  ["MAQUINARIA Y EQUIPO"                                   , "ACTIVOS"],
  ["OTROS ACTIVOS"                                         , "ACTIVOS"],
  ["SOFTWARE Y LICICENCIAS"                                , "ACTIVOS"],
  ["ARRENDAMIENTO DE INMUEBLES"                            , "ARRENDA DE INMUEBLES Y SERV"],
  ["ENERGIA ELECTRICA"                                     , "ARRENDA DE INMUEBLES Y SERV"],
  ["RENTA DE CASAS NO DEDUCIBLE"                           , "ARRENDA DE INMUEBLES Y SERV"],
  ["SERVICIOS DE LIMPIEZA"                                 , "ARRENDA DE INMUEBLES Y SERV"],
  ["SERVICIOS DE VIGILANCIA"                               , "ARRENDA DE INMUEBLES Y SERV"],
  ["SERVICIOS DE FUMIGACION"                               , "ARRENDA DE INMUEBLES Y SERV"],
  ["TELEFONIA FIJA"                                        , "ARRENDA DE INMUEBLES Y SERV"],
  ["AGUA Y ALCANTARILLADO"                                 , "ARRENDA DE INMUEBLES Y SERV"],
  ["ARRENDAMIENTO DE OF. MOVILES"                          , "ARRENDA DE INMUEBLES Y SERV"],
  ["ROPA Y ARTICULOS DE PROTECCION"                        , "ARTICULOS DE SEGURIDAD"],
  ["EQUIPO DE COMPUTO (Adquisición)"                       , "EQUIPO DE COMPUTO"],
  ["ARRENDAMIENTO DE EQ. COMPUTO"                          , "EQUIPO DE COMPUTO"],
  ["ENSERES MENORES DIVERSOS (Acondicionamiento de casas)" , "EQUIPOS Y ENSERES"],
  ["INSUMOS AGRICOLAS"                                     , "INSUMOS AGRICOLAS"],
  ["PAPELERIA Y UTILES DE OFICINA"                         , "INSUMOS DE OFICINA"],
  ["ARTICULOS DE ASEO Y SANITARIOS"                        , "INSUMOS DE OFICINA"],
  ["ARTICULOS DE CAFETERIA"                                , "INSUMOS DE OFICINA"],
  ["ARTICULOS DIGITALES Y DE COMPUTO"                      , "INSUMOS DE OFICINA"],
  ["SERVICIOS DE MERCADOTECNIA"                            , "MARKETING"],
  ["PUBLICIDAD Y PROPAGANDA"                               , "MARKETING"],
  ["ABRASIVOS"                                             , "MATERIALES"],
  ["ACEITE LUBRICANTE P/MAQUINARIA"                        , "MATERIALES"],
  ["ACEITES Y LUBRICANTES"                                 , "MATERIALES"],
  ["AISLANTES IMPERM REFRA"                                , "MATERIALES"],
  ["BANDA CADEN TRANS COPL"                                , "MATERIALES"],
  ["CONEXIONES PARA TUBERIA"                               , "MATERIALES"],
  ["EMPAQUETAD JTAS Y SELLOS"                              , "MATERIALES"],
  ["ENVASES"                                               , "MATERIALES"],
  ["FIBRAS HILOS Y TELAS"                                  , "MATERIALES"],
  ["GRASAS"                                                , "MATERIALES"],
  ["HERRAMIENTAS MANUALES"                                 , "MATERIALES"],
  ["INSTRUM DE MEDICION Y CONTROL"                         , "MATERIALES"],
  ["LLANTAS, CAMARAS Y ACCESORIOS"                         , "MATERIALES"],
  ["MANGUERAS, CONEXIONES"                                 , "MATERIALES"],
  ["MATERIAL ELECTRICO"                                    , "MATERIALES"],
  ["MATERIAL PARA LA CONSTRUCCION"                         , "MATERIALES"],
  ["MATERIALES Y ART P/MANTENIMIENTO"                      , "MATERIALES"],
  ["METALES"                                               , "MATERIALES"],
  ["PART REP ACCES Y PROD P/VEHIC"                         , "MATERIALES"],
  ["PARTES ACCES Y MAT P/LABORATORIO"                      , "MATERIALES"],
  ["PARTES ACCES Y REFAC P/ LUBRICANTES"                   , "MATERIALES"],
  ["PARTES ELECT, ACCES Y REFACC"                          , "MATERIALES"],
  ["PARTES Y REFAC TELECOM Y VIDEO"                        , "MATERIALES"],
  ["PARTES Y REFACCION C/INCENDIO"                         , "MATERIALES"],
  ["PASTA PEGAMENTO OTRO COMPUESTO"                        , "MATERIALES"],
  ["PINTURA Y OTROS RECUBRIMIENTOS"                        , "MATERIALES"],
  ["REFAC P/INSTRUM DE MED Y CONTROL"                      , "MATERIALES"],
  ["REFACC Y ACCES PARA VALVULAS"                          , "MATERIALES"],
  ["REFACC Y ACCESORIO PARA HERRAMIENTA"                   , "MATERIALES"],
  ["REFACCIONES P/MAQUINARIA"                              , "MATERIALES"],
  ["RODAM ACCES Y SELLOS P/ ACEITE"                        , "MATERIALES"],
  ["SUSTANCIAS QUIMICAS"                                   , "MATERIALES"],
  ["TORNILLERIA Y ARTICULO"                                , "MATERIALES"],
  ["TUBERIAS"                                              , "MATERIALES"],
  ["VALVULAS"                                              , "MATERIALES"],
  ["MATERIAL PRIMEROS AUXILIOS"                            , "MATERIALES DE SALUD"],
  ["NOMINA Y ADICIONALES"                                  , "NOMINA Y ADICIONALES"],
  ["SERV TELEFONIA CELULAR"                                , "SERV TELEFONIA CELULAR Y RADIO"],
  ["SERVICIO DE BANDA ANCHA"                               , "SERV TELEFONIA CELULAR Y RADIO"],
  ["SERVICIO DE RADIOCOMUNICACION"                         , "SERV TELEFONIA CELULAR Y RADIO"],
  ["ACONDICION DE CASA HABITACION"                         , "SERVICIOS"],
  ["ADICION Y MODIFIC DE MATERIAL"                         , "SERVICIOS"],
  ["ADQUISICION TARJET COMBUSTIBLE"                        , "SERVICIOS"],
  ["ANALISIS CAUSA RAIZ"                                   , "SERVICIOS"],
  ["ANALISIS DE RIESGO"                                    , "SERVICIOS"],
  ["ANALISIS DE VIBRACION"                                 , "SERVICIOS"],
  ["BASES LICITACION Y CONCURSOS"                          , "SERVICIOS"],
  ["CARGOS EXTRAORDINARIOS"                                , "SERVICIOS"],
  ["CERTIFICACION"                                         , "SERVICIOS"],
  ["COLOCACION DE PILOTE"                                  , "SERVICIOS"],
  ["CORREOS Y MENSAJERIAS"                                 , "SERVICIOS"],
  ["CUOTAS Y SUSCRIPCIONES"                                , "SERVICIOS"],
  ["DEDUCIBLE POR SINIESTRO"                               , "SERVICIOS"],
  ["DESARROLLO DE SOFTWARE"                                , "SERVICIOS"],
  ["FIANZAS"                                               , "SERVICIOS"],
  ["FLETES  EXTRANJEROS"                                   , "SERVICIOS"],
  ["FLETES NACIONALES"                                     , "SERVICIOS"],
  ["GASTOS DE IMPORTACION"                                 , "SERVICIOS"],
  ["GTO EXPED DE SEG/TRAMITE"                              , "SERVICIOS"],
  ["HIELO Y AGUA"                                          , "SERVICIOS"],
  ["HONORARIOS A PERSONA FISICA"                           , "SERVICIOS"],
  ["IMPUESTOS Y DERECHOS"                                  , "SERVICIOS"],
  ["INTERNET Y DATOS"                                      , "SERVICIOS"],
  ["MANIOBRAS"                                             , "SERVICIOS"],
  ["MANTENIMIENTO A VEHICULOS"                             , "SERVICIOS"],
  ["MANTTO A EQUIPOS DE SEGURIDAD"                         , "SERVICIOS"],
  ["MANTTO DE MOBILIARIO Y EQUIPO"                         , "SERVICIOS"],
  ["MANTTO PREV A EQUIPOS DE MEDICION"                     , "SERVICIOS"],
  ["MANTTO Y ACONDICION DE CAMPER"                         , "SERVICIOS"],
  ["MECANICA DE SUELOS"                                    , "SERVICIOS"],
  ["OTROS DERECHOS"                                        , "SERVICIOS"],
  ["PACMA PEMEX EXPLORACION"                               , "SERVICIOS"],
  ["PAGO DE RECARGOS"                                      , "SERVICIOS"],
  ["RECARGA DE GASES INDUSTRIALES"                         , "SERVICIOS"],
  ["RENTA DE MAQUINARIA Y EQUIPO"                          , "SERVICIOS"],
  ["RENTA DE SANITARIOS"                                   , "SERVICIOS"],
  ["REPARACIONES"                                          , "SERVICIOS"],
  ["SEGUROS"                                               , "SERVICIOS"],
  ["SERV DE DISEÑO Y ROTULACION"                           , "SERVICIOS"],
  ["SERV DE DISPOS DE RESIDUOS"                            , "SERVICIOS"],
  ["SERV DE MANTO A INSTALACIONES"                         , "SERVICIOS"],
  ["SERV DE RECARGA DE EXTINTORES"                         , "SERVICIOS"],
  ["SERV DE TRANSMISION DE DATOS"                          , "SERVICIOS"],
  ["SERV PROFES DE PERSONA MORAL"                          , "SERVICIOS"],
  ["SERV Y MANTTO A EQ INFORMATICO"                        , "SERVICIOS"],
  ["SERVICIO DE AUTOLAVADO"                                , "SERVICIOS"],
  ["SERVICIO DE EQPO Y MAQUINARIA"                         , "SERVICIOS"],
  ["SERVICIO REPRESENTACION LEGAL"                         , "SERVICIOS"],
  ["SERVICIOS DE BANQUETERIA"                              , "SERVICIOS"],
  ["SERVICIOS DE COPIADO"                                  , "SERVICIOS"],
  ["SERVICIOS DE TAXI"                                     , "SERVICIOS"],
  ["SERVICIOS PREOPERATIVOS"                               , "SERVICIOS"],
  ["SERVICIOS RADIOGRAFICOS"                               , "SERVICIOS"],
  ["TENENCIA"                                              , "SERVICIOS"],
  ["TOPOGRAFIA"                                            , "SERVICIOS"],
  ["VERIFICACIONES"                                        , "SERVICIOS"],
  ["ASESORIA ESPECIAL INTERNA"                             , "SERVICIOS"],
  ["ASESORIA ESPECIAL OPERATIVA"                           , "SERVICIOS"],
  ["ASESORIA ESPECIAL SINDICAL"                            , "SERVICIOS"],
  ["ASESORIA ESPECIAL VIAL"                                , "SERVICIOS"],
  ["INTERESES"                                             , "SERVICIOS"],
  ["PAGO DE MULTAS"                                        , "SERVICIOS"],
  ["SERVICIOS DE CAPACITACION"                             , "SERVICIOS DE CAPACITACION"],
  ["SERVICIOS MEDICOS"                                     , "SERVICIOS DE SALUD"],
  ["UNIFORMES"                                             , "UNIFORMES"],
  ["ARRENDAMIENTO DE VEHIC"                                , "VEHICULOS Y COMBUSTIBLE"],
  ["COMBUSTIBLES"                                          , "VEHICULOS Y COMBUSTIBLE"],
  ["ALIMENTACION"                                          , "VIATICOS"],
  ["CASETAS PUENTES Y PEAJES"                              , "VIATICOS"],
  ["SERV DE TRANSPORTAC AEREA"                             , "VIATICOS"],
  ["SERV DE TRANSPORTAC TERRESTRE"                         , "VIATICOS"],
  ["SERVICIOS DE HOSPEDAJE"                                , "VIATICOS"],
  ["HERRAMIENTAS"                                          , "MATERIALES"],
  ["RENTA DE MAQUINARIA"                                   , "SERVICIOS"],
  ["TRANSPORTE"                                            , "VIATICOS"],
  ["TELECOMUNICACIONES"                                    , "SERVICIOS"],
];

// Comparación normalizada: ignora mayúsculas, acentos y espacios sobrantes,
// igual que normCat en App.jsx. Los dropdowns están acentuados ("VIÁTICOS") y
// el catálogo no ("VIATICOS"); sin esto, elegir una opción del propio menú de la
// app la mandaría a SIN CATEGORÍA.
function norm(s){
  return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toUpperCase().replace(/\s+/g," ").trim();
}
const POR_NORM = new Map(SUBCUENTAS_CONTABLES.map(([sub, rubro]) => [norm(sub), rubro]));

// Rubro contable de una subcuenta según el CSV, o null si el CSV no la tiene.
// null y no "SIN CATEGORÍA" a propósito: quien pregunta necesita distinguir
// "el CSV dice que no la conoce" de "no tiene rubro", para poder seguir
// consultando las capas de respaldo (alias y mapeos del usuario).
export function rubroDeSubcuenta(cat){
  return POR_NORM.get(norm(cat)) ?? null;
}

export const TOTAL_SUBCUENTAS = 141;
export const RUBROS_DEL_CSV = [
  "ACTIVOS",
  "ARRENDA DE INMUEBLES Y SERV",
  "ARTICULOS DE SEGURIDAD",
  "EQUIPO DE COMPUTO",
  "EQUIPOS Y ENSERES",
  "INSUMOS AGRICOLAS",
  "INSUMOS DE OFICINA",
  "MARKETING",
  "MATERIALES",
  "MATERIALES DE SALUD",
  "NOMINA Y ADICIONALES",
  "SERV TELEFONIA CELULAR Y RADIO",
  "SERVICIOS",
  "SERVICIOS DE CAPACITACION",
  "SERVICIOS DE SALUD",
  "UNIFORMES",
  "VEHICULOS Y COMBUSTIBLE",
  "VIATICOS"
];
