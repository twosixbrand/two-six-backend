-- =================================================================
-- INSERCIÓN DE DATOS DE EJEMPLO PARA TWO-SIX-BACKEND
-- =================================================================
-- Este script puebla la base de datos con datos de muestra.
-- El orden de las inserciones es importante para respetar las claves foráneas.

-- Limpieza de tablas en orden inverso para evitar conflictos de FK (opcional, usar con precaución)
TRUNCATE TABLE "tracking_history", "shipment", "shipment_rate", "dian_e_invoicing", "payments", "payment_method", "return_item", "returns", "order_item", "order", "customer", "customer_type", "identification_type", "product", "stock", "clothing_size", "clothing_color", "design_provider", "design", "color", "size", "clothing", "category", "type_clothing", "collection", "season", "year_production", "provider", "user_role", "role", "user_app", "log_error" RESTART IDENTITY CASCADE;


-- 1. Tablas de Autenticación y Roles
--------------------------------------------------------------------
INSERT INTO "role" (name, description) VALUES
('Admin', 'Administrador con todos los permisos'),
('Manager', 'Gerente de tienda'),
('Sales', 'Vendedor'),
('Shipping', 'Encargado de envio de productos'),
('Counter', 'Rol para contador de la empresa'),
('Reader', 'Rol de solo consultas');

INSERT INTO "user_app" (name, login, email, phone, password) VALUES
('Jorge Manrique', 'jmanrique', 'jamanrique@gmail.com', '3101234567', '$2b$10$f9a8s7d6f5g4h3j2k1l0iOu9n8b7v6c5d4f3g2h1j0k9l8m7n6b5v'),
('Vanessa Buitrago', 'vbuitrago', 'vanebuitragop6@gmail.com', '21526059', '$2b$10$z1x2c3v4b5n6m7l8k9j0hOg9f8d7s6a5s4d3f2g1h2j3k4l5m6n');

INSERT INTO "user_role" (id_user_app, id_role) VALUES
(1, 1), -- Jorge es Admin
(2, 2); -- Vanessa es Manager


-- 2. Tablas de Catálogo Base (sin dependencias complejas)
--------------------------------------------------------------------
INSERT INTO "provider" (nit, company_name, email, phone, account_number, account_type, bank_name) VALUES
('900123456-7', 'Textiles de Colombia S.A.S', 'contacto@textilescol.com', '6015551234', '123-456789-0', 'Ahorros', 'Bancolombia'),
('800987654-3', 'Diseños Modernos Ltda', 'ventas@dismod.com', '6045559876', '987-654321-1', 'Corriente', 'Davivienda');

INSERT INTO "year_production" (id, name, description) VALUES
('Q', 'Año 2025', 'Producción para el año 2025'),
('R', 'Año 2026', 'Producción para el año 2026'),
('S', 'Año 2027', 'Producción para el año 2027'),
('T', 'Año 2028', 'Producción para el año 2028'),
('U', 'Año 2029', 'Producción para el año 2029'),
('V', 'Año 2030', 'Producción para el año 2030');

INSERT INTO "season" (name, description) VALUES
('1er Ciclo', 'Temporada de enero a marzo'),
('2do Ciclo', 'Temporada de abril a junio'),
('3er Ciclo', 'Temporada de julio a septiembre'),
('4to Ciclo', 'Temporada de octubre a diciembre');

INSERT INTO "collection" (id_year_production, id_season, name, description) VALUES
('Q', 1, 'Colección 1 trimestre del año 2025', 'La Renovación del Básico'),
('Q', 2, 'Colección 2 trimestre del año 2025', 'La Excelencia en la Silueta'),
('Q', 3, 'Colección 3 trimestre del año 2025', 'Regreso a la Rutina'),
('Q', 4, 'Colección 4 trimestre del año 2025', 'Cápsula de Fin de Año');

