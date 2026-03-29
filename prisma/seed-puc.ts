import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// PUC (Plan Unico de Cuentas) - Colombian Standard Chart of Accounts
// Tailored for a clothing e-commerce business (Two Six)
// ═══════════════════════════════════════════════════════════════

interface PucRow {
  code: string;
  name: string;
  nature: 'DEBITO' | 'CREDITO';
}

/**
 * Derive level from code length:
 *   1 digit  => Level 1 (Clase)
 *   2 digits => Level 2 (Grupo)
 *   4 digits => Level 3 (Cuenta)
 *   6 digits => Level 4 (Subcuenta)
 *   8 digits => Level 5 (Auxiliar)
 */
function getLevel(code: string): number {
  switch (code.length) {
    case 1: return 1;
    case 2: return 2;
    case 4: return 3;
    case 6: return 4;
    case 8: return 5;
    default: throw new Error(`Invalid PUC code length: ${code} (${code.length})`);
  }
}

function getParentCode(code: string): string | null {
  switch (code.length) {
    case 1: return null;
    case 2: return code.substring(0, 1);
    case 4: return code.substring(0, 2);
    case 6: return code.substring(0, 4);
    case 8: return code.substring(0, 6);
    default: return null;
  }
}

// Nature: Classes 1,5,6 = DEBITO; Classes 2,3,4 = CREDITO
const D = 'DEBITO' as const;
const C = 'CREDITO' as const;

