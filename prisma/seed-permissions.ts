import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PermissionSeed {
  code: string;
  name: string;
  group: string;
  description?: string;
}

const permissions: PermissionSeed[] = [
  // ═══════════════════════════════════════════════════════
  // Contabilidad
  // ═══════════════════════════════════════════════════════
  { code: 'accounting.puc.view', name: 'Ver Plan de Cuentas', group: 'Contabilidad' },
  { code: 'accounting.puc.manage', name: 'Gestionar Plan de Cuentas', group: 'Contabilidad' },
  { code: 'accounting.journal.view', name: 'Ver Asientos Contables', group: 'Contabilidad' },
  { code: 'accounting.journal.create', name: 'Crear Asientos Contables', group: 'Contabilidad' },
  { code: 'accounting.expenses.view', name: 'Ver Gastos', group: 'Contabilidad' },
  { code: 'accounting.expenses.manage', name: 'Gestionar Gastos', group: 'Contabilidad' },
  { code: 'accounting.payroll.view', name: 'Ver Nómina', group: 'Contabilidad' },
  { code: 'accounting.payroll.manage', name: 'Gestionar Nómina', group: 'Contabilidad' },
  { code: 'accounting.bank.view', name: 'Ver Bancos y Conciliación', group: 'Contabilidad' },
  { code: 'accounting.bank.manage', name: 'Gestionar Bancos y Conciliación', group: 'Contabilidad' },
  { code: 'accounting.closing.manage', name: 'Gestionar Cierre Contable', group: 'Contabilidad' },
  { code: 'accounting.reports.view', name: 'Ver Reportes Contables', group: 'Contabilidad' },
  { code: 'accounting.tax.view', name: 'Ver Impuestos', group: 'Contabilidad' },
  { code: 'accounting.budget.view', name: 'Ver Presupuesto', group: 'Contabilidad' },
  { code: 'accounting.budget.manage', name: 'Gestionar Presupuesto', group: 'Contabilidad' },
  { code: 'accounting.assets.view', name: 'Ver Activos Fijos', group: 'Contabilidad' },
  { code: 'accounting.assets.manage', name: 'Gestionar Activos Fijos', group: 'Contabilidad' },
  { code: 'accounting.withholding.view', name: 'Ver Certificados de Retención', group: 'Contabilidad' },
  { code: 'accounting.withholding.manage', name: 'Gestionar Certificados de Retención', group: 'Contabilidad' },
  { code: 'accounting.exogena.view', name: 'Ver Información Exógena', group: 'Contabilidad' },
  { code: 'accounting.audit.view', name: 'Ver Auditoría Contable', group: 'Contabilidad' },
  { code: 'accounting.indicators.view', name: 'Ver Indicadores Financieros', group: 'Contabilidad' },
  { code: 'accounting.export', name: 'Exportar Datos Contables', group: 'Contabilidad' },

  { code: 'accounting.alerts.view', name: 'Ver Alertas Contables', group: 'Contabilidad' },
  { code: 'accounting.settings.manage', name: 'Gestionar Configuración Contable', group: 'Contabilidad' },

  // ═══════════════════════════════════════════════════════
  // Consignación
  // ═══════════════════════════════════════════════════════
  { code: 'consignment.warehouses.view', name: 'Ver Bodegas de Consignación', group: 'Consignación' },
  { code: 'consignment.warehouses.manage', name: 'Gestionar Bodegas de Consignación', group: 'Consignación' },
  { code: 'consignment.prices.view', name: 'Ver Precios de Consignación', group: 'Consignación' },
  { code: 'consignment.prices.manage', name: 'Gestionar Precios de Consignación', group: 'Consignación' },
  { code: 'consignment.dispatches.view', name: 'Ver Despachos', group: 'Consignación' },
  { code: 'consignment.dispatches.manage', name: 'Gestionar Despachos (enviar, cancelar)', group: 'Consignación' },
  { code: 'consignment.sellout.view', name: 'Ver Sell-out', group: 'Consignación' },
  { code: 'consignment.sellout.process', name: 'Procesar Sell-out + DIAN', group: 'Consignación' },
  { code: 'consignment.sell-reports.view', name: 'Ver Reportes de Venta del Cliente', group: 'Consignación' },
  { code: 'consignment.sell-reports.manage', name: 'Aprobar/Rechazar Reportes de Venta', group: 'Consignación' },
  { code: 'consignment.returns.view', name: 'Ver Devoluciones/Garantías', group: 'Consignación' },
  { code: 'consignment.returns.manage', name: 'Gestionar Devoluciones/Garantías', group: 'Consignación' },
  { code: 'consignment.cycle-counts.view', name: 'Ver Conteos Cíclicos', group: 'Consignación' },
  { code: 'consignment.cycle-counts.manage', name: 'Gestionar Conteos Cíclicos y Merma', group: 'Consignación' },
  { code: 'consignment.reports.view', name: 'Ver Reportes de Consignación', group: 'Consignación' },

  // ═══════════════════════════════════════════════════════
  // Inventario
  // ═══════════════════════════════════════════════════════
  { code: 'inventory.clothing.view', name: 'Ver Prendas', group: 'Inventario' },
  { code: 'inventory.clothing.manage', name: 'Gestionar Prendas', group: 'Inventario' },
  { code: 'inventory.products.view', name: 'Ver Productos', group: 'Inventario' },
  { code: 'inventory.products.manage', name: 'Gestionar Productos', group: 'Inventario' },
  { code: 'inventory.stock.view', name: 'Ver Stock', group: 'Inventario' },
  { code: 'inventory.images.manage', name: 'Gestionar Imágenes', group: 'Inventario' },

  // ═══════════════════════════════════════════════════════
  // Ventas
  // ═══════════════════════════════════════════════════════
  { code: 'sales.orders.view', name: 'Ver Pedidos', group: 'Ventas' },
  { code: 'sales.orders.manage', name: 'Gestionar Pedidos', group: 'Ventas' },
  { code: 'sales.customers.view', name: 'Ver Clientes', group: 'Ventas' },
  { code: 'sales.customers.manage', name: 'Gestionar Clientes', group: 'Ventas' },
  { code: 'sales.reports.view', name: 'Ver Reportes de Ventas', group: 'Ventas' },
  { code: 'sales.dian.view', name: 'Ver Facturación DIAN', group: 'Ventas' },
  { code: 'sales.dian.manage', name: 'Gestionar Facturación DIAN', group: 'Ventas' },

  // ═══════════════════════════════════════════════════════
  // Administración
  // ═══════════════════════════════════════════════════════
  { code: 'admin.users.view', name: 'Ver Usuarios', group: 'Administración' },
  { code: 'admin.users.manage', name: 'Gestionar Usuarios', group: 'Administración' },
  { code: 'admin.roles.view', name: 'Ver Roles', group: 'Administración' },
  { code: 'admin.roles.manage', name: 'Gestionar Roles', group: 'Administración' },
  { code: 'admin.permissions.manage', name: 'Gestionar Permisos', group: 'Administración' },
  { code: 'admin.logs.view', name: 'Ver Logs del Sistema', group: 'Administración' },
  { code: 'admin.settings.manage', name: 'Gestionar Configuración', group: 'Administración' },

  // ═══════════════════════════════════════════════════════
  // Integraciones / APIs
  // ═══════════════════════════════════════════════════════
  { code: 'integrations.google-merchant.view', name: 'Ver Google Merchant Feed', group: 'Integraciones' },
  { code: 'integrations.google-merchant.manage', name: 'Gestionar Google Merchant Feed', group: 'Integraciones' },
  { code: 'integrations.facebook-feed.view', name: 'Ver Facebook Feed', group: 'Integraciones' },
  { code: 'integrations.facebook-feed.manage', name: 'Gestionar Facebook Feed', group: 'Integraciones' },

  // ═══════════════════════════════════════════════════════
  // Catálogo
  // ═══════════════════════════════════════════════════════
  { code: 'catalog.categories.view', name: 'Ver Categorías', group: 'Catálogo' },
  { code: 'catalog.categories.manage', name: 'Gestionar Categorías', group: 'Catálogo' },
  { code: 'catalog.collections.view', name: 'Ver Colecciones', group: 'Catálogo' },
  { code: 'catalog.collections.manage', name: 'Gestionar Colecciones', group: 'Catálogo' },
  { code: 'catalog.designs.view', name: 'Ver Diseños', group: 'Catálogo' },
  { code: 'catalog.designs.manage', name: 'Gestionar Diseños', group: 'Catálogo' },
  { code: 'catalog.colors.view', name: 'Ver Colores', group: 'Catálogo' },
  { code: 'catalog.colors.manage', name: 'Gestionar Colores', group: 'Catálogo' },
  { code: 'catalog.sizes.view', name: 'Ver Tallas', group: 'Catálogo' },
  { code: 'catalog.sizes.manage', name: 'Gestionar Tallas', group: 'Catálogo' },
  { code: 'catalog.seasons.view', name: 'Ver Temporadas', group: 'Catálogo' },
  { code: 'catalog.seasons.manage', name: 'Gestionar Temporadas', group: 'Catálogo' },
  { code: 'catalog.providers.view', name: 'Ver Proveedores', group: 'Catálogo' },
  { code: 'catalog.providers.manage', name: 'Gestionar Proveedores', group: 'Catálogo' },
];