-- IDs personalizados de Char(2)
INSERT INTO "type_clothing" (id, name) VALUES
('A', 'Camiseta'),
('B', 'Polo'),
('C', 'Camisa'),
('D', 'Buso'),
('E', 'Chaqueta'),
('F', 'Pantalon Largo'),
('G', 'Jean'),
('H', 'Calzado'),
('I', 'Gorra'),
('J', 'Pantalon Corto'),
('K', 'Vestido');

INSERT INTO "category" (name) VALUES
('Ropa Parte Superior'),
('Ropa Parte Inferior'),
('Accesorios');

INSERT INTO "color" (name, hex) VALUES
('Blanco', '#FFFFFF'),
('Negro', '#000000'),
('Azul Oscuro', '#00008B'),
('Rojo', '#FF0000'),
('Blanco Hueso', '#F5F5F5'),
('Gris Claro', '#D3D3D3'),
('Azul Claro', '#ADD8E6'),
('Amarillo Claro', '#FFFFE0'),
('Verde Claro', '#90EE90'),
('Rosa Claro', '#FFB6C1'),
('Morado Claro', '#E6E6FA'),
('Naranja Claro', '#FFDAB9'),
('Cafe', '#FFDAB9'),
('Plateado','#C0C0C0'),
('Chocolate', '#D2691E');

INSERT INTO "size" (name, description) VALUES
('XS', 'Extra Pequeña'),
('S', 'Pequeña'),
('M', 'Mediana'),
('L', 'Grande'),
('XL', 'Extra Grande'),
('U', 'Único');

-- 3. Tabla "Clothing" (depende de TypeClothing y Category)
--------------------------------------------------------------------
INSERT INTO public.clothing ("name", created_at, id_category, id_type_clothing, updated_at, id, "gender") VALUES
('Crop Top Estampada Frente', '2025-11-11 08:59:53.001', 1, 'A ', '2025-11-14 02:37:49.617', 2, 'FEMENINO'::public."Gender"),
('Camiseta Estampada Espalda', '2025-11-14 02:38:59.920', 1, 'A ', '2025-11-14 02:38:59.920', 4, 'MASCULINO'::public."Gender"),
('Camiseta Estampado Frente y Manga', '2025-11-14 02:39:37.683', 1, 'A ', '2025-11-14 02:39:37.683', 5, 'MASCULINO'::public."Gender"),
('Camiseta Estampado Frente', '2025-11-14 02:40:24.851', 1, 'A ', '2025-11-14 02:40:24.851', 6, 'MASCULINO'::public."Gender"),
('Camiseta Essentials Hombre', '2025-11-11 08:59:53.001', 1, 'A ', '2025-11-14 05:38:32.444', 1, 'MASCULINO'::public."Gender"),
('Camiseta Essentials Mujer', '2025-11-11 08:59:53.001', 1, 'A ', '2025-11-14 05:38:43.034', 3, 'FEMENINO'::public."Gender");

-- Update sequence for clothing
SELECT setval('clothing_id_seq', (SELECT MAX(id) FROM "clothing"));



-- 4. Tabla "Design" (depende de Provider, Clothing, Collection, YearProduction)
--------------------------------------------------------------------
INSERT INTO public.design (id, id_clothing, id_collection, reference, manufactured_cost, created_at, updated_at, description) VALUES
(3, 3, 2, 'Q2A13', 80000.0, '2025-11-11 09:02:48.948', '2025-11-14 17:12:42.887', 'Vestido largo de gala para mujer, perfecto para eventos formales.'),
(2, 2, 1, 'Q1A12', 45000.0, '2025-11-11 09:02:48.948', '2025-11-14 17:12:48.126', 'Jean clásico de 5 bolsillos para hombre, corte recto.'),
(1, 1, 1, 'Q1A11', 35000.0, '2025-11-11 09:02:48.948', '2025-11-14 17:12:58.310', 'Camisa de lino para hombre, manga larga, ideal para climas cálidos.'),
(4, 5, 4, 'Q4A14', 35000.0, '2025-11-16 20:49:05.323', '2025-11-16 20:49:33.263', 'Camiseta Estampado Frente y Manga Hombre, tela Qtar'),
(5, 6, 4, 'Q4A15', 40000.0, '2025-11-16 20:51:33.053', '2025-11-16 20:51:33.060', 'Camiseta estampado frente, con tela Qtar, solo negra con diseño de estampado de letras de la marca en rojo. el gorila se encuentra en la manga izquierda de la camisa');

