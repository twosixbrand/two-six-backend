-- Archivo de seed para poblar la base de datos de la tienda de ropa

-- Roles de Usuario
INSERT INTO "role" (id_role, name, description, created_at, updated_at) VALUES
(1, 'ADMIN', 'Administrador con todos los permisos', NOW(), NOW()),
(2, 'VENDEDOR', 'Vendedor con permisos para gestionar ventas y clientes', NOW(), NOW());

-- Usuarios de la Aplicación
INSERT INTO "user_app" (id_user_app, name, login, email, phone, created_at, updated_at) VALUES
(1, 'Admin User', 'admin', 'admin@example.com', '3001234567', NOW(), NOW()),
(2, 'Sales Person', 'vendedor1', 'vendedor1@example.com', '3011234567', NOW(), NOW());

-- Asignación de Roles a Usuarios
INSERT INTO "user_role" (id_user_app, id_role, created_at, updated_at) VALUES
(1, 1, NOW(), NOW()),
(2, 2, NOW(), NOW());

-- Proveedores
INSERT INTO "provider" (nit, company_name, email, phone, account_number, account_type, bank_name, created_at, updated_at) VALUES
('900123456-1', 'Textiles Modernos S.A.S', 'contacto@textilesmodernos.com', '3109876543', '123-456789-01', 'Ahorros', 'Bancolombia', NOW(), NOW()),
('800987654-2', 'Diseños Andinos Ltda.', 'ventas@disenosandinos.com', '3201234567', '987-654321-02', 'Corriente', 'Davivienda', NOW(), NOW());

-- Año de Producción y Colección
INSERT INTO "year_production" (id, name, description, created_at, updated_at) VALUES
(1, '2024', 'Producción del año 2024', NOW(), NOW());

INSERT INTO "collection" (id, season, description, created_at, updated_at) VALUES
(1, 'Verano 2024', 'Colección vibrante para la temporada de verano', NOW(), NOW());

-- Tipos de Prenda y Categorías
INSERT INTO "type_clothing" (id, name, created_at, updated_at) VALUES
(1, 'Parte Superior', NOW(), NOW()),
(2, 'Parte Inferior', NOW(), NOW());

INSERT INTO "category" (id, name, created_at, updated_at) VALUES
(1, 'Camisetas', NOW(), NOW()),
(2, 'Pantalones', NOW(), NOW());

-- Prendas
INSERT INTO "clothing" (id, id_type_clothing, id_category, name, gender, created_at, updated_at) VALUES
(1, 1, 1, 'Camiseta Básica', 'UNISEX', NOW(), NOW()),
(2, 2, 2, 'Jean Clásico', 'UNISEX', NOW(), NOW());

-- Colores y Tallas
INSERT INTO "color" (id, name, hex, created_at, updated_at) VALUES
(1, 'Blanco', '#FFFFFF', NOW(), NOW()),
(2, 'Negro', '#000000', NOW(), NOW()),
(3, 'Azul Oscuro', '#00008B', NOW(), NOW());

INSERT INTO "size" (id, name, description, created_at, updated_at) VALUES
(1, 'S', 'Talla Pequeña', NOW(), NOW()),
(2, 'M', 'Talla Mediana', NOW(), NOW()),
(3, 'L', 'Talla Grande', NOW(), NOW());

-- Diseños
INSERT INTO "design" (id, id_provider, id_clothing, id_collection, id_year_production, name, reference, manufactured_cost, created_at, updated_at) VALUES
(1, '900123456-1', 1, 1, 1, 'Camiseta Algodón Premium', 'REF-CAM-001', 15000.00, NOW(), NOW()),
(2, '800987654-2', 2, 1, 1, 'Jean Denim Clásico', 'REF-JEA-001', 45000.00, NOW(), NOW());

-- Variantes de Diseño (Prenda-Diseño)
-- Camiseta Blanca S, M, L
INSERT INTO "design_clothing" (id, id_color, id_size, id_design, quantity_produced, quantity_available, quantity_sold, quantity_on_consignment, created_at, updated_at) VALUES
(1, 1, 1, 1, 50, 50, 0, 0, NOW(), NOW()),
(2, 1, 2, 1, 100, 100, 0, 0, NOW(), NOW()),
(3, 1, 3, 1, 50, 50, 0, 0, NOW(), NOW());

-- Camiseta Negra S, M, L
INSERT INTO "design_clothing" (id, id_color, id_size, id_design, quantity_produced, quantity_available, quantity_sold, quantity_on_consignment, created_at, updated_at) VALUES
(4, 2, 1, 1, 50, 50, 0, 0, NOW(), NOW()),
(5, 2, 2, 1, 100, 100, 0, 0, NOW(), NOW()),
(6, 2, 3, 1, 50, 50, 0, 0, NOW(), NOW());

-- Jean Azul Oscuro S, M, L
INSERT INTO "design_clothing" (id, id_color, id_size, id_design, quantity_produced, quantity_available, quantity_sold, quantity_on_consignment, created_at, updated_at) VALUES
(7, 3, 1, 2, 30, 30, 0, 0, NOW(), NOW()),
(8, 3, 2, 2, 60, 60, 0, 0, NOW(), NOW()),
(9, 3, 3, 2, 30, 30, 0, 0, NOW(), NOW());