const pucAccounts: PucRow[] = [
  // ═══════════════════════════════════════════════════════
  // 1 - ACTIVOS (DEBITO)
  // ═══════════════════════════════════════════════════════
  { code: '1',       name: 'Activos',                                      nature: D },

  // 11 - Disponible
  { code: '11',      name: 'Disponible',                                   nature: D },
  { code: '1105',    name: 'Caja',                                         nature: D },
  { code: '110505',  name: 'Caja General',                                 nature: D },
  { code: '11050501', name: 'Caja General Principal',                      nature: D },
  { code: '110510',  name: 'Cajas Menores',                                nature: D },
  { code: '11051001', name: 'Caja Menor Oficina',                          nature: D },
  { code: '1110',    name: 'Bancos',                                       nature: D },
  { code: '111005',  name: 'Moneda Nacional',                              nature: D },
  { code: '11100501', name: 'Banco Principal Cuenta Corriente',            nature: D },
  { code: '11100502', name: 'Banco Principal Cuenta Ahorros',              nature: D },
  { code: '11100503', name: 'Banco Secundario Cuenta Ahorros',             nature: D },
  { code: '1120',    name: 'Cuentas de Ahorro',                            nature: D },
  { code: '112005',  name: 'Bancos Cuentas de Ahorro',                     nature: D },
  { code: '11200501', name: 'Cuenta de Ahorro Principal',                  nature: D },

  // 12 - Inversiones
  { code: '12',      name: 'Inversiones',                                  nature: D },
  { code: '1205',    name: 'Acciones',                                     nature: D },
  { code: '120505',  name: 'Acciones Nacionales',                          nature: D },
  { code: '12050501', name: 'Acciones en Sociedades Nacionales',           nature: D },
  { code: '1225',    name: 'Certificados',                                 nature: D },
  { code: '122505',  name: 'Certificados de Deposito a Termino',           nature: D },
  { code: '12250501', name: 'CDT Banco Principal',                         nature: D },

  // 13 - Deudores
  { code: '13',      name: 'Deudores',                                     nature: D },
  { code: '1305',    name: 'Clientes',                                     nature: D },
  { code: '130505',  name: 'Clientes Nacionales',                          nature: D },
  { code: '13050501', name: 'Clientes Nacionales Tienda Online',           nature: D },
  { code: '13050502', name: 'Clientes Nacionales Mayoristas',              nature: D },
  { code: '13050503', name: 'Clientes Nacionales Consignacion',            nature: D },
  { code: '1310',    name: 'Cuentas Corrientes Comerciales',               nature: D },
  { code: '131005',  name: 'Cuentas Corrientes Comerciales Nacionales',    nature: D },
  { code: '13100501', name: 'Cuentas Corrientes Clientes',                 nature: D },
  { code: '1325',    name: 'Cuentas por Cobrar a Socios',                  nature: D },
  { code: '132505',  name: 'A Socios',                                     nature: D },
  { code: '13250501', name: 'Cuentas por Cobrar Socios',                   nature: D },
  { code: '1330',    name: 'Anticipos y Avances',                          nature: D },
  { code: '133005',  name: 'A Proveedores',                                nature: D },
  { code: '13300501', name: 'Anticipos a Proveedores Nacionales',          nature: D },
  { code: '133010',  name: 'A Contratistas',                               nature: D },
  { code: '13301001', name: 'Anticipos a Contratistas',                    nature: D },
  { code: '133015',  name: 'A Trabajadores',                               nature: D },
  { code: '13301501', name: 'Anticipos a Trabajadores',                    nature: D },
  { code: '1345',    name: 'Ingresos por Cobrar',                          nature: D },
  { code: '134505',  name: 'Intereses',                                    nature: D },
  { code: '13450501', name: 'Intereses por Cobrar',                        nature: D },
  { code: '1355',    name: 'Anticipo de Impuestos y Contribuciones',       nature: D },
  { code: '135505',  name: 'Anticipo de Renta',                            nature: D },
  { code: '13550501', name: 'Anticipo Impuesto de Renta',                  nature: D },
  { code: '135510',  name: 'Anticipo de ICA',                              nature: D },
  { code: '13551001', name: 'Anticipo Impuesto ICA',                       nature: D },
  { code: '135515',  name: 'Retencion en la Fuente a Favor',               nature: D },
  { code: '13551501', name: 'Retefuente a Favor',                          nature: D },
  { code: '135517',  name: 'Impuesto a las Ventas Retenido',               nature: D },
  { code: '13551701', name: 'IVA Retenido a Favor',                        nature: D },
  { code: '1365',    name: 'Cuentas por Cobrar a Trabajadores',            nature: D },
  { code: '136505',  name: 'Prestamos a Empleados',                        nature: D },
  { code: '13650501', name: 'Prestamos a Empleados General',               nature: D },
  { code: '1380',    name: 'Deudores Varios',                              nature: D },
  { code: '138005',  name: 'Deudores Varios Nacionales',                   nature: D },
  { code: '13800501', name: 'Deudores Varios General',                     nature: D },
  { code: '13800502', name: 'Pasarelas de Pago por Cobrar',                nature: D },
  { code: '13800503', name: 'Cobros Contraentrega Pendientes',             nature: D },
  { code: '1390',    name: 'Deudas de Dificil Cobro',                      nature: D },
  { code: '139005',  name: 'Deudas de Dificil Cobro Clientes',             nature: D },
  { code: '13900501', name: 'Deudas de Dificil Cobro General',             nature: D },
  { code: '1399',    name: 'Provisiones',                                  nature: D },
  { code: '139905',  name: 'Provision Clientes',                           nature: D },
  { code: '13990501', name: 'Provision Cartera de Dificil Cobro',          nature: D },

  // 14 - Inventarios
  { code: '14',      name: 'Inventarios',                                  nature: D },
  { code: '1435',    name: 'Mercancias no Fabricadas por la Empresa',      nature: D },
  { code: '143505',  name: 'Ropa y Prendas de Vestir',                     nature: D },
  { code: '14350501', name: 'Inventario Camisetas',                        nature: D },
  { code: '14350502', name: 'Inventario Pantalones',                       nature: D },
  { code: '14350503', name: 'Inventario Vestidos',                         nature: D },
  { code: '14350504', name: 'Inventario Accesorios',                       nature: D },
  { code: '14350505', name: 'Inventario Chaquetas y Abrigos',              nature: D },
  { code: '14350506', name: 'Inventario Faldas',                           nature: D },
  { code: '14350507', name: 'Inventario Ropa Interior',                    nature: D },
  { code: '14350508', name: 'Inventario Calzado',                          nature: D },
  { code: '14350509', name: 'Inventario General Prendas',                  nature: D },
  { code: '1455',    name: 'Materiales Repuestos y Accesorios',            nature: D },
  { code: '145505',  name: 'Materiales de Empaque',                        nature: D },
  { code: '14550501', name: 'Bolsas y Cajas de Empaque',                   nature: D },
  { code: '14550502', name: 'Etiquetas y Marquillas',                      nature: D },
  { code: '1499',    name: 'Provisiones',                                  nature: D },
  { code: '149905',  name: 'Provision Obsolescencia de Inventarios',       nature: D },
  { code: '14990501', name: 'Provision por Obsolescencia',                 nature: D },

  // 15 - Propiedad Planta y Equipo
  { code: '15',      name: 'Propiedades Planta y Equipo',                  nature: D },
  { code: '1524',    name: 'Equipo de Oficina',                            nature: D },
  { code: '152405',  name: 'Muebles y Enseres',                            nature: D },
  { code: '15240501', name: 'Muebles y Enseres Oficina',                   nature: D },
  { code: '1528',    name: 'Equipo de Computacion y Comunicacion',         nature: D },
  { code: '152805',  name: 'Equipos de Procesamiento de Datos',            nature: D },
  { code: '15280501', name: 'Computadores y Equipos de Computo',           nature: D },
  { code: '1592',    name: 'Depreciacion Acumulada',                       nature: D },
  { code: '159205',  name: 'Depreciacion Equipo de Oficina',               nature: D },
  { code: '15920501', name: 'Depreciacion Acum. Muebles y Enseres',       nature: D },
  { code: '159210',  name: 'Depreciacion Equipo de Computo',               nature: D },
  { code: '15921001', name: 'Depreciacion Acum. Equipo Computo',           nature: D },

  // 17 - Diferidos
  { code: '17',      name: 'Diferidos',                                    nature: D },
  { code: '1705',    name: 'Gastos Pagados por Anticipado',                nature: D },
  { code: '170505',  name: 'Intereses Pagados por Anticipado',             nature: D },
  { code: '17050501', name: 'Intereses Anticipados',                       nature: D },
  { code: '170510',  name: 'Seguros Pagados por Anticipado',               nature: D },
  { code: '17051001', name: 'Seguros Anticipados',                         nature: D },
  { code: '170515',  name: 'Arrendamientos Pagados por Anticipado',        nature: D },
  { code: '17051501', name: 'Arriendos Anticipados',                       nature: D },
  { code: '170520',  name: 'Suscripciones y Software',                     nature: D },
  { code: '17052001', name: 'Licencias de Software Anticipadas',           nature: D },

  // ═══════════════════════════════════════════════════════
  // 2 - PASIVOS (CREDITO)
  // ═══════════════════════════════════════════════════════
  { code: '2',       name: 'Pasivos',                                      nature: C },

  // 21 - Obligaciones Financieras
  { code: '21',      name: 'Obligaciones Financieras',                     nature: C },
  { code: '2105',    name: 'Bancos Nacionales',                            nature: C },
  { code: '210505',  name: 'Sobregiros',                                   nature: C },
  { code: '21050501', name: 'Sobregiros Bancarios',                        nature: C },
  { code: '210510',  name: 'Pagares',                                      nature: C },
  { code: '21051001', name: 'Pagares Bancarios',                           nature: C },

  // 22 - Proveedores
  { code: '22',      name: 'Proveedores',                                  nature: C },
  { code: '2205',    name: 'Proveedores Nacionales',                       nature: C },
  { code: '220505',  name: 'Proveedores Nacionales',                       nature: C },
  { code: '22050501', name: 'Proveedores de Mercancia',                    nature: C },
  { code: '22050502', name: 'Proveedores de Servicios',                    nature: C },
  { code: '22050503', name: 'Proveedores de Materia Prima',                nature: C },

  // 23 - Cuentas por Pagar
  { code: '23',      name: 'Cuentas por Pagar',                            nature: C },
  { code: '2335',    name: 'Costos y Gastos por Pagar',                    nature: C },
  { code: '233505',  name: 'Gastos Financieros por Pagar',                 nature: C },
  { code: '23350501', name: 'Intereses por Pagar',                         nature: C },
  { code: '233510',  name: 'Gastos de Personal por Pagar',                 nature: C },
  { code: '23351001', name: 'Nomina por Pagar',                            nature: C },
  { code: '233515',  name: 'Arrendamientos por Pagar',                     nature: C },
  { code: '23351501', name: 'Arriendo por Pagar',                          nature: C },
  { code: '233520',  name: 'Servicios Publicos por Pagar',                 nature: C },
  { code: '23352001', name: 'Servicios Publicos por Pagar',                nature: C },
  { code: '233525',  name: 'Fletes y Acarreos por Pagar',                  nature: C },
  { code: '23352501', name: 'Fletes Envios por Pagar',                     nature: C },

  // 2365 - Retencion en la Fuente
  { code: '2365',    name: 'Retencion en la Fuente',                       nature: C },
  { code: '236505',  name: 'Retencion en la Fuente Salarios',              nature: C },
  { code: '23650501', name: 'Retefuente Salarios y Pagos Laborales',       nature: C },
  { code: '236510',  name: 'Retencion en la Fuente Dividendos',            nature: C },
  { code: '23651001', name: 'Retefuente Dividendos',                       nature: C },
  { code: '236515',  name: 'Retencion en la Fuente Honorarios',            nature: C },
  { code: '23651501', name: 'Retefuente Honorarios',                       nature: C },
  { code: '236520',  name: 'Retencion en la Fuente Comisiones',            nature: C },
  { code: '23652001', name: 'Retefuente Comisiones',                       nature: C },
  { code: '236525',  name: 'Retencion en la Fuente Compras',               nature: C },
  { code: '23652501', name: 'Retefuente Compras Generales',                nature: C },
  { code: '236530',  name: 'Retencion en la Fuente Servicios',             nature: C },
  { code: '23653001', name: 'Retefuente Servicios',                        nature: C },
  { code: '236540',  name: 'Retencion en la Fuente Arrendamientos',        nature: C },
  { code: '23654001', name: 'Retefuente Arrendamientos',                   nature: C },

  // 2367 - IVA Retenido
  { code: '2367',    name: 'Impuesto a las Ventas Retenido',               nature: C },
  { code: '236701',  name: 'IVA Retenido por Pagar',                       nature: C },
  { code: '23670101', name: 'IVA Retenido General',                        nature: C },

  // 2368 - ICA Retenido
  { code: '2368',    name: 'Impuesto de Industria y Comercio Retenido',    nature: C },
  { code: '236801',  name: 'ICA Retenido por Pagar',                       nature: C },
  { code: '23680101', name: 'ReteICA General',                             nature: C },

  // 2370 - Retenciones y Aportes de Nomina
  { code: '2370',    name: 'Retenciones y Aportes de Nomina',              nature: C },
  { code: '237005',  name: 'Aportes EPS',                                  nature: C },
  { code: '23700501', name: 'Aportes EPS por Pagar',                       nature: C },
  { code: '237010',  name: 'Aportes Fondos de Pensiones',                  nature: C },
  { code: '23701001', name: 'Aportes Pension por Pagar',                   nature: C },
  { code: '237015',  name: 'Aportes ARL',                                  nature: C },
  { code: '23701501', name: 'Aportes ARL por Pagar',                       nature: C },
  { code: '237025',  name: 'Aportes SENA ICBF Caja',                      nature: C },
  { code: '23702501', name: 'Aportes Parafiscales por Pagar',              nature: C },

  // 2380 - Acreedores Varios
  { code: '2380',    name: 'Acreedores Varios',                            nature: C },
  { code: '238005',  name: 'Acreedores Varios Nacionales',                 nature: C },
  { code: '23800501', name: 'Acreedores Varios General',                   nature: C },
  { code: '23800502', name: 'Pasarela de Pago por Pagar',                  nature: C },
  { code: '23800503', name: 'Transportadoras por Pagar',                   nature: C },

  // 24 - Impuestos Gravamenes y Tasas
  { code: '24',      name: 'Impuestos Gravamenes y Tasas',                 nature: C },
  { code: '2404',    name: 'De Renta y Complementarios',                   nature: C },
  { code: '240405',  name: 'Impuesto de Renta Vigencia Fiscal',            nature: C },
  { code: '24040501', name: 'Impuesto de Renta por Pagar',                 nature: C },
  { code: '2408',    name: 'Impuesto sobre las Ventas por Pagar',          nature: C },
  { code: '240801',  name: 'IVA Generado en Ventas',                       nature: C },
  { code: '24080101', name: 'IVA Generado 19% Ventas',                     nature: C },
  { code: '240802',  name: 'IVA Descontable en Compras',                   nature: C },
  { code: '24080201', name: 'IVA Descontable 19% Compras',                 nature: C },
  { code: '2412',    name: 'Impuesto de Industria y Comercio',             nature: C },
  { code: '241205',  name: 'ICA Vigencia Fiscal',                          nature: C },
  { code: '24120501', name: 'ICA por Pagar',                               nature: C },

  // 25 - Obligaciones Laborales
  { code: '25',      name: 'Obligaciones Laborales',                       nature: C },
  { code: '2505',    name: 'Salarios por Pagar',                           nature: C },
  { code: '250505',  name: 'Salarios por Pagar',                           nature: C },
  { code: '25050501', name: 'Salarios por Pagar Empleados',                nature: C },
  { code: '2510',    name: 'Cesantias Consolidadas',                       nature: C },
  { code: '251005',  name: 'Cesantias',                                    nature: C },
  { code: '25100501', name: 'Cesantias por Pagar',                         nature: C },
  { code: '2515',    name: 'Intereses sobre Cesantias',                    nature: C },
  { code: '251505',  name: 'Intereses sobre Cesantias',                    nature: C },
  { code: '25150501', name: 'Intereses Cesantias por Pagar',               nature: C },
  { code: '2520',    name: 'Prima de Servicios',                           nature: C },
  { code: '252005',  name: 'Prima de Servicios',                           nature: C },
  { code: '25200501', name: 'Prima de Servicios por Pagar',                nature: C },
  { code: '2525',    name: 'Vacaciones Consolidadas',                      nature: C },
  { code: '252505',  name: 'Vacaciones',                                   nature: C },
  { code: '25250501', name: 'Vacaciones por Pagar',                        nature: C },

  // 28 - Otros Pasivos
  { code: '28',      name: 'Otros Pasivos',                                nature: C },
  { code: '2805',    name: 'Anticipos y Avances Recibidos',                nature: C },
  { code: '280505',  name: 'Anticipos de Clientes',                        nature: C },
  { code: '28050501', name: 'Anticipos Recibidos de Clientes',             nature: C },
  { code: '2815',    name: 'Ingresos Recibidos para Terceros',             nature: C },
  { code: '281505',  name: 'Reembolsos Pendientes Clientes',               nature: C },
  { code: '28150501', name: 'Devoluciones Pendientes por Reembolsar',      nature: C },

  // ═══════════════════════════════════════════════════════
  // 3 - PATRIMONIO (CREDITO)
  // ═══════════════════════════════════════════════════════
  { code: '3',       name: 'Patrimonio',                                   nature: C },

  { code: '31',      name: 'Capital Social',                               nature: C },
  { code: '3105',    name: 'Capital Suscrito y Pagado',                    nature: C },
  { code: '310505',  name: 'Capital Autorizado',                           nature: C },
  { code: '31050501', name: 'Capital Social Pagado',                       nature: C },
  { code: '3115',    name: 'Aportes Sociales',                             nature: C },
  { code: '311505',  name: 'Cuotas o Partes de Interes Social',            nature: C },
  { code: '31150501', name: 'Aportes Sociales Socios',                     nature: C },

  { code: '33',      name: 'Reservas',                                     nature: C },
  { code: '3305',    name: 'Reservas Obligatorias',                        nature: C },
  { code: '330505',  name: 'Reserva Legal',                                nature: C },
  { code: '33050501', name: 'Reserva Legal',                               nature: C },

  { code: '34',      name: 'Revalorizacion del Patrimonio',                nature: C },
  { code: '3405',    name: 'Ajustes por Inflacion',                        nature: C },
  { code: '340505',  name: 'Ajustes por Inflacion Patrimonio',             nature: C },
  { code: '34050501', name: 'Ajustes por Inflacion',                       nature: C },

  { code: '36',      name: 'Resultados del Ejercicio',                     nature: C },
  { code: '3605',    name: 'Utilidad del Ejercicio',                       nature: C },
  { code: '360505',  name: 'Utilidad del Ejercicio',                       nature: C },
  { code: '36050501', name: 'Utilidad del Ejercicio Actual',               nature: C },
  { code: '3610',    name: 'Perdida del Ejercicio',                        nature: C },
  { code: '361005',  name: 'Perdida del Ejercicio',                        nature: C },
  { code: '36100501', name: 'Perdida del Ejercicio Actual',                nature: C },

  { code: '37',      name: 'Resultados de Ejercicios Anteriores',          nature: C },
  { code: '3705',    name: 'Utilidades Acumuladas',                        nature: C },
  { code: '370505',  name: 'Utilidades de Ejercicios Anteriores',          nature: C },
  { code: '37050501', name: 'Utilidades Acumuladas',                       nature: C },
  { code: '3710',    name: 'Perdidas Acumuladas',                          nature: C },
  { code: '371005',  name: 'Perdidas de Ejercicios Anteriores',            nature: C },
  { code: '37100501', name: 'Perdidas Acumuladas',                         nature: C },

  // ═══════════════════════════════════════════════════════
  // 4 - INGRESOS (CREDITO)
  // ═══════════════════════════════════════════════════════
  { code: '4',       name: 'Ingresos',                                     nature: C },

  { code: '41',      name: 'Operacionales',                                nature: C },
  { code: '4135',    name: 'Comercio al por Mayor y al por Menor',         nature: C },
  { code: '413505',  name: 'Venta de Productos Textiles',                  nature: C },
  { code: '41350501', name: 'Ventas Camisetas',                            nature: C },
  { code: '41350502', name: 'Ventas Pantalones',                           nature: C },
  { code: '41350503', name: 'Ventas Vestidos',                             nature: C },
  { code: '41350504', name: 'Ventas Accesorios',                           nature: C },
  { code: '41350505', name: 'Ventas Chaquetas y Abrigos',                  nature: C },
  { code: '41350506', name: 'Ventas Faldas',                               nature: C },
  { code: '41350507', name: 'Ventas Ropa Interior',                        nature: C },
  { code: '41350508', name: 'Ventas Calzado',                              nature: C },
  { code: '413535',  name: 'Productos Textiles Prendas de Vestir',         nature: C },
  { code: '41353501', name: 'Ventas Generales Prendas de Vestir',          nature: C },
  { code: '413540',  name: 'Ventas por Consignacion',                      nature: C },
  { code: '41354001', name: 'Ventas en Consignacion Prendas',              nature: C },

  { code: '4175',    name: 'Devoluciones en Ventas (DB)',                   nature: C },
  { code: '417505',  name: 'Devoluciones en Ventas Nacionales',            nature: C },
  { code: '41750501', name: 'Devoluciones en Ventas Online',               nature: C },
  { code: '41750502', name: 'Devoluciones en Ventas Garantia',             nature: C },

  { code: '42',      name: 'No Operacionales',                             nature: C },
  { code: '4210',    name: 'Financieros',                                  nature: C },
  { code: '421005',  name: 'Intereses',                                    nature: C },
  { code: '42100501', name: 'Intereses Bancarios Recibidos',               nature: C },
  { code: '421010',  name: 'Rendimientos de Inversiones',                  nature: C },
  { code: '42101001', name: 'Rendimientos CDT e Inversiones',              nature: C },
  { code: '4220',    name: 'Arrendamientos',                               nature: C },
  { code: '422005',  name: 'Ingresos por Arrendamiento',                   nature: C },
  { code: '42200501', name: 'Ingresos por Arrendamiento',                  nature: C },
  { code: '4250',    name: 'Recuperaciones',                               nature: C },
  { code: '425005',  name: 'Recuperacion de Cartera',                      nature: C },
  { code: '42500501', name: 'Recuperacion Deudas Dadas de Baja',           nature: C },
  { code: '4295',    name: 'Ingresos Diversos',                            nature: C },
  { code: '429505',  name: 'Otros Ingresos',                               nature: C },
  { code: '42950501', name: 'Otros Ingresos No Operacionales',             nature: C },

  // ═══════════════════════════════════════════════════════
  // 5 - GASTOS (DEBITO)
  // ═══════════════════════════════════════════════════════
  { code: '5',       name: 'Gastos',                                       nature: D },

  { code: '51',      name: 'Operacionales de Administracion',              nature: D },
  { code: '5105',    name: 'Gastos de Personal',                           nature: D },
  { code: '510505',  name: 'Salarios',                                     nature: D },
  { code: '51050501', name: 'Sueldos Administracion',                      nature: D },
  { code: '510510',  name: 'Horas Extras y Recargos',                      nature: D },
  { code: '51051001', name: 'Horas Extras Administracion',                 nature: D },
  { code: '510515',  name: 'Auxilio de Transporte',                        nature: D },
  { code: '51051501', name: 'Auxilio Transporte Administracion',           nature: D },
  { code: '510520',  name: 'Cesantias',                                    nature: D },
  { code: '51052001', name: 'Cesantias Administracion',                    nature: D },
  { code: '510525',  name: 'Intereses sobre Cesantias',                    nature: D },
  { code: '51052501', name: 'Int. Cesantias Administracion',               nature: D },
  { code: '510527',  name: 'Vacaciones',                                   nature: D },
  { code: '51052701', name: 'Vacaciones Administracion',                   nature: D },
  { code: '510530',  name: 'Prima de Servicios',                           nature: D },
  { code: '51053001', name: 'Prima Servicios Administracion',              nature: D },
  { code: '510533',  name: 'Dotacion y Suministro a Trabajadores',         nature: D },
  { code: '51053301', name: 'Dotacion Personal Administracion',            nature: D },
  { code: '510536',  name: 'Seguridad Social Aportes',                     nature: D },
  { code: '51053601', name: 'Aportes EPS Empleador Admon',                 nature: D },
  { code: '51053602', name: 'Aportes Pension Empleador Admon',             nature: D },
  { code: '51053603', name: 'Aportes ARL Admon',                           nature: D },
  { code: '510539',  name: 'Aportes Parafiscales',                         nature: D },
  { code: '51053901', name: 'Parafiscales SENA ICBF Caja Admon',          nature: D },

  { code: '5110',    name: 'Honorarios',                                   nature: D },
  { code: '511005',  name: 'Honorarios Junta Directiva',                   nature: D },
  { code: '51100501', name: 'Honorarios Junta',                            nature: D },
  { code: '511010',  name: 'Honorarios Revisor Fiscal',                    nature: D },
  { code: '51101001', name: 'Honorarios Revisor Fiscal',                   nature: D },
  { code: '511015',  name: 'Honorarios Asesoria Contable',                 nature: D },
  { code: '51101501', name: 'Honorarios Contador y Contabilidad',          nature: D },
  { code: '511020',  name: 'Honorarios Asesoria Juridica',                 nature: D },
  { code: '51102001', name: 'Honorarios Abogado',                          nature: D },
  { code: '511025',  name: 'Honorarios Asesoria Tecnica',                  nature: D },
  { code: '51102501', name: 'Honorarios Desarrollo y Tecnologia',          nature: D },

  { code: '5115',    name: 'Impuestos',                                    nature: D },
  { code: '511505',  name: 'Industria y Comercio',                         nature: D },
  { code: '51150501', name: 'Gasto ICA',                                   nature: D },
  { code: '511510',  name: 'Impuesto Predial',                             nature: D },
  { code: '51151001', name: 'Gasto Impuesto Predial',                      nature: D },
  { code: '511515',  name: 'Gravamen Movimientos Financieros',             nature: D },
  { code: '51151501', name: 'GMF 4x1000',                                  nature: D },

  { code: '5120',    name: 'Arrendamientos',                               nature: D },
  { code: '512005',  name: 'Locales y Oficinas',                           nature: D },
  { code: '51200501', name: 'Arriendo Oficina Administrativa',             nature: D },
  { code: '512010',  name: 'Bodegas y Almacenamiento',                     nature: D },
  { code: '51201001', name: 'Arriendo Bodega',                             nature: D },

  { code: '5135',    name: 'Servicios',                                    nature: D },
  { code: '513505',  name: 'Aseo y Vigilancia',                            nature: D },
  { code: '51350501', name: 'Servicio de Aseo',                            nature: D },
  { code: '513510',  name: 'Acueducto y Alcantarillado',                   nature: D },
  { code: '51351001', name: 'Servicio de Agua',                            nature: D },
  { code: '513515',  name: 'Energia Electrica',                            nature: D },
  { code: '51351501', name: 'Servicio de Energia',                         nature: D },
  { code: '513520',  name: 'Telefono',                                     nature: D },
  { code: '51352001', name: 'Servicio de Telefono',                        nature: D },
  { code: '513525',  name: 'Internet y Datos',                             nature: D },
  { code: '51352501', name: 'Servicio de Internet',                        nature: D },
  { code: '513530',  name: 'Hosting y Servicios en la Nube',               nature: D },
  { code: '51353001', name: 'Hosting Servidores y AWS',                    nature: D },
  { code: '51353002', name: 'Dominio Web',                                 nature: D },
  { code: '513535',  name: 'Correo y Transporte',                          nature: D },
  { code: '51353501', name: 'Servicio de Correo y Mensajeria',             nature: D },
  { code: '513540',  name: 'Suscripciones y Plataformas SaaS',             nature: D },
  { code: '51354001', name: 'Suscripciones Software (ERP, CRM)',           nature: D },

  { code: '5140',    name: 'Gastos Legales',                               nature: D },
  { code: '514005',  name: 'Notariales',                                   nature: D },
  { code: '51400501', name: 'Gastos Notariales',                           nature: D },
  { code: '514010',  name: 'Registro Mercantil',                           nature: D },
  { code: '51401001', name: 'Gasto Camara de Comercio',                    nature: D },
  { code: '514015',  name: 'Tramites y Licencias',                         nature: D },
  { code: '51401501', name: 'Tramites Legales y Permisos',                 nature: D },

  { code: '5145',    name: 'Mantenimiento y Reparaciones',                 nature: D },
  { code: '514505',  name: 'Maquinaria y Equipo',                          nature: D },
  { code: '51450501', name: 'Mantenimiento Equipos Oficina',               nature: D },
  { code: '514510',  name: 'Equipo de Computo',                            nature: D },
  { code: '51451001', name: 'Mantenimiento Equipos de Computo',            nature: D },
  { code: '514515',  name: 'Locales e Instalaciones',                      nature: D },
  { code: '51451501', name: 'Mantenimiento Oficinas e Instalaciones',      nature: D },

  { code: '5155',    name: 'Gastos de Viaje',                              nature: D },
  { code: '515505',  name: 'Alojamiento y Manutencion',                    nature: D },
  { code: '51550501', name: 'Hospedaje y Alimentacion Viajes',             nature: D },
  { code: '515510',  name: 'Pasajes Aereos y Terrestres',                  nature: D },
  { code: '51551001', name: 'Tiquetes y Transporte Viajes',                nature: D },

  { code: '5195',    name: 'Diversos',                                     nature: D },
  { code: '519505',  name: 'Comisiones Bancarias',                         nature: D },
  { code: '51950501', name: 'Comisiones y Cargos Bancarios',               nature: D },
  { code: '519510',  name: 'Empaques y Envolturas',                        nature: D },
  { code: '51951001', name: 'Material de Empaque Envios',                  nature: D },
  { code: '519515',  name: 'Gastos de Envio y Transporte',                 nature: D },
  { code: '51951501', name: 'Fletes y Envios a Clientes',                  nature: D },
  { code: '51951502', name: 'Envios Devoluciones',                         nature: D },
  { code: '519520',  name: 'Comisiones Pasarela de Pago',                  nature: D },
  { code: '51952001', name: 'Comision Wompi',                              nature: D },
  { code: '51952002', name: 'Comision Otras Pasarelas',                    nature: D },
  { code: '519525',  name: 'Utiles Papeleria y Fotocopias',                nature: D },
  { code: '51952501', name: 'Papeleria y Utiles de Oficina',               nature: D },
  { code: '519530',  name: 'Elementos de Aseo y Cafeteria',                nature: D },
  { code: '51953001', name: 'Aseo y Cafeteria',                            nature: D },
  { code: '519535',  name: 'Seguros',                                      nature: D },
  { code: '51953501', name: 'Seguros Generales',                           nature: D },
  { code: '519595',  name: 'Otros Gastos Diversos',                        nature: D },
  { code: '51959501', name: 'Otros Gastos Administracion',                 nature: D },

  { code: '5199',    name: 'Provisiones',                                  nature: D },
  { code: '519905',  name: 'Provision Deudores',                           nature: D },
  { code: '51990501', name: 'Provision Cartera Clientes',                  nature: D },
  { code: '519910',  name: 'Provision Inventarios',                        nature: D },
  { code: '51991001', name: 'Provision por Obsolescencia Inventario',      nature: D },

  // 52 - Operacionales de Ventas
  { code: '52',      name: 'Operacionales de Ventas',                      nature: D },
  { code: '5205',    name: 'Gastos de Personal Ventas',                    nature: D },
  { code: '520505',  name: 'Salarios Ventas',                              nature: D },
  { code: '52050501', name: 'Sueldos Personal de Ventas',                  nature: D },
  { code: '520510',  name: 'Comisiones Ventas',                            nature: D },
  { code: '52051001', name: 'Comisiones Fuerza de Ventas',                 nature: D },

  { code: '5210',    name: 'Honorarios Ventas',                            nature: D },
  { code: '521005',  name: 'Honorarios Asesoria Comercial',                nature: D },
  { code: '52100501', name: 'Honorarios Asesores Comerciales',             nature: D },

  { code: '5220',    name: 'Arrendamientos Ventas',                        nature: D },
  { code: '522005',  name: 'Locales Comerciales',                          nature: D },
  { code: '52200501', name: 'Arriendo Punto de Venta',                     nature: D },

  { code: '5235',    name: 'Servicios Ventas',                             nature: D },
  { code: '523505',  name: 'Publicidad y Propaganda',                      nature: D },
  { code: '52350501', name: 'Publicidad en Redes Sociales',                nature: D },
  { code: '52350502', name: 'Publicidad Google Ads',                       nature: D },
  { code: '52350503', name: 'Publicidad Influencers',                      nature: D },
  { code: '52350504', name: 'Material Publicitario Impreso',               nature: D },
  { code: '523510',  name: 'Marketing Digital',                            nature: D },
  { code: '52351001', name: 'Email Marketing y CRM',                       nature: D },
  { code: '52351002', name: 'SEO y Contenido Digital',                     nature: D },
  { code: '523515',  name: 'Fotografia y Produccion',                      nature: D },
  { code: '52351501', name: 'Sesiones Fotograficas Producto',              nature: D },
  { code: '52351502', name: 'Produccion Video y Contenido',                nature: D },

  { code: '5240',    name: 'Gastos Legales Ventas',                        nature: D },
  { code: '524005',  name: 'Gastos de Marca y Patentes',                   nature: D },
  { code: '52400501', name: 'Registro de Marca y Patentes',                nature: D },

  { code: '5295',    name: 'Diversos Ventas',                              nature: D },
  { code: '529505',  name: 'Descuentos Comerciales Concedidos',            nature: D },
  { code: '52950501', name: 'Descuentos y Cupones Tienda Online',          nature: D },
  { code: '529510',  name: 'Muestras y Degustaciones',                     nature: D },
  { code: '52951001', name: 'Muestras Gratis y Obsequios',                 nature: D },
  { code: '529515',  name: 'Eventos y Ferias',                             nature: D },
  { code: '52951501', name: 'Participacion en Ferias y Eventos',           nature: D },

  // 53 - No Operacionales
  { code: '53',      name: 'No Operacionales',                             nature: D },
  { code: '5305',    name: 'Financieros',                                  nature: D },
  { code: '530505',  name: 'Intereses Financieros',                        nature: D },
  { code: '53050501', name: 'Intereses Prestamos Bancarios',               nature: D },
  { code: '530510',  name: 'Gastos Bancarios',                             nature: D },
  { code: '53051001', name: 'GMF y Comisiones Bancarias',                  nature: D },
  { code: '530515',  name: 'Diferencia en Cambio',                         nature: D },
  { code: '53051501', name: 'Perdida en Diferencia de Cambio',             nature: D },

  // ═══════════════════════════════════════════════════════
  // 6 - COSTOS DE VENTAS (DEBITO)
  // ═══════════════════════════════════════════════════════
  { code: '6',       name: 'Costos de Ventas',                             nature: D },

  { code: '61',      name: 'Costo de Ventas y de Prestacion de Servicios', nature: D },
  { code: '6135',    name: 'Comercio al por Mayor y al por Menor',         nature: D },
  { code: '613505',  name: 'Costo de Mercancia Vendida Textiles',          nature: D },
  { code: '61350501', name: 'Costo Mercancia Camisetas',                   nature: D },
  { code: '61350502', name: 'Costo Mercancia Pantalones',                  nature: D },
  { code: '61350503', name: 'Costo Mercancia Vestidos',                    nature: D },
  { code: '61350504', name: 'Costo Mercancia Accesorios',                  nature: D },
  { code: '61350505', name: 'Costo Mercancia Chaquetas y Abrigos',         nature: D },
  { code: '61350506', name: 'Costo Mercancia Faldas',                      nature: D },
  { code: '61350507', name: 'Costo Mercancia Ropa Interior',               nature: D },
  { code: '61350508', name: 'Costo Mercancia Calzado',                     nature: D },
  { code: '613535',  name: 'Costo Mercancia Vendida General',              nature: D },
  { code: '61353501', name: 'Costo Mercancia Vendida Prendas General',     nature: D },
  { code: '6140',    name: 'Flete y Transporte en Compras',                nature: D },
  { code: '614005',  name: 'Flete en Compras Nacionales',                  nature: D },
  { code: '61400501', name: 'Fletes Compras de Mercancia',                 nature: D },
];