-- Update sequence for design
SELECT setval('design_id_seq', (SELECT MAX(id) FROM "design"));


-- 5. Tabla "ClothingColor" (Design + Color) y "ClothingSize" (Cantidades)
--------------------------------------------------------------------
-- Camisa Lino (Design 1) - Blanca (Color 1)
INSERT INTO "clothing_color" (id, id_design, id_color) VALUES
(1, 1, 1);

INSERT INTO "clothing_size" (id, id_clothing_color, id_size, quantity_produced, quantity_available, quantity_sold, quantity_on_consignment, quantity_under_warranty) VALUES
(1, 1, 1, 50, 40, 10, 0, 0), -- Talla S
(2, 1, 2, 100, 80, 20, 0, 0), -- Talla M
(3, 1, 3, 50, 30, 20, 0, 0); -- Talla L

-- Jean Bota Recta (Design 2) - Azul Oscuro (Color 3)
INSERT INTO "clothing_color" (id, id_design, id_color) VALUES
(2, 2, 3);

INSERT INTO "clothing_size" (id, id_clothing_color, id_size, quantity_produced, quantity_available, quantity_sold, quantity_on_consignment, quantity_under_warranty) VALUES
(4, 2, 1, 80, 70, 10, 0, 0), -- Talla S
(5, 2, 2, 120, 100, 20, 0, 0), -- Talla M
(6, 2, 3, 80, 60, 20, 0, 0); -- Talla L

-- Vestido Gala (Design 3)
-- Negro (Color 2)
INSERT INTO "clothing_color" (id, id_design, id_color) VALUES
(3, 3, 2);
-- Rojo (Color 4)
INSERT INTO "clothing_color" (id, id_design, id_color) VALUES
(4, 3, 4);

INSERT INTO "clothing_size" (id, id_clothing_color, id_size, quantity_produced, quantity_available, quantity_sold, quantity_on_consignment, quantity_under_warranty) VALUES
(7, 3, 1, 30, 25, 5, 0, 0), -- Negro S
(8, 4, 2, 30, 20, 10, 0, 0); -- Rojo M


-- 6. Tablas "Stock" y "Product" (dependen de ClothingSize)
--------------------------------------------------------------------
-- Stock y Productos para Camisa Lino Blanca
INSERT INTO "stock" (id_clothing_size, current_quantity, available_quantity, sold_quantity, consignment_quantity) VALUES
(1, 40, 40, 10, 0),
(2, 80, 80, 20, 0),
(3, 30, 30, 20, 0);

INSERT INTO "product" (id_clothing_size, sku, price, is_outlet, active) VALUES
(1, 'CLB-S', 89900, false, true),
(2, 'CLB-M', 89900, false, true),
(3, 'CLB-L', 89900, false, true);


-- Stock y Productos para Jean Bota Recta
INSERT INTO "stock" (id_clothing_size, current_quantity, available_quantity, sold_quantity, consignment_quantity) VALUES
(4, 70, 70, 10, 0),
(5, 100, 100, 20, 0),
(6, 60, 60, 20, 0);

INSERT INTO "product" (id_clothing_size, sku, price, is_outlet, active) VALUES
(4, 'JBR-S', 120000, false, true),
(5, 'JBR-M', 120000, false, true),
(6, 'JBR-L', 120000, false, true);

-- Stock y Productos para Vestido de Gala
INSERT INTO "stock" (id_clothing_size, current_quantity, available_quantity, sold_quantity, consignment_quantity) VALUES
(7, 25, 25, 5, 0),
(8, 20, 20, 10, 0);