-- Stock Inicial
-- Stock para Camisetas Blancas
INSERT INTO "stock" (id_design_clothing, current_quantity, available_quantity, sold_quantity, consignment_quantity, created_at, updated_at) VALUES
(1, 50, 50, 0, 0, NOW(), NOW()),
(2, 100, 100, 0, 0, NOW(), NOW()),
(3, 50, 50, 0, 0, NOW(), NOW());

-- Stock para Camisetas Negras
INSERT INTO "stock" (id_design_clothing, current_quantity, available_quantity, sold_quantity, consignment_quantity, created_at, updated_at) VALUES
(4, 50, 50, 0, 0, NOW(), NOW()),
(5, 100, 100, 0, 0, NOW(), NOW()),
(6, 50, 50, 0, 0, NOW(), NOW());

-- Stock para Jeans
INSERT INTO "stock" (id_design_clothing, current_quantity, available_quantity, sold_quantity, consignment_quantity, created_at, updated_at) VALUES
(7, 30, 30, 0, 0, NOW(), NOW()),
(8, 60, 60, 0, 0, NOW(), NOW()),
(9, 30, 30, 0, 0, NOW(), NOW());

-- Productos para la tienda
-- Producto para Camiseta Blanca Talla M
INSERT INTO "product" (id, id_design_clothing, name, description, price, active, outlet, created_at, updated_at) VALUES
(1, 2, 'Camiseta Blanca Premium', 'Camiseta de algodón suave y duradero, perfecta para cualquier ocasión.', 35000.00, true, false, NOW(), NOW());

-- Producto para Jean Azul Oscuro Talla M
INSERT INTO "product" (id, id_design_clothing, name, description, price, active, outlet, created_at, updated_at) VALUES
(2, 8, 'Jean Clásico Azul Oscuro', 'Jean de corte clásico, cómodo y versátil.', 95000.00, true, false, NOW(), NOW());

-- Tipos de Cliente e Identificación
INSERT INTO "customer_type" (id, name, created_at, updated_at) VALUES
(1, 'Minorista', NOW(), NOW()),
(2, 'Mayorista', NOW(), NOW());

INSERT INTO "identification_type" (id, name, created_at, updated_at) VALUES
(1, 'Cédula de Ciudadanía', NOW(), NOW()),
(2, 'NIT', NOW(), NOW());
_
-- Cliente de ejemplo
INSERT INTO "customer" (id_customer, id_customer_type, id_identification_type, name, email, current_phone_number, responsable_for_vat, shipping_address, city, state, postal_code, country, created_at, updated_at) VALUES
(1, 1, 1, 'Juan Perez', 'juan.perez@email.com', '3151234567', false, 'Calle 100 # 20-30', 'Bogotá', 'Cundinamarca', '110111', 'Colombia', NOW(), NOW());

-- Métodos de Pago
INSERT INTO "payment_method" (id, name, enabled, created_at, updated_at) VALUES
(1, 'Tarjeta de Crédito', true, NOW(), NOW()),
(2, 'PSE', true, NOW(), NOW()),
(3, 'Efectivo', false, NOW(), NOW());

-- Orden de ejemplo
INSERT INTO "orders" (id_order, id_customer, order_date, status, sub_total, tax, total, is_paid, payment_method, shipping_address, created_at, updated_at) VALUES
(1, 1, NOW(), 'PROCESANDO', 130000.00, 24700.00, 154700.00, true, 'Tarjeta de Crédito', 'Calle 100 # 20-30', NOW(), NOW());

-- Items de la Orden
INSERT INTO "order_items" (id_order, id_product, product_name, size, color, quantity, unit_price, created_at, updated_at) VALUES
(1, 1, 'Camiseta Blanca Premium', 'M', 'Blanco', 1, 35000.00, NOW(), NOW()),
(1, 2, 'Jean Clásico Azul Oscuro', 'M', 'Azul Oscuro', 1, 95000.00, NOW(), NOW());

-- Pago de la Orden
INSERT INTO "payments" (id_order, id_customer, id_payment_method, status, transaction_date, transaction_reference, amount, created_at, updated_at) VALUES
(1, 1, 1, 'APROBADO', NOW(), 'TXN12345ABC', 154700.00, NOW(), NOW());

-- Proveedor de Envío
INSERT INTO "shipping_provider" (id, name, set_tracking_base, active, created_at, updated_at) VALUES
(1, 'Interrapidísimo', 'https://www.interrapidisimo.com/sigue-tu-envio/?guia=', true, NOW(), NOW());

-- Envío de la Orden
INSERT INTO "shipment" (id_order, id_shipping_provider, guide_number, status, estimated_delivery_date, created_at, updated_at) VALUES
(1, 1, 'GUIA-XYZ-98765', 'EN_TRANSITO', NOW() + interval '3 day', NOW(), NOW());

-- Historial de Seguimiento del Envío
INSERT INTO "tracking_history" (id_shipment, status, update_date, location, provider_code, created_at, updated_at) VALUES
(1, 'EN_BODEGA_ORIGEN', NOW() - interval '1 hour', 'BOGOTA', '101', NOW(), NOW()),
(1, 'EN_TRANSITO', NOW(), 'BOGOTA', '201', NOW(), NOW());

-- Actualizar los IDs de las secuencias para que las nuevas inserciones no fallen
-- Esto es importante si estás insertando IDs manualmente