// ═══════════════════════════════════════════════════════════════
// ExpenseCategory seed data
// ═══════════════════════════════════════════════════════════════
const expenseCategories = [
  { name: 'Factura de Proveedor',           description: 'Compras de mercancia e insumos a proveedores' },
  { name: 'Servicios Publicos',             description: 'Energia, agua, telefono, internet y gas' },
  { name: 'Nomina y Prestaciones',          description: 'Salarios, seguridad social y prestaciones de ley' },
  { name: 'Arriendo',                       description: 'Arrendamiento de oficinas, bodegas y locales' },
  { name: 'Marketing y Publicidad',         description: 'Publicidad digital, redes sociales, influencers y material POP' },
  { name: 'Gastos de Envio',                description: 'Fletes, transporte y logistica de envios a clientes' },
  { name: 'Comisiones Pasarela de Pago',    description: 'Comisiones cobradas por Wompi y otras pasarelas' },
  { name: 'Gastos Menores',                 description: 'Gastos de caja menor, papeleria, aseo y cafeteria' },
  { name: 'Impuestos y Contribuciones',     description: 'ICA, predial, GMF y demas tributos' },
  { name: 'Otros',                          description: 'Gastos no clasificados en las categorias anteriores' },
];

// ═══════════════════════════════════════════════════════════════
// Main seed function
// ═══════════════════════════════════════════════════════════════
async function seedPuc() {
  console.log('--- Seeding PUC accounts ---');
  let created = 0;
  let updated = 0;

  for (const row of pucAccounts) {
    const level = getLevel(row.code);
    const parentCode = getParentCode(row.code);
    const acceptsMovements = level === 5; // Only auxiliar (leaf) accounts accept movements

    const result = await prisma.pucAccount.upsert({
      where: { code: row.code },
      update: {
        name: row.name,
        level,
        nature: row.nature,
        parent_code: parentCode,
        is_active: true,
        accepts_movements: acceptsMovements,
      },
      create: {
        code: row.code,
        name: row.name,
        level,
        nature: row.nature,
        parent_code: parentCode,
        is_active: true,
        accepts_movements: acceptsMovements,
      },
    });

    // Check if it was created or updated (id changes are unlikely on upsert, but we count them all)
    if (result) {
      // We can't easily distinguish, so just count
      created++;
    }
  }

  console.log(`  PUC accounts processed: ${created}`);
  console.log(`  Total PUC accounts in array: ${pucAccounts.length}`);
}

async function seedExpenseCategories() {
  console.log('--- Seeding Expense Categories ---');

  for (const cat of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {
        description: cat.description,
      },
      create: {
        name: cat.name,
        description: cat.description,
      },
    });
  }

  console.log(`  Expense categories processed: ${expenseCategories.length}`);
}

async function main() {
  console.log('=== Starting PUC & ExpenseCategory seed ===\n');

  await seedPuc();
  console.log('');
  await seedExpenseCategories();

  console.log('\n=== Seed completed successfully ===');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