INSERT INTO "product" (id_clothing_size, sku, price, is_outlet, active) VALUES
(7, 'VLG-S', 250000, false, true),
(8, 'VLG-M', 250000, true, true); -- Outlet

-- 7. Tablas de Clientes
--------------------------------------------------------------------
INSERT INTO "customer_type" (name, created_at) VALUES
('Persona Natural', NOW()),
('Persona Juridica', NOW());

INSERT INTO "identification_type" (code, name, created_at, updated_at) VALUES
('CC', 'Cédula de Ciudadanía', NOW(), NOW()),
('NIT', 'Número de Identificación Tributaria', NOW(), NOW()),
('CE', 'Cédula de Extranjería', NOW(), NOW()),
('PAS', 'Pasaporte', NOW(), NOW()),
('TI', 'Tarjeta de Identidad', NOW(), NOW());

INSERT INTO "customer" (id_customer_type, id_identification_type, name, email, current_phone_number, responsable_for_vat, shipping_address, city, state, postal_code, country) VALUES
(1, 1, 'Carlos Ramirez', 'carlos.r@email.com', '3209876543', false, 'Calle 100 # 20-30', 'Bogotá', 'Cundinamarca', '110111', 'Colombia'),
(2, 2, 'Moda Express SAS', 'compras@modaexpress.co', '3001112233', true, 'Carrera 45 # 10-15 Bodega 5', 'Medellín', 'Antioquia', '050001', 'Colombia');


-- 8. Tablas de Órdenes y Pagos
--------------------------------------------------------------------
INSERT INTO "order" (id_customer, order_date, status, iva, shipping_cost, total_payment, purchase_date, is_paid, shipping_address) VALUES
(1, '2024-05-10 10:30:00', 'Entregado', 39881, 10000, 219900, '2024-05-10 10:32:00', true, 'Calle 100 # 20-30, Bogotá');

INSERT INTO "order_item" (id_order, id_product, product_name, size, color, quantity, unit_price, iva_item) VALUES
(1, 2, 'Camisa Lino Blanca Talla M', 'M', 'Blanco', 1, 89900, 17081),
(1, 5, 'Jean Clásico Bota Recta Talla M', 'M', 'Azul Oscuro', 1, 120000, 22800);

INSERT INTO "payment_method" (name, enabled, created_at) VALUES
('Tarjeta de Crédito', true, NOW()),
('PSE', true, NOW()),
('Efectivo', false, NOW());

INSERT INTO "payments" (id_order, id_customer, id_payment_method, status, transaction_date, transaction_reference, amount) VALUES
(1, 1, 1, 'Aprobado', '2024-05-10 10:32:00', 'TXN123ABC456', 249781);


-- 9. Tablas de Envíos
--------------------------------------------------------------------
INSERT INTO "shipping_provider" (name, set_tracking_base, active) VALUES
('Servientrega', 'https://www.servientrega.com/wps/portal/rastreo-envio/!ut/p/z1/04.../?guia=', true),
('Interrapidísimo', 'https://www.interrapidisimo.com/sigue-tu-envio/?guia=', true);

INSERT INTO "shipment" (id_order, id_shipping_provider, guide_number, status, estimated_delivery_date, delivery_date) VALUES
(1, 1, '1234567890', 'Entregado', '2024-05-13', '2024-05-12 15:00:00');

INSERT INTO "tracking_history" (id_shipment, status, update_date, location, provider_code) VALUES
(1, 'En centro de distribución', '2024-05-11 08:00:00', 'Bogotá, Colombia', 'BOG-CEDI'),
(1, 'En reparto', '2024-05-12 09:00:00', 'Bogotá, Colombia', 'BOG-REP'),
(1, 'Entregado', '2024-05-12 15:00:00', 'Bogotá, Colombia', 'ENTREGADO-OK');

-- Fin del script
-- =================================================================

