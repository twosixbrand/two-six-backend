-- =================================================================
-- INSERCIÓN DE DATOS DE EJEMPLO PARA TWO-SIX-BACKEND
-- =================================================================
-- Este script puebla la base de datos con datos de muestra.
-- El orden de las inserciones es importante para respetar las claves foráneas.

-- Limpieza de tablas en orden inverso para evitar conflictos de FK (opcional, usar con precaución)
-- TRUNCATE TABLE "tracking_history", "shipment", "shipment_rate", "dian_e_invoicing", "payments", "payment_method", "return_items", "returns", "order_items", "orders", "customer", "customer_type", "identification_type", "product", "stock", "design_clothing", "design", "color", "size", "clothing", "category", "type_clothing", "collection", "year_production", "provider", "user_role", "role", "user_app", "log_error" RESTART IDENTITY CASCADE;


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
INSERT INTO "clothing" (id_type_clothing, id_category, name, gender) VALUES
('A', 1, 'Camisa de Vestir Slim Fit', 'MASCULINO'),
('G', 2, 'Jean Clásico Azul', 'UNISEX'),
('F', 1, 'Vestido de Noche Elegante', 'FEMENINO');


-- 4. Tabla "Design" (depende de Provider, Clothing, Collection, YearProduction)
--------------------------------------------------------------------
INSERT INTO "design" (id_clothing, id_collection, reference, manufactured_cost, description, quantity) VALUES
(1, 1, 'CLB-001', 35000.0, 'Camisa de lino para hombre, manga larga, ideal para climas cálidos.', 100),
(2, 1, 'JBR-002', 45000.0, 'Jean clásico de 5 bolsillos para hombre, corte recto.', 150),
(3, 2, 'VLG-001', 80000.0, 'Vestido largo de gala para mujer, perfecto para eventos formales.', 50);


-- 5. Tabla "DesignClothing" (SKUs - depende de Design, Color, Size)
--------------------------------------------------------------------
-- Camisa Lino Blanca (Diseño 1)
INSERT INTO "design_clothing" (id_design, id_color, id_size, quantity_produced, quantity_available, quantity_sold, quantity_on_consignment, quantity_under_warranty) VALUES
(1, 1, 1, 50, 40, 10, 0, 0), -- Talla S, Blanca
(1, 1, 2, 100, 80, 20, 0, 0), -- Talla M, Blanca
(1, 1, 3, 50, 30, 20, 0, 0); -- Talla L, Blanca

-- Jean Bota Recta (Diseño 2)
INSERT INTO "design_clothing" (id_design, id_color, id_size, quantity_produced, quantity_available, quantity_sold, quantity_on_consignment, quantity_under_warranty) VALUES
(2, 3, 1, 80, 70, 10, 0, 0), -- Talla S, Azul Oscuro
(2, 3, 2, 120, 100, 20, 0, 0), -- Talla M, Azul Oscuro
(2, 3, 3, 80, 60, 20, 0, 0); -- Talla L, Azul Oscuro

-- Vestido Largo de Gala (Diseño 3)
INSERT INTO "design_clothing" (id_design, id_color, id_size, quantity_produced, quantity_available, quantity_sold, quantity_on_consignment, quantity_under_warranty) VALUES
(3, 2, 1, 30, 25, 5, 0, 0), -- Talla S, Negro
(3, 4, 2, 30, 20, 10, 0, 0); -- Talla M, Rojo


-- 6. Tablas "Stock" y "Product" (dependen de DesignClothing)
--------------------------------------------------------------------
-- Stock y Productos para Camisa Lino Blanca
INSERT INTO "stock" (id_design_clothing, current_quantity, available_quantity, sold_quantity, consignment_quantity) VALUES
(1, 40, 40, 10, 0),
(2, 80, 80, 20, 0),
(3, 30, 30, 20, 0);

INSERT INTO "product" (id_design_clothing, name, description, sku, price, image_url, active, is_outlet) VALUES
(1, 'Camisa Lino Blanca Talla S', 'Camisa de lino ideal para clima cálido, corte slim.', 'CLB-S', 89900, 'https://example.com/img/clb-s.jpg', true, false),
(2, 'Camisa Lino Blanca Talla M', 'Camisa de lino ideal para clima cálido, corte slim.', 'CLB-M', 89900, 'https://example.com/img/clb-m.jpg', true, false),
(3, 'Camisa Lino Blanca Talla L', 'Camisa de lino ideal para clima cálido, corte slim.', 'CLB-L', 89900, 'https://example.com/img/clb-l.jpg', true, false);


-- Stock y Productos para Jean Bota Recta
INSERT INTO "stock" (id_design_clothing, current_quantity, available_quantity, sold_quantity, consignment_quantity) VALUES
(4, 70, 70, 10, 0),
(5, 100, 100, 20, 0),
(6, 60, 60, 20, 0);

INSERT INTO "product" (id_design_clothing, name, description, sku, price, image_url, active, is_outlet) VALUES
(4, 'Jean Clásico Bota Recta Talla S', 'Jean de 5 bolsillos, color azul oscuro.', 'JBR-S', 120000, 'https://example.com/img/jbr-s.jpg', true, false),
(5, 'Jean Clásico Bota Recta Talla M', 'Jean de 5 bolsillos, color azul oscuro.', 'JBR-M', 120000, 'https://example.com/img/jbr-m.jpg', true, false),
(6, 'Jean Clásico Bota Recta Talla L', 'Jean de 5 bolsillos, color azul oscuro.', 'JBR-L', 120000, 'https://example.com/img/jbr-l.jpg', true, false);

-- Stock y Productos para Vestido de Gala
INSERT INTO "stock" (id_design_clothing, current_quantity, available_quantity, sold_quantity, consignment_quantity) VALUES
(7, 25, 25, 5, 0),
(8, 20, 20, 10, 0);

INSERT INTO "product" (id_design_clothing, name, description, sku, price, image_url, active, is_outlet) VALUES
(7, 'Vestido de Noche Negro Talla S', 'Vestido largo elegante para ocasiones especiales.', 'VLG-S', 250000, 'https://example.com/img/vlg-s.jpg', true, false),
(8, 'Vestido de Noche Rojo Talla M', 'Vestido largo elegante para ocasiones especiales.', 'VLG-M', 250000, 'https://example.com/img/vlg-m.jpg', true, true); -- Este producto está en outlet

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

INSERT INTO "order_item" (id_order, id_product, product_name, size, color, quantity, unit_price) VALUES
(1, 2, 'Camisa Lino Blanca Talla M', 'M', 'Blanco', 1, 89900),
(1, 5, 'Jean Clásico Bota Recta Talla M', 'M', 'Azul Oscuro', 1, 120000);

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

-- Fin del script, para ejecutar los insert desde la terminal:
-- psql -U jmanmrique -d twosixDB -a -f prisma/seed.sql