async function main() {
  console.log('Seeding permissions...');

  // Upsert all permissions
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, group: perm.group, description: perm.description },
      create: perm,
    });
  }

  console.log(`Seeded ${permissions.length} permissions.`);

  // ═══════════════════════════════════════════════════════
  // Seed default roles with permissions
  // ═══════════════════════════════════════════════════════

  // 1. Administrador — ALL permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {},
    create: { name: 'Administrador', description: 'Acceso total al sistema' },
  });

  const allPermissions = await prisma.permission.findMany();

  // Clear existing role permissions for Administrador and re-create
  await prisma.rolePermission.deleteMany({ where: { id_role: adminRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({
      id_role: adminRole.id,
      id_permission: p.id,
    })),
  });

  console.log(`Role "Administrador" (id: ${adminRole.id}) assigned ${allPermissions.length} permissions.`);

  // 2. Contador — all accounting.* permissions
  const contadorRole = await prisma.role.upsert({
    where: { name: 'Contador' },
    update: {},
    create: { name: 'Contador', description: 'Acceso al módulo contable' },
  });

  const accountingPermissions = await prisma.permission.findMany({
    where: { code: { startsWith: 'accounting.' } },
  });

  await prisma.rolePermission.deleteMany({ where: { id_role: contadorRole.id } });
  await prisma.rolePermission.createMany({
    data: accountingPermissions.map((p) => ({
      id_role: contadorRole.id,
      id_permission: p.id,
    })),
  });

  console.log(`Role "Contador" (id: ${contadorRole.id}) assigned ${accountingPermissions.length} permissions.`);

  console.log('Permission seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
