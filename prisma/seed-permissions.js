"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var permissions = [
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
    { code: 'sales.pos.view', name: 'Ver POS Stand Feria', group: 'Ventas' },
    { code: 'sales.pos_admin.view', name: 'Administrar Ventas Stand', group: 'Ventas' },
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
    // Documentación
    { code: 'docs.user-manual.view', name: 'Manual de Usuario', group: 'Documentación' },
    { code: 'docs.architecture.view', name: 'Doc. Arquitectura', group: 'Documentación' },
    { code: 'docs.database.view', name: 'Doc. Base de Datos', group: 'Documentación' },
    { code: 'docs.dian.view', name: 'Documentación DIAN', group: 'Documentación' },
    { code: 'docs.accounting.view', name: 'Manual Contable', group: 'Documentación' },
    { code: 'docs.consignment.view', name: 'Manual Consignación', group: 'Documentación' },
    { code: 'docs.strategic-plan.view', name: 'Plan Estratégico', group: 'Documentación' },
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, permissions_1, perm, adminRole, allPermissions, contadorRole, accountingPermissions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Seeding permissions...');
                    _i = 0, permissions_1 = permissions;
                    _a.label = 1;
                case 1:
                    if (!(_i < permissions_1.length)) return [3 /*break*/, 4];
                    perm = permissions_1[_i];
                    return [4 /*yield*/, prisma.permission.upsert({
                            where: { code: perm.code },
                            update: { name: perm.name, group: perm.group, description: perm.description },
                            create: perm,
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("Seeded ".concat(permissions.length, " permissions."));
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { name: 'Administrador' },
                            update: {},
                            create: { name: 'Administrador', description: 'Acceso total al sistema' },
                        })];
                case 5:
                    adminRole = _a.sent();
                    return [4 /*yield*/, prisma.permission.findMany()];
                case 6:
                    allPermissions = _a.sent();
                    // Clear existing role permissions for Administrador and re-create
                    return [4 /*yield*/, prisma.rolePermission.deleteMany({ where: { id_role: adminRole.id } })];
                case 7:
                    // Clear existing role permissions for Administrador and re-create
                    _a.sent();
                    return [4 /*yield*/, prisma.rolePermission.createMany({
                            data: allPermissions.map(function (p) { return ({
                                id_role: adminRole.id,
                                id_permission: p.id,
                            }); }),
                        })];
                case 8:
                    _a.sent();
                    console.log("Role \"Administrador\" (id: ".concat(adminRole.id, ") assigned ").concat(allPermissions.length, " permissions."));
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { name: 'Contador' },
                            update: {},
                            create: { name: 'Contador', description: 'Acceso al módulo contable' },
                        })];
                case 9:
                    contadorRole = _a.sent();
                    return [4 /*yield*/, prisma.permission.findMany({
                            where: { code: { startsWith: 'accounting.' } },
                        })];
                case 10:
                    accountingPermissions = _a.sent();
                    return [4 /*yield*/, prisma.rolePermission.deleteMany({ where: { id_role: contadorRole.id } })];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, prisma.rolePermission.createMany({
                            data: accountingPermissions.map(function (p) { return ({
                                id_role: contadorRole.id,
                                id_permission: p.id,
                            }); }),
                        })];
                case 12:
                    _a.sent();
                    console.log("Role \"Contador\" (id: ".concat(contadorRole.id, ") assigned ").concat(accountingPermissions.length, " permissions."));
                    console.log('Permission seeding complete.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
