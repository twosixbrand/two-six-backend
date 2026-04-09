SET session_replication_role = replica;
--
-- PostgreSQL database dump
--

\restrict iV0Ldtvzue9MM0KqP1oWG1q6LFnKc2ZgXmV1qTRAFHYJkL3J7nCv54GvxT6K8Lu

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: accounting_audit_log; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.accounting_audit_log DISABLE TRIGGER ALL;



ALTER TABLE public.accounting_audit_log ENABLE TRIGGER ALL;

--
-- Data for Name: accounting_closing; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.accounting_closing DISABLE TRIGGER ALL;



ALTER TABLE public.accounting_closing ENABLE TRIGGER ALL;

--
-- Data for Name: customer_type; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.customer_type DISABLE TRIGGER ALL;



ALTER TABLE public.customer_type ENABLE TRIGGER ALL;

--
-- Data for Name: identification_type; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.identification_type DISABLE TRIGGER ALL;



ALTER TABLE public.identification_type ENABLE TRIGGER ALL;

--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.customer DISABLE TRIGGER ALL;

INSERT INTO public.customer VALUES (1, 1, 'juliana manrique j', 'julymanrij@gmail.com', '3015560148', false, 'Carrera 26D # 36A sur - 80', 'Envigado', 'Antioquia', '000000', 'Colombia', '2025-12-16 02:37:52.06', '2026-03-11 03:13:48.35', 2, NULL, NULL, NULL, true);
INSERT INTO public.customer VALUES (1, 1, 'Vanessa Buitrago', 'vanebuitragop6@gmail.com', '315 2959282', false, 'cra 50a n 24 51  Urbanizacion Suramerica Park', 'Itagüí', 'Antioquia', '000000', 'Colombia', '2026-03-04 16:08:54.099', '2026-04-02 20:05:42.268', 4, NULL, NULL, '21526059', true);
INSERT INTO public.customer VALUES (1, 1, 'Jorge Andres Manrique', 'jamanrique@gmail.com', '3013975582', false, 'Cr 50 A # 24 - 51', 'Itagüí', 'Antioquia', '000000', 'Colombia', '2025-12-16 02:59:03.13', '2026-04-02 20:05:44.658', 3, NULL, NULL, '98669308', true);


ALTER TABLE public.customer ENABLE TRIGGER ALL;

--
-- Data for Name: address; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.address DISABLE TRIGGER ALL;



ALTER TABLE public.address ENABLE TRIGGER ALL;

--
-- Data for Name: bank_account; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.bank_account DISABLE TRIGGER ALL;



ALTER TABLE public.bank_account ENABLE TRIGGER ALL;

--
-- Data for Name: bank_statement; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.bank_statement DISABLE TRIGGER ALL;



ALTER TABLE public.bank_statement ENABLE TRIGGER ALL;

--
-- Data for Name: bank_transaction; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.bank_transaction DISABLE TRIGGER ALL;



ALTER TABLE public.bank_transaction ENABLE TRIGGER ALL;

--
-- Data for Name: puc_account; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.puc_account DISABLE TRIGGER ALL;



ALTER TABLE public.puc_account ENABLE TRIGGER ALL;

--
-- Data for Name: budget; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.budget DISABLE TRIGGER ALL;



ALTER TABLE public.budget ENABLE TRIGGER ALL;

--
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.category DISABLE TRIGGER ALL;

INSERT INTO public.category VALUES ('Ropa Parte Superior', '2025-11-19 17:14:03.893', 1, NULL);
INSERT INTO public.category VALUES ('Ropa Parte Inferior', '2025-11-19 17:14:03.893', 2, NULL);
INSERT INTO public.category VALUES ('Accesorios', '2025-11-19 17:14:03.893', 3, NULL);


ALTER TABLE public.category ENABLE TRIGGER ALL;

--
-- Data for Name: department; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.department DISABLE TRIGGER ALL;



ALTER TABLE public.department ENABLE TRIGGER ALL;

--
-- Data for Name: city; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.city DISABLE TRIGGER ALL;



ALTER TABLE public.city ENABLE TRIGGER ALL;

--
-- Data for Name: gender; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.gender DISABLE TRIGGER ALL;

INSERT INTO public.gender VALUES (1, 'MASCULINO', '2026-01-23 11:01:22.253', '2026-01-23 11:01:22.253');
INSERT INTO public.gender VALUES (2, 'FEMENINO', '2026-01-23 11:01:22.253', '2026-01-23 11:01:22.253');
INSERT INTO public.gender VALUES (3, 'UNISEX', '2026-01-23 11:01:22.253', '2026-01-23 11:01:22.253');


ALTER TABLE public.gender ENABLE TRIGGER ALL;

--
-- Data for Name: type_clothing; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.type_clothing DISABLE TRIGGER ALL;

INSERT INTO public.type_clothing VALUES ('A ', 'Camiseta', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('B ', 'Polo', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('C ', 'Camisa', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('D ', 'Buso', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('E ', 'Chaqueta', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('F ', 'Pantalon Largo', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('G ', 'Jean', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('H ', 'Calzado', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('I ', 'Gorra', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('J ', 'Pantalon Corto', '2025-11-19 17:14:03.893', NULL);
INSERT INTO public.type_clothing VALUES ('K ', 'Vestido', '2025-11-19 17:14:03.893', NULL);


ALTER TABLE public.type_clothing ENABLE TRIGGER ALL;

--
-- Data for Name: clothing; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.clothing DISABLE TRIGGER ALL;

INSERT INTO public.clothing VALUES ('Camiseta Essentials', '2025-11-11 08:59:53.001', 1, 'A ', '2026-03-03 02:36:18.006', 1, 3);
INSERT INTO public.clothing VALUES ('Crop Top Estampada Frente', '2025-11-11 08:59:53.001', 1, 'A ', '2026-03-03 02:36:36.897', 2, 2);
INSERT INTO public.clothing VALUES ('Camiseta Estampada Espalda', '2025-11-14 02:38:59.92', 1, 'A ', '2026-03-03 02:36:49.649', 4, 1);
INSERT INTO public.clothing VALUES ('Camiseta Estampado Frente y Manga', '2025-11-14 02:39:37.683', 1, 'A ', '2026-03-03 02:36:59.697', 5, 1);
INSERT INTO public.clothing VALUES ('Camiseta Estampado Frente', '2025-11-14 02:40:24.851', 1, 'A ', '2026-03-03 02:37:09.57', 6, 1);
INSERT INTO public.clothing VALUES ('Camiseta Essentials Mujer', '2025-11-11 08:59:53.001', 1, 'A ', '2026-03-03 02:37:25.81', 3, 2);


ALTER TABLE public.clothing ENABLE TRIGGER ALL;

--
-- Data for Name: season; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.season DISABLE TRIGGER ALL;

INSERT INTO public.season VALUES (1, '1er Ciclo', 'Temporada de enero a marzo', '2025-11-19 17:12:09.175', NULL);
INSERT INTO public.season VALUES (2, '2do Ciclo', 'Temporada de abril a junio', '2025-11-19 17:12:09.175', NULL);
INSERT INTO public.season VALUES (3, '3er Ciclo', 'Temporada de julio a septiembre', '2025-11-19 17:12:09.175', NULL);
INSERT INTO public.season VALUES (4, '4to Ciclo', 'Temporada de octubre a diciembre', '2025-11-19 17:12:09.175', NULL);


ALTER TABLE public.season ENABLE TRIGGER ALL;

--
-- Data for Name: year_production; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.year_production DISABLE TRIGGER ALL;

INSERT INTO public.year_production VALUES ('2025-11-11 08:59:52.982', 'Producción para el año 2025', 'Q ', 'Año 2025', NULL);
INSERT INTO public.year_production VALUES ('2025-11-11 08:59:52.982', 'Producción para el año 2026', 'R ', 'Año 2026', NULL);
INSERT INTO public.year_production VALUES ('2025-11-11 08:59:52.982', 'Producción para el año 2027', 'S ', 'Año 2027', NULL);
INSERT INTO public.year_production VALUES ('2025-11-11 08:59:52.982', 'Producción para el año 2028', 'T ', 'Año 2028', NULL);
INSERT INTO public.year_production VALUES ('2025-11-11 08:59:52.982', 'Producción para el año 2029', 'U ', 'Año 2029', NULL);
INSERT INTO public.year_production VALUES ('2025-11-11 08:59:52.982', 'Producción para el año 2030', 'V ', 'Año 2030', NULL);


ALTER TABLE public.year_production ENABLE TRIGGER ALL;

--
-- Data for Name: collection; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.collection DISABLE TRIGGER ALL;

INSERT INTO public.collection VALUES ('La Renovación del Básico', '2025-11-19 17:12:09.175', 1, NULL, 1, 'Q ', 'Colección 1 trimestre del año 2025');
INSERT INTO public.collection VALUES ('La Excelencia en la Silueta', '2025-11-19 17:12:09.175', 2, NULL, 2, 'Q ', 'Colección 2 trimestre del año 2025');
INSERT INTO public.collection VALUES ('Regreso a la Rutina', '2025-11-19 17:12:09.175', 3, NULL, 3, 'Q ', 'Colección 3 trimestre del año 2025');
INSERT INTO public.collection VALUES ('Cápsula de Fin de Año', '2025-11-19 17:12:09.175', 4, NULL, 4, 'Q ', 'Colección 4 trimestre del año 2025');


ALTER TABLE public.collection ENABLE TRIGGER ALL;

--
-- Data for Name: color; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.color DISABLE TRIGGER ALL;

INSERT INTO public.color VALUES (1, 'Blanco', '2025-11-19 17:15:43.085', NULL, '#FFFFFF');
INSERT INTO public.color VALUES (2, 'Negro', '2025-11-19 17:15:43.085', NULL, '#000000');
INSERT INTO public.color VALUES (8, 'Beige', '2025-11-19 17:15:43.085', NULL, '#F5F5DC');
INSERT INTO public.color VALUES (6, 'Gris', '2025-11-19 17:15:43.085', '2026-03-03 02:48:08.452', '#8d8785');
INSERT INTO public.color VALUES (12, 'Café', '2025-11-19 17:15:43.085', '2026-03-03 02:48:44.919', '#6c443d');


ALTER TABLE public.color ENABLE TRIGGER ALL;

--
-- Data for Name: design; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.design DISABLE TRIGGER ALL;

INSERT INTO public.design VALUES (3, 3, 4, 'Q4A13', 35000, '2025-11-11 09:02:48.948', '2026-04-05 14:39:33.11', 'Descubre la combinación perfecta de confort y actitud con la camiseta Essentials de Two Six. Pensada para tu ritmo de vida, está confeccionada en Tela Fría de alta calidad, un tejido que garantiza una sensación increíblemente fresca y ligera, ideal para mantenerte cómoda todo el día, incluso en movimiento.
El diseño presenta el distintivo estampado localizado del gorila, símbolo de fuerza y autenticidad, junto con el identificador. Su silueta regular se adapta a tu figura sin ser ajustada, ofreciendo un look casual, versátil y con un inconfundible carácter urbano.
Características Esenciales:
Tejido: Tela Fría Premium (Máxima transpirabilidad y sensación de frescura).
Diseño: Estampado localizado del Gorila en el punto corazón.
Corte: Silueta Regular, cuello redondo y manga corta.
Comodidad: Ideal para el uso diario, 
Colores Disponibles: Blanco y Negro.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/3/idDesign-3.jpeg');
INSERT INTO public.design VALUES (6, 4, 4, 'Q4A16', 35000, '2025-11-22 01:31:52.198', '2026-04-05 14:41:23.64', 'La autenticidad reside en lo esencial. Esta camiseta de hombre de Two Six es la base perfecta para cualquier atuendo, diseñada para quienes aprecian la calidad y el detalle sutil.
Fabricada en Tela Qatar, te ofrece una experiencia de uso sumamente fresca y ligera, ideal para climas cálidos o para tu rutina activa. El icónico logo Two Six se presenta de forma elegante en punto corazón.
Detalles de la Prenda:
Tejido: Tela Qatar (Máxima comodidad y transpirabilidad).
Estilo: Minimalista con logo de marca discreto en punto corazón.
Carácter Urbano: Tipografía  en la espalda para un toque de carácter.
Ajuste: Cuello redondo y manga corta.
Colores: Negro y Blanco.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/6/idDesign-6.jpeg');
INSERT INTO public.design VALUES (5, 6, 4, 'Q4A15', 40000, '2025-11-16 20:51:33.053', '2026-04-05 14:42:22.046', 'Esta camiseta de Two Six está diseñada para seguirte el paso, combinando la actitud inconfundible del streetwear con la tecnología de alto rendimiento. No es solo cool por el diseño; ¡es literalmente fresca!
El diseño presenta el skyline imponente de la metrópolis con un vibe retro y el mensaje que lo dice todo: "CRAFTED FOR REAL ONES". Una declaración para aquellos que se mueven con autenticidad y que valoran tanto el estilo como la comodidad funcional.
Características Exclusivas Two Six:
Tecnología de Tela Fría: Confeccionada con un tejido especial que ofrece una sensación refrescante al tacto y ayuda a regular la temperatura. Ideal para los días calurosos, el movimiento constante o simplemente para mantenerte cómodo y seco.
Ajuste y Comodidad: El tejido de alta calidad es ligero, transpirable y suave, garantizando un ajuste cómodo sin sacrificar la durabilidad que esperas de Two Six.
Diseño Gráfico Classic Premium: Estampado con una silueta urbana y tonos que resaltan, con el mensaje CRAFTED FOR REAL ONES – Símbolo de autenticidad y esfuerzo.
Color Versátil: Negro, un color base elegante que realza el estampado y combina perfectamente con cualquier outfit urbano.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/5/idDesign-5.jpeg');
INSERT INTO public.design VALUES (2, 2, 4, 'Q4A12', 35000, '2025-11-11 09:02:48.948', '2026-04-05 14:40:52.278', 'Lleva tu vestuario diario con el Crop Top Two Six, la prenda que combina estilo y confort sin esfuerzo. Utilizamos la tela Qatar, conocida por su ligereza y caída fluida, garantizando una sensación fresca y suave que te acompañará todo el día.
El corte crop moderno y las mangas cortas crean una silueta favorecedora, mientras que el distintivo logo TWO SIX y el lema "crafted for real ones" impreso en el pecho, gritan autenticidad. Úsalo para el gimnasio, un paseo casual, o para tu próxima salida.
Detalles del Producto:
Tejido: Tela Qatar premium (Alta transpirabilidad).
Corte: Silueta femenina y moderna ''Crop Top''.
Mensaje: TWO SIX | crafted for real ones.
Cuidado: Fácil de lavar y resistente al uso.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/2/idDesign-2.jpeg');
INSERT INTO public.design VALUES (4, 5, 4, 'Q4A14', 35000, '2025-11-16 20:49:05.323', '2026-04-05 14:41:58.352', 'Diseñada para quienes valoran la comodidad sin sacrificar la actitud, esta prenda ofrece un Fit Oversize de tendencia, dándote máxima libertad de movimiento y una silueta relajada. Está confeccionada en Tela Qatar, conocida por su ligereza, caída perfecta y tacto suave, ideal para usarla en cualquier temporada.
El diseño se centra en un estampado frontal llamativo con el logo TWO SIX y el mensaje "crafted for real ones". El toque de exclusividad lo da el escudo bordado en la manga izquierda, un detalle sutil que marca la diferencia.
Características Esenciales:
Fit: Oversize (Corte amplio y relajado).
Tejido: Tela Qatar (Frescura, ligereza y excelente caída).
Diseño Principal: Estampado central TWO SIX en el frente.
Detalle Premium: Escudo de la marca bordado en la manga.
Estilo: Manga corta y cuello redondo.
Color: Negro.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/4/idDesign-4.jpeg');
INSERT INTO public.design VALUES (1, 1, 4, 'Q4A11', 35000, '2025-11-11 09:02:48.948', '2026-04-05 14:45:32.043', 'La camiseta Essentials de Two Six es la base perfecta para cualquier guardarropa, ofreciendo un balance ideal entre calidad, comodidad y estilo discreto.
Fabricada con Tela Qatar, esta prenda garantiza una sensación excepcionalmente fresca y ligera, ideal para el uso diario o para actividades que requieren máximo confort. Su Classic Fit asegura una caída estándar, cómoda y favorecedora para todo tipo de cuerpo.
El diseño presenta el distintivo estampado localizado del gorila en punto corazón, ejecutado con una textura que le añade un toque premium y de profundidad. Es la pieza perfecta para llevar el espíritu de Two Six de forma sutil y auténtica.
Detalles Clave del Producto:
Fit: Classic Fit (Corte clásico, cómodo y versátil).
Tejido: Tela Qatar (Alta transpirabilidad y frescura).
Diseño: Estampado localizado de gorila con textura.
Estilo: Cuello redondo y manga corta.
Colores Disponibles: Blanco, Negro, Café y Gris', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/1/idDesign-1.png');


ALTER TABLE public.design ENABLE TRIGGER ALL;

--
-- Data for Name: clothing_color; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.clothing_color DISABLE TRIGGER ALL;

INSERT INTO public.clothing_color VALUES (52, 8, 6, '2026-03-03 04:02:24.564', '2026-04-05 13:47:15.406', 'camiseta-estampada-espalda-beige', 'Camiseta beige para MASCULINO Two Six con ilustración de gorila con gorra amarilla estampada en la espalda', 'Lleva el estilo auténtico de Two Six con nuestra camiseta premium. Destaca con el logo oficial del gorila estampado en la espalda. Crafted for real ones. Calidad y diseño de Medellín.', 'Camiseta Beige - Edición Gorilla Logo (Espalda)', 'Camiseta Beige Two Six - Estampado Gorila en Espalda | Two Six');
INSERT INTO public.clothing_color VALUES (53, 2, 6, '2026-03-03 04:03:01.494', '2026-04-05 13:47:15.488', 'camiseta-estampada-espalda-negro', 'Camiseta negro para MASCULINO Two Six con ilustración de gorila con gorra amarilla estampada en la espalda', 'Lleva el estilo auténtico de Two Six con nuestra camiseta premium. Destaca con el logo oficial del gorila estampado en la espalda. Crafted for real ones. Calidad y diseño de Medellín.', 'Camiseta Negro - Edición Gorilla Logo (Espalda)', 'Camiseta Negro Two Six - Estampado Gorila en Espalda | Two Six');
INSERT INTO public.clothing_color VALUES (54, 2, 4, '2026-03-03 04:04:02.791', '2026-04-05 13:47:15.56', 'camiseta-estampado-frente-y-manga-negro', 'Hombre vistiendo camiseta negro Two Six con logo naranja y eslogan Crafted for real ones', 'Compra la Camiseta Estampada Two Six para hombre en color negro. Calidad premium con diseño exclusivo "Crafted for real ones". Envíos a todo el país.', 'Camiseta Masculina - Estampado Frontal y Manga (Color Negro)', 'Camiseta Negro Two Six - Estampado Naranja y Blanco | Crafted for Real Ones');
INSERT INTO public.clothing_color VALUES (55, 2, 5, '2026-03-03 04:04:50.258', '2026-04-05 13:47:15.631', 'camiseta-estampado-frente-negro', 'Camiseta negro Two Six con estampado frontal exclusivo', 'Lleva el estilo auténtico de Two Six con nuestra camiseta estampada al frente en color negro. Diseño urbano y calidad premium. Crafted for real ones.', 'Camiseta Masculina - Estampado Frontal Original (Negro)', 'Camiseta Negro Two Six - Estampado Frontal Original | Two Six');
INSERT INTO public.clothing_color VALUES (57, 12, 2, '2026-03-31 19:51:16.646', '2026-04-05 13:47:14.574', 'crop-top-estampada-frente-cafe', 'Crop Top café para mujer Two Six estilo urbano con eslogan Crafted for real ones.', 'Eleva tu estilo urbano con el Crop Top de Two Six. Disponible en 4 colores esenciales: Crudo, Negro, Café y Gris. Diseño cómodo con estampado frontal exclusivo. Crafted for real ones.', 'Crop Top Essentials - Café (Edición Femenina)', 'Crop Top Estampado Café Two Six - Moda Urbana Femenina');
INSERT INTO public.clothing_color VALUES (56, 8, 2, '2026-03-03 04:29:51.082', '2026-04-05 13:47:14.729', 'crop-top-estampada-frente-beige', 'Crop Top beige para mujer Two Six estilo urbano con eslogan Crafted for real ones.', 'Eleva tu estilo urbano con el Crop Top de Two Six. Disponible en 4 colores esenciales: Crudo, Negro, Café y Gris. Diseño cómodo con estampado frontal exclusivo. Crafted for real ones.', 'Crop Top Essentials - Beige (Edición Femenina)', 'Crop Top Estampado Beige Two Six - Moda Urbana Femenina');
INSERT INTO public.clothing_color VALUES (58, 2, 2, '2026-03-31 19:51:58.044', '2026-04-05 13:47:14.802', 'crop-top-estampada-frente-negro', 'Crop Top negro femenino Two Six diseño minimalista algodón premium.', 'Eleva tu estilo urbano con el Crop Top de Two Six. Disponible en 4 colores esenciales: Crudo, Negro, Café y Gris. Diseño cómodo con estampado frontal exclusivo. Crafted for real ones.', 'Crop Top Essentials - Negro (Edición Femenina)', 'Crop Top Estampado Negro Two Six - Moda Urbana Femenina');
INSERT INTO public.clothing_color VALUES (59, 6, 2, '2026-03-31 19:52:15.005', '2026-04-05 13:47:14.875', 'crop-top-estampada-frente-gris', 'Crop Top gris marca Two Six para mujer estilo casual urbano.', 'Eleva tu estilo urbano con el Crop Top de Two Six. Disponible en 4 colores esenciales: Crudo, Negro, Café y Gris. Diseño cómodo con estampado frontal exclusivo. Crafted for real ones.', 'Crop Top Essentials - Gris (Edición Femenina)', 'Crop Top Estampado Gris Two Six - Moda Urbana Femenina');
INSERT INTO public.clothing_color VALUES (46, 2, 1, '2026-03-03 03:51:49.94', '2026-04-05 13:47:14.948', 'camiseta-essentials-negro', 'Camiseta básica negro unisex de Two Six con pequeño logo de gorila bordado en el pecho', 'Descubre la Camiseta Essentials de Two Six. Un básico premium de corte unisex en color negro con nuestro icónico gorila en el pecho. Comodidad y estilo para el diario. Crafted for real ones.', 'Camiseta Essentials - Edición Unisex (Negro)', 'Camiseta Essentials Unisex Negro - Logo Gorila Minimalista | Two Six');
INSERT INTO public.clothing_color VALUES (47, 8, 1, '2026-03-03 03:54:46.38', '2026-04-05 13:47:15.021', 'camiseta-essentials-beige', 'Camiseta básica beige unisex de Two Six con pequeño logo de gorila bordado en el pecho', 'Descubre la Camiseta Essentials de Two Six. Un básico premium de corte unisex en color beige con nuestro icónico gorila en el pecho. Comodidad y estilo para el diario. Crafted for real ones.', 'Camiseta Essentials - Edición Unisex (Beige)', 'Camiseta Essentials Unisex Beige - Logo Gorila Minimalista | Two Six');
INSERT INTO public.clothing_color VALUES (48, 6, 1, '2026-03-03 03:57:17.867', '2026-04-05 13:47:15.094', 'camiseta-essentials-gris', 'Camiseta básica gris unisex de Two Six con pequeño logo de gorila bordado en el pecho', 'Descubre la Camiseta Essentials de Two Six. Un básico premium de corte unisex en color gris con nuestro icónico gorila en el pecho. Comodidad y estilo para el diario. Crafted for real ones.', 'Camiseta Essentials - Edición Unisex (Gris)', 'Camiseta Essentials Unisex Gris - Logo Gorila Minimalista | Two Six');
INSERT INTO public.clothing_color VALUES (49, 12, 1, '2026-03-03 03:57:54.701', '2026-04-05 13:47:15.168', 'camiseta-essentials-cafe', 'Camiseta básica café unisex de Two Six con pequeño logo de gorila bordado en el pecho', 'Descubre la Camiseta Essentials de Two Six. Un básico premium de corte unisex en color café con nuestro icónico gorila en el pecho. Comodidad y estilo para el diario. Crafted for real ones.', 'Camiseta Essentials - Edición Unisex (Café)', 'Camiseta Essentials Unisex Café - Logo Gorila Minimalista | Two Six');
INSERT INTO public.clothing_color VALUES (50, 8, 3, '2026-03-03 04:00:01.317', '2026-04-05 13:47:15.241', 'camiseta-essentials-mujer-beige', 'Camiseta básica beige para mujer marca Two Six con logo minimalista del gorila.', 'Descubre la Camiseta Essentials para mujer de Two Six. Un básico premium con fit femenino en colores Negro y Crudo. Estilo minimalista con nuestro logo oficial del gorila. Crafted for real ones.', 'Camiseta Essentials - Edición Femenina (Beige)', 'Camiseta Essentials Mujer Beige - Logo Gorila Minimalista | Two Six');
INSERT INTO public.clothing_color VALUES (51, 2, 3, '2026-03-03 04:01:13.454', '2026-04-05 13:47:15.314', 'camiseta-essentials-mujer-negro', 'Camiseta básica negra para mujer marca Two Six con logo minimalista del gorila.', 'Descubre la Camiseta Essentials para mujer de Two Six. Un básico premium con fit femenino en colores Negro y Crudo. Estilo minimalista con nuestro logo oficial del gorila. Crafted for real ones.', 'Camiseta Essentials - Edición Femenina (Negro)', 'Camiseta Essentials Mujer Negra - Logo Gorila Minimalista | Two Six');


ALTER TABLE public.clothing_color ENABLE TRIGGER ALL;

--
-- Data for Name: size; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.size DISABLE TRIGGER ALL;

INSERT INTO public.size VALUES (1, 'XS', 'Extra Pequeña', '2025-11-19 17:15:43.085', NULL);
INSERT INTO public.size VALUES (2, 'S', 'Pequeña', '2025-11-19 17:15:43.085', NULL);
INSERT INTO public.size VALUES (3, 'M', 'Mediana', '2025-11-19 17:15:43.085', NULL);
INSERT INTO public.size VALUES (4, 'L', 'Grande', '2025-11-19 17:15:43.085', NULL);
INSERT INTO public.size VALUES (5, 'XL', 'Extra Grande', '2025-11-19 17:15:43.085', NULL);
INSERT INTO public.size VALUES (6, 'U', 'Único', '2025-11-19 17:15:43.085', NULL);


ALTER TABLE public.size ENABLE TRIGGER ALL;

--
-- Data for Name: clothing_size; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.clothing_size DISABLE TRIGGER ALL;

INSERT INTO public.clothing_size VALUES (1, 2, 46, 5, 5, 0, 0, 0, '2026-03-03 03:51:49.94', '2026-03-03 03:51:49.94', NULL);
INSERT INTO public.clothing_size VALUES (2, 3, 46, 16, 16, 0, 0, 0, '2026-03-03 03:51:49.94', '2026-03-03 03:51:49.94', NULL);
INSERT INTO public.clothing_size VALUES (3, 4, 46, 18, 18, 0, 0, 0, '2026-03-03 03:51:49.94', '2026-03-03 03:51:49.94', NULL);
INSERT INTO public.clothing_size VALUES (5, 2, 47, 5, 5, 0, 0, 0, '2026-03-03 03:54:46.38', '2026-03-03 03:54:46.38', NULL);
INSERT INTO public.clothing_size VALUES (6, 3, 47, 16, 16, 0, 0, 0, '2026-03-03 03:54:46.38', '2026-03-03 03:54:46.38', NULL);
INSERT INTO public.clothing_size VALUES (8, 5, 47, 9, 9, 0, 0, 0, '2026-03-03 03:54:46.38', '2026-03-03 03:54:46.38', NULL);
INSERT INTO public.clothing_size VALUES (7, 4, 47, 18, 17, 1, 0, 0, '2026-03-03 03:54:46.38', '2026-03-03 03:55:54.238', NULL);
INSERT INTO public.clothing_size VALUES (9, 2, 48, 5, 5, 0, 0, 0, '2026-03-03 03:57:17.867', '2026-03-03 03:57:17.867', NULL);
INSERT INTO public.clothing_size VALUES (10, 3, 48, 16, 16, 0, 0, 0, '2026-03-03 03:57:17.867', '2026-03-03 03:57:17.867', NULL);
INSERT INTO public.clothing_size VALUES (11, 4, 48, 18, 18, 0, 0, 0, '2026-03-03 03:57:17.867', '2026-03-03 03:57:17.867', NULL);
INSERT INTO public.clothing_size VALUES (12, 5, 48, 9, 9, 0, 0, 0, '2026-03-03 03:57:17.867', '2026-03-03 03:57:17.867', NULL);
INSERT INTO public.clothing_size VALUES (13, 2, 49, 5, 5, 0, 0, 0, '2026-03-03 03:57:54.701', '2026-03-03 03:57:54.701', NULL);
INSERT INTO public.clothing_size VALUES (14, 3, 49, 16, 16, 0, 0, 0, '2026-03-03 03:57:54.701', '2026-03-03 03:57:54.701', NULL);
INSERT INTO public.clothing_size VALUES (15, 4, 49, 18, 18, 0, 0, 0, '2026-03-03 03:57:54.701', '2026-03-03 03:57:54.701', NULL);
INSERT INTO public.clothing_size VALUES (16, 5, 49, 9, 9, 0, 0, 0, '2026-03-03 03:57:54.701', '2026-03-03 03:57:54.701', NULL);
INSERT INTO public.clothing_size VALUES (17, 1, 50, 8, 8, 0, 0, 0, '2026-03-03 04:00:01.317', '2026-03-03 04:00:01.317', NULL);
INSERT INTO public.clothing_size VALUES (19, 3, 50, 16, 16, 0, 0, 0, '2026-03-03 04:00:01.317', '2026-03-03 04:00:01.317', NULL);
INSERT INTO public.clothing_size VALUES (20, 4, 50, 6, 6, 0, 0, 0, '2026-03-03 04:00:01.317', '2026-03-03 04:00:01.317', NULL);
INSERT INTO public.clothing_size VALUES (21, 1, 51, 8, 8, 0, 0, 0, '2026-03-03 04:01:13.454', '2026-03-03 04:01:13.454', NULL);
INSERT INTO public.clothing_size VALUES (22, 2, 51, 17, 17, 0, 0, 0, '2026-03-03 04:01:13.454', '2026-03-03 04:01:13.454', NULL);
INSERT INTO public.clothing_size VALUES (23, 3, 51, 16, 16, 0, 0, 0, '2026-03-03 04:01:13.454', '2026-03-03 04:01:13.454', NULL);
INSERT INTO public.clothing_size VALUES (24, 4, 51, 6, 6, 0, 0, 0, '2026-03-03 04:01:13.454', '2026-03-03 04:01:13.454', NULL);
INSERT INTO public.clothing_size VALUES (25, 2, 52, 5, 5, 0, 0, 0, '2026-03-03 04:02:24.564', '2026-03-03 04:02:24.564', NULL);
INSERT INTO public.clothing_size VALUES (26, 3, 52, 16, 16, 0, 0, 0, '2026-03-03 04:02:24.564', '2026-03-03 04:02:24.564', NULL);
INSERT INTO public.clothing_size VALUES (27, 4, 52, 18, 18, 0, 0, 0, '2026-03-03 04:02:24.564', '2026-03-03 04:02:24.564', NULL);
INSERT INTO public.clothing_size VALUES (28, 5, 52, 9, 9, 0, 0, 0, '2026-03-03 04:02:24.564', '2026-03-03 04:02:24.564', NULL);
INSERT INTO public.clothing_size VALUES (29, 2, 53, 5, 5, 0, 0, 0, '2026-03-03 04:03:01.494', '2026-03-03 04:03:01.494', NULL);
INSERT INTO public.clothing_size VALUES (30, 3, 53, 16, 16, 0, 0, 0, '2026-03-03 04:03:01.494', '2026-03-03 04:03:01.494', NULL);
INSERT INTO public.clothing_size VALUES (31, 4, 53, 18, 18, 0, 0, 0, '2026-03-03 04:03:01.494', '2026-03-03 04:03:01.494', NULL);
INSERT INTO public.clothing_size VALUES (32, 5, 53, 9, 9, 0, 0, 0, '2026-03-03 04:03:01.494', '2026-03-03 04:03:01.494', NULL);
INSERT INTO public.clothing_size VALUES (33, 2, 54, 5, 5, 0, 0, 0, '2026-03-03 04:04:02.791', '2026-03-03 04:04:02.791', NULL);
INSERT INTO public.clothing_size VALUES (34, 3, 54, 16, 16, 0, 0, 0, '2026-03-03 04:04:02.791', '2026-03-03 04:04:02.791', NULL);
INSERT INTO public.clothing_size VALUES (35, 4, 54, 18, 18, 0, 0, 0, '2026-03-03 04:04:02.791', '2026-03-03 04:04:02.791', NULL);
INSERT INTO public.clothing_size VALUES (37, 2, 55, 5, 5, 0, 0, 0, '2026-03-03 04:04:50.258', '2026-03-03 04:04:50.258', NULL);
INSERT INTO public.clothing_size VALUES (38, 3, 55, 16, 16, 0, 0, 0, '2026-03-03 04:04:50.258', '2026-03-03 04:04:50.258', NULL);
INSERT INTO public.clothing_size VALUES (39, 4, 55, 18, 18, 0, 0, 0, '2026-03-03 04:04:50.258', '2026-03-03 04:04:50.258', NULL);
INSERT INTO public.clothing_size VALUES (40, 5, 55, 9, 9, 0, 0, 0, '2026-03-03 04:04:50.258', '2026-03-03 04:04:50.258', NULL);
INSERT INTO public.clothing_size VALUES (41, 6, 56, 25, 25, 0, 0, 0, '2026-03-03 04:29:51.082', '2026-03-03 04:29:51.082', NULL);
INSERT INTO public.clothing_size VALUES (4, 5, 46, 9, 6, 3, 0, 0, '2026-03-03 03:51:49.94', '2026-03-04 02:55:09.313', 1);
INSERT INTO public.clothing_size VALUES (42, 6, 57, 25, 25, 0, 0, 0, '2026-03-31 19:51:16.646', '2026-03-31 19:51:16.646', NULL);
INSERT INTO public.clothing_size VALUES (43, 6, 58, 25, 25, 0, 0, 0, '2026-03-31 19:51:58.044', '2026-03-31 19:51:58.044', NULL);
INSERT INTO public.clothing_size VALUES (44, 6, 59, 25, 25, 0, 0, 0, '2026-03-31 19:52:15.005', '2026-03-31 19:52:15.005', NULL);
INSERT INTO public.clothing_size VALUES (36, 5, 54, 9, 8, 1, 0, 0, '2026-03-03 04:04:02.791', '2026-04-02 20:05:42.268', NULL);
INSERT INTO public.clothing_size VALUES (18, 2, 50, 17, 16, 1, 0, 0, '2026-03-03 04:00:01.317', '2026-04-02 20:05:42.268', NULL);


ALTER TABLE public.clothing_size ENABLE TRIGGER ALL;

--
-- Data for Name: fixed_asset; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.fixed_asset DISABLE TRIGGER ALL;



ALTER TABLE public.fixed_asset ENABLE TRIGGER ALL;

--
-- Data for Name: depreciation_entry; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.depreciation_entry DISABLE TRIGGER ALL;



ALTER TABLE public.depreciation_entry ENABLE TRIGGER ALL;

--
-- Data for Name: production_type; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.production_type DISABLE TRIGGER ALL;



ALTER TABLE public.production_type ENABLE TRIGGER ALL;

--
-- Data for Name: provider; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.provider DISABLE TRIGGER ALL;

INSERT INTO public.provider VALUES ('900123456-7', 'contacto@textilescol.com', '123-456789-0', 'Ahorros', 'Bancolombia', 'Textiles de Colombia S.A.S', '2025-11-19 14:11:49.618', '6015551234', NULL);
INSERT INTO public.provider VALUES ('800987654-3', 'ventas@dismod.com', '987-654321-1', 'Corriente', 'Davivienda', 'Diseños Modernos Ltda', '2025-11-19 14:11:49.618', '6045559876', NULL);


ALTER TABLE public.provider ENABLE TRIGGER ALL;

--
-- Data for Name: design_provider; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.design_provider DISABLE TRIGGER ALL;



ALTER TABLE public.design_provider ENABLE TRIGGER ALL;

--
-- Data for Name: dian_resolution; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.dian_resolution DISABLE TRIGGER ALL;

INSERT INTO public.dian_resolution VALUES (2, 'CREDIT_NOTE', 'NC', '99000000000', 1, 999999, 17, NULL, '2020-01-01 00:00:00', '2030-01-01 00:00:00', 'TEST', NULL, true, '2026-03-20 03:20:02.17', '2026-03-22 00:42:45.831');
INSERT INTO public.dian_resolution VALUES (3, 'DEBIT_NOTE', 'ND', '99000000000', 1, 999999, 6, NULL, '2020-01-01 00:00:00', '2030-01-01 00:00:00', 'TEST', NULL, true, '2026-03-20 03:20:02.181', '2026-03-21 17:45:04.308');
INSERT INTO public.dian_resolution VALUES (1, 'FACTURA_ELECTRONICA', 'SETP', '18760000001', 990000000, 995000000, 0, 'test-technical-key-local-dev-only', '2026-01-01 00:00:00', '2027-12-31 00:00:00', 'TEST', 'test-set-id-local-dev', true, '2026-04-05 14:20:51.553', '2026-04-05 14:20:51.553');


ALTER TABLE public.dian_resolution ENABLE TRIGGER ALL;

--
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public."order" DISABLE TRIGGER ALL;

INSERT INTO public."order" VALUES (5, 4, '2026-04-02 20:05:42.488', 'Pagado', true, 'CL 36D SUR #27D-39, APTO 1001, URB Guadalcanal Apartamentos, Envigado', '2026-04-02 20:05:42.268', '2026-04-02 20:07:15.989', 30362, '2026-04-02 20:05:42.488', 0, 143820, 0, 'PICKUP', 'TS-260402-1868', 'WOMPI_FULL', '20DJ', 'PENDING');


ALTER TABLE public."order" ENABLE TRIGGER ALL;

--
-- Data for Name: dian_e_invoicing; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.dian_e_invoicing DISABLE TRIGGER ALL;

INSERT INTO public.dian_e_invoicing VALUES (1, 5, '0941a7d2897669ac6b47135360e876ce8a005b15894a088d0422a93cef4072c37c6c051abf822682e5bd39fc499ba955', 'data:image/png;base64,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', 'TSF1', '2026-04-02 00:00:00', '2026-04-02 00:00:00', 'AUTHORIZED', NULL, NULL, '2026-04-02 20:07:16.726', '2026-04-03 01:08:08.193', NULL, '<b:ErrorMessageList i:nil="true" xmlns:c="http://schemas.datacontract.org/2004/07/XmlParamsResponseTrackId"/><b:ZipKey>1bd7b666-1c8d-4e58-b197-560c7c22aab1</b:ZipKey>', NULL, true, 'PROD', NULL);


ALTER TABLE public.dian_e_invoicing ENABLE TRIGGER ALL;

--
-- Data for Name: dian_note; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.dian_note DISABLE TRIGGER ALL;



ALTER TABLE public.dian_note ENABLE TRIGGER ALL;

--
-- Data for Name: employee; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.employee DISABLE TRIGGER ALL;



ALTER TABLE public.employee ENABLE TRIGGER ALL;

--
-- Data for Name: expense_category; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.expense_category DISABLE TRIGGER ALL;



ALTER TABLE public.expense_category ENABLE TRIGGER ALL;

--
-- Data for Name: expense; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.expense DISABLE TRIGGER ALL;



ALTER TABLE public.expense ENABLE TRIGGER ALL;

--
-- Data for Name: image_clothing; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.image_clothing DISABLE TRIGGER ALL;

INSERT INTO public.image_clothing VALUES (8, 47, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/beige/unisex/q4a11-beige-unisex-1772510929581.png', 2, '2026-03-03 04:08:49.61', '2026-03-12 03:13:07.621');
INSERT INTO public.image_clothing VALUES (7, 47, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/beige/unisex/q4a11-beige-unisex-1772510929525.png', 3, '2026-03-03 04:08:49.556', '2026-03-12 03:13:07.621');
INSERT INTO public.image_clothing VALUES (2, 46, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/negro/unisex/q4a11-negro-unisex-1772510883983.png', 1, '2026-03-03 04:08:04.013', '2026-03-03 04:08:16.898');
INSERT INTO public.image_clothing VALUES (4, 46, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/negro/unisex/q4a11-negro-unisex-1772510884096.png', 2, '2026-03-03 04:08:04.123', '2026-03-03 04:08:16.898');
INSERT INTO public.image_clothing VALUES (12, 48, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1772510967974.png', 2, '2026-03-03 04:09:28', '2026-03-12 03:10:16.36');
INSERT INTO public.image_clothing VALUES (9, 48, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1772510967795.png', 3, '2026-03-03 04:09:27.833', '2026-03-12 03:10:16.36');
INSERT INTO public.image_clothing VALUES (5, 47, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/beige/unisex/q4a11-beige-unisex-1772510929412.png', 5, '2026-03-03 04:08:49.444', '2026-03-12 03:13:07.621');
INSERT INTO public.image_clothing VALUES (13, 48, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1772510968033.png', 5, '2026-03-03 04:09:28.072', '2026-03-12 03:10:16.36');
INSERT INTO public.image_clothing VALUES (6, 47, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/beige/unisex/q4a11-beige-unisex-1772510929469.png', 1, '2026-03-03 04:08:49.5', '2026-03-12 03:13:07.621');
INSERT INTO public.image_clothing VALUES (15, 49, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1772511005612.png', 1, '2026-03-03 04:10:05.64', '2026-03-12 03:11:28.118');
INSERT INTO public.image_clothing VALUES (17, 49, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1772511005733.png', 2, '2026-03-03 04:10:05.764', '2026-03-12 03:11:28.118');
INSERT INTO public.image_clothing VALUES (14, 49, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1772511005543.png', 3, '2026-03-03 04:10:05.58', '2026-03-12 03:11:28.118');
INSERT INTO public.image_clothing VALUES (16, 49, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1772511005665.png', 5, '2026-03-03 04:10:05.701', '2026-03-12 03:11:28.118');
INSERT INTO public.image_clothing VALUES (18, 49, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1772511005792.png', 6, '2026-03-03 04:10:05.833', '2026-03-12 03:11:28.118');
INSERT INTO public.image_clothing VALUES (21, 50, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/beige/femenino/q4a13-beige-femenino-1772511117210.png', 1, '2026-03-03 04:11:57.248', '2026-03-03 04:12:09.248');
INSERT INTO public.image_clothing VALUES (19, 50, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/beige/femenino/q4a13-beige-femenino-1772511117082.png', 2, '2026-03-03 04:11:57.127', '2026-03-03 04:12:09.248');
INSERT INTO public.image_clothing VALUES (23, 50, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/beige/femenino/q4a13-beige-femenino-1772511117327.png', 3, '2026-03-03 04:11:57.357', '2026-03-03 04:12:09.248');
INSERT INTO public.image_clothing VALUES (20, 50, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/beige/femenino/q4a13-beige-femenino-1772511117152.png', 4, '2026-03-03 04:11:57.18', '2026-03-03 04:12:09.248');
INSERT INTO public.image_clothing VALUES (22, 50, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/beige/femenino/q4a13-beige-femenino-1772511117276.png', 5, '2026-03-03 04:11:57.296', '2026-03-03 04:12:09.248');
INSERT INTO public.image_clothing VALUES (24, 51, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/femenino/q4a13-negro-femenino-1772511168278.png', 1, '2026-03-03 04:12:48.303', '2026-03-03 04:12:55.414');
INSERT INTO public.image_clothing VALUES (26, 51, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/femenino/q4a13-negro-femenino-1772511168387.png', 2, '2026-03-03 04:12:48.412', '2026-03-03 04:12:55.414');
INSERT INTO public.image_clothing VALUES (28, 51, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/femenino/q4a13-negro-femenino-1772511168501.png', 3, '2026-03-03 04:12:48.53', '2026-03-03 04:12:55.414');
INSERT INTO public.image_clothing VALUES (25, 51, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/femenino/q4a13-negro-femenino-1772511168330.png', 4, '2026-03-03 04:12:48.355', '2026-03-03 04:12:55.414');
INSERT INTO public.image_clothing VALUES (27, 51, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/femenino/q4a13-negro-femenino-1772511168441.png', 5, '2026-03-03 04:12:48.471', '2026-03-03 04:12:55.414');
INSERT INTO public.image_clothing VALUES (3, 46, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/negro/unisex/q4a11-negro-unisex-1772510884039.png', 3, '2026-03-03 04:08:04.068', '2026-03-12 03:09:16.864');
INSERT INTO public.image_clothing VALUES (10, 48, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1772510967861.png', 1, '2026-03-03 04:09:27.895', '2026-03-12 03:10:16.36');
INSERT INTO public.image_clothing VALUES (52, 53, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1772511438451.png', 1, '2026-03-03 04:17:18.479', '2026-03-03 04:17:34.347');
INSERT INTO public.image_clothing VALUES (50, 53, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1772511438353.png', 2, '2026-03-03 04:17:18.383', '2026-03-03 04:17:34.347');
INSERT INTO public.image_clothing VALUES (54, 53, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1772511438562.png', 3, '2026-03-03 04:17:18.584', '2026-03-03 04:17:34.347');
INSERT INTO public.image_clothing VALUES (31, 54, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1772511209329.png', 1, '2026-03-03 04:13:29.349', '2026-03-03 04:13:52.636');
INSERT INTO public.image_clothing VALUES (29, 54, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1772511209222.png', 2, '2026-03-03 04:13:29.248', '2026-03-03 04:13:52.636');
INSERT INTO public.image_clothing VALUES (33, 54, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1772511209430.png', 3, '2026-03-03 04:13:29.452', '2026-03-03 04:13:52.636');
INSERT INTO public.image_clothing VALUES (30, 54, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1772511209277.png', 4, '2026-03-03 04:13:29.298', '2026-03-03 04:13:52.636');
INSERT INTO public.image_clothing VALUES (32, 54, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1772511209377.png', 5, '2026-03-03 04:13:29.403', '2026-03-03 04:13:52.636');
INSERT INTO public.image_clothing VALUES (53, 53, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1772511438508.png', 4, '2026-03-03 04:17:18.523', '2026-03-03 04:17:34.347');
INSERT INTO public.image_clothing VALUES (47, 55, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/negro/masculino/q4a15-negro-masculino-1772511359643.png', 1, '2026-03-03 04:15:59.665', '2026-03-03 04:16:40.084');
INSERT INTO public.image_clothing VALUES (41, 52, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/beige/masculino/q4a16-beige-masculino-1772511296987.png', 1, '2026-03-03 04:14:57.013', '2026-03-03 04:15:06.334');
INSERT INTO public.image_clothing VALUES (45, 55, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/negro/masculino/q4a15-negro-masculino-1772511359539.png', 2, '2026-03-03 04:15:59.568', '2026-03-03 04:16:40.084');
INSERT INTO public.image_clothing VALUES (39, 52, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/beige/masculino/q4a16-beige-masculino-1772511296881.png', 2, '2026-03-03 04:14:56.905', '2026-03-03 04:15:06.334');
INSERT INTO public.image_clothing VALUES (43, 52, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/beige/masculino/q4a16-beige-masculino-1772511297087.png', 3, '2026-03-03 04:14:57.119', '2026-03-03 04:15:06.334');
INSERT INTO public.image_clothing VALUES (42, 52, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/beige/masculino/q4a16-beige-masculino-1772511297040.png', 4, '2026-03-03 04:14:57.06', '2026-03-03 04:15:06.334');
INSERT INTO public.image_clothing VALUES (40, 52, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/beige/masculino/q4a16-beige-masculino-1772511296932.png', 5, '2026-03-03 04:14:56.959', '2026-03-03 04:15:06.334');
INSERT INTO public.image_clothing VALUES (49, 55, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/negro/masculino/q4a15-negro-masculino-1772511394976.png', 3, '2026-03-03 04:16:35.007', '2026-03-03 04:16:40.084');
INSERT INTO public.image_clothing VALUES (51, 53, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1772511438407.png', 5, '2026-03-03 04:17:18.425', '2026-03-03 04:17:34.347');
INSERT INTO public.image_clothing VALUES (60, 56, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/beige/femenino/q1a12-beige-femenino-1774986614874.png', 2, '2026-03-31 19:50:14.909', '2026-03-31 19:50:14.909');
INSERT INTO public.image_clothing VALUES (57, 49, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1773285080949.png', 4, '2026-03-12 03:11:20.994', '2026-03-12 03:11:28.118');
INSERT INTO public.image_clothing VALUES (48, 55, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/negro/masculino/q4a15-negro-masculino-1772511394909.png', 4, '2026-03-03 04:16:34.943', '2026-03-03 04:16:40.084');
INSERT INTO public.image_clothing VALUES (46, 55, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/negro/masculino/q4a15-negro-masculino-1772511359593.png', 5, '2026-03-03 04:15:59.617', '2026-03-03 04:16:40.084');
INSERT INTO public.image_clothing VALUES (61, 57, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/cafe/femenino/q1a12-cafe-femenino-1774986823459.png', 1, '2026-03-31 19:53:43.501', '2026-03-31 19:53:43.501');
INSERT INTO public.image_clothing VALUES (62, 57, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/cafe/femenino/q1a12-cafe-femenino-1774986823525.png', 2, '2026-03-31 19:53:43.555', '2026-03-31 19:53:43.555');
INSERT INTO public.image_clothing VALUES (55, 46, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/negro/unisex/q4a11-negro-unisex-1773284942495.png', 4, '2026-03-12 03:09:02.566', '2026-03-12 03:09:16.864');
INSERT INTO public.image_clothing VALUES (56, 48, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1773285011325.png', 4, '2026-03-12 03:10:11.347', '2026-03-12 03:10:16.36');
INSERT INTO public.image_clothing VALUES (58, 47, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/beige/unisex/q4a11-beige-unisex-1773285144464.png', 4, '2026-03-12 03:12:24.497', '2026-03-12 03:13:07.621');
INSERT INTO public.image_clothing VALUES (59, 56, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/beige/femenino/q1a12-beige-femenino-1774986537404.png', 1, '2026-03-31 19:48:57.464', '2026-03-31 19:48:57.464');
INSERT INTO public.image_clothing VALUES (63, 57, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/cafe/femenino/q1a12-cafe-femenino-1774986823584.png', 3, '2026-03-31 19:53:43.611', '2026-03-31 19:53:43.611');
INSERT INTO public.image_clothing VALUES (64, 59, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/gris/femenino/q1a12-gris-femenino-1774986870186.png', 1, '2026-03-31 19:54:30.217', '2026-03-31 19:54:30.217');
INSERT INTO public.image_clothing VALUES (65, 59, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/gris/femenino/q1a12-gris-femenino-1774986870241.png', 2, '2026-03-31 19:54:30.269', '2026-03-31 19:54:30.269');
INSERT INTO public.image_clothing VALUES (66, 58, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/negro/femenino/q1a12-negro-femenino-1774986917380.png', 1, '2026-03-31 19:55:17.405', '2026-03-31 19:55:28.362');
INSERT INTO public.image_clothing VALUES (67, 58, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/negro/femenino/q1a12-negro-femenino-1774986917429.png', 2, '2026-03-31 19:55:17.462', '2026-03-31 19:55:28.362');
INSERT INTO public.image_clothing VALUES (68, 58, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/negro/femenino/q1a12-negro-femenino-1774986917487.png', 3, '2026-03-31 19:55:17.514', '2026-03-31 19:55:28.362');
INSERT INTO public.image_clothing VALUES (69, 58, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/negro/femenino/q1a12-negro-femenino-1774986917559.png', 4, '2026-03-31 19:55:17.589', '2026-03-31 19:55:28.362');
INSERT INTO public.image_clothing VALUES (70, 59, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-1-trimestre-del-ano-2025/q1a12/gris/femenino/q1a12-gris-femenino-1774986950842.png', 3, '2026-03-31 19:55:50.866', '2026-03-31 19:55:50.866');


ALTER TABLE public.image_clothing ENABLE TRIGGER ALL;

--
-- Data for Name: journal_entry; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.journal_entry DISABLE TRIGGER ALL;



ALTER TABLE public.journal_entry ENABLE TRIGGER ALL;

--
-- Data for Name: journal_entry_line; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.journal_entry_line DISABLE TRIGGER ALL;



ALTER TABLE public.journal_entry_line ENABLE TRIGGER ALL;

--
-- Data for Name: log_error; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.log_error DISABLE TRIGGER ALL;

INSERT INTO public.log_error VALUES (1, 'Internal server error', 'Error: Internal server error
    at handleResponse (http://localhost:5173/src/services/apiUtils.ts:12:19)
    at async Promise.all (index 0)
    at async fetchData (http://localhost:5173/src/pages/MasterDesignPage.tsx:36:61)', NULL, 'cms', 'App: cms | Api: master-design', '2026-04-05 14:22:09.224', '2026-04-05 14:22:09.224');
INSERT INTO public.log_error VALUES (2, 'Internal server error', 'Error: Internal server error
    at handleResponse (http://localhost:5173/src/services/apiUtils.ts:12:19)
    at async Promise.all (index 0)
    at async fetchData (http://localhost:5173/src/pages/MasterDesignPage.tsx:36:61)', NULL, 'cms', '/master-design', '2026-04-05 14:22:09.227', '2026-04-05 14:22:09.227');
INSERT INTO public.log_error VALUES (3, 'Internal server error', 'Error: Internal server error
    at handleResponse (http://localhost:5173/src/services/apiUtils.ts:12:19)
    at async Promise.all (index 0)
    at async fetchData (http://localhost:5173/src/pages/MasterDesignPage.tsx:36:61)', NULL, 'cms', 'App: cms | Api: master-design', '2026-04-05 14:22:09.231', '2026-04-05 14:22:09.231');
INSERT INTO public.log_error VALUES (4, 'Internal server error', 'Error: Internal server error
    at handleResponse (http://localhost:5173/src/services/apiUtils.ts:12:19)
    at async Promise.all (index 0)
    at async fetchData (http://localhost:5173/src/pages/MasterDesignPage.tsx:36:61)', NULL, 'cms', '/master-design', '2026-04-05 14:22:09.232', '2026-04-05 14:22:09.232');


ALTER TABLE public.log_error ENABLE TRIGGER ALL;

--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.product DISABLE TRIGGER ALL;

INSERT INTO public.product VALUES (19, 79900, true, '2026-03-03 04:32:39.159', '2026-03-03 04:32:39.159', false, 'Q4A11-GRI-L', 0, 0, 11);
INSERT INTO public.product VALUES (20, 79900, true, '2026-03-03 04:32:39.357', '2026-03-03 04:32:39.357', false, 'Q4A11-CAF-M', 0, 0, 14);
INSERT INTO public.product VALUES (7, 79900, true, '2026-03-03 04:32:38.55', '2026-03-03 04:32:38.55', false, 'Q4A11-CAF-S', 0, 0, 13);
INSERT INTO public.product VALUES (8, 79900, true, '2026-03-03 04:32:38.626', '2026-03-03 04:32:38.626', false, 'Q4A11-GRI-XL', 0, 0, 12);
INSERT INTO public.product VALUES (9, 79900, true, '2026-03-03 04:32:38.867', '2026-03-03 04:32:38.867', false, 'Q4A11-NEG-S', 0, 0, 1);
INSERT INTO public.product VALUES (10, 79900, true, '2026-03-03 04:32:38.89', '2026-03-03 04:32:38.89', false, 'Q4A11-BEI-M', 0, 0, 6);
INSERT INTO public.product VALUES (11, 79900, true, '2026-03-03 04:32:39.036', '2026-03-03 04:32:39.036', false, 'Q4A11-GRI-M', 0, 0, 10);
INSERT INTO public.product VALUES (12, 79900, true, '2026-03-03 04:32:39.003', '2026-03-03 04:32:39.003', false, 'Q4A11-CAF-L', 0, 0, 15);
INSERT INTO public.product VALUES (13, 79900, true, '2026-03-03 04:32:39.049', '2026-03-03 04:32:39.049', false, 'Q4A11-BEI-S', 0, 0, 5);
INSERT INTO public.product VALUES (14, 79900, true, '2026-03-03 04:32:39.078', '2026-03-03 04:32:39.078', false, 'Q4A11-NEG-XL', 0, 0, 4);
INSERT INTO public.product VALUES (15, 79900, true, '2026-03-03 04:32:39.101', '2026-03-03 04:32:39.101', false, 'Q4A11-NEG-L', 0, 0, 3);
INSERT INTO public.product VALUES (16, 79900, true, '2026-03-03 04:32:39.107', '2026-03-03 04:32:39.107', false, 'Q4A11-BEI-XL', 0, 0, 8);
INSERT INTO public.product VALUES (17, 79900, true, '2026-03-03 04:32:39.124', '2026-03-03 04:32:39.124', false, 'Q4A11-CAF-XL', 0, 0, 16);
INSERT INTO public.product VALUES (18, 79900, true, '2026-03-03 04:32:39.13', '2026-03-03 04:32:39.13', false, 'Q4A11-GRI-S', 0, 0, 9);
INSERT INTO public.product VALUES (21, 79900, true, '2026-03-03 05:03:48.1', '2026-03-03 05:03:48.1', false, 'Q4A11-BEI-L', 0, 0, 7);
INSERT INTO public.product VALUES (22, 79900, true, '2026-03-03 05:03:48.345', '2026-03-03 05:03:48.345', false, 'Q4A11-NEG-M', 0, 0, 2);
INSERT INTO public.product VALUES (23, 79900, true, '2026-03-03 05:05:04.723', '2026-03-03 05:05:04.723', false, 'Q4A16-BEI-XL', 0, 0, 28);
INSERT INTO public.product VALUES (24, 79900, true, '2026-03-03 05:05:04.752', '2026-03-03 05:05:04.752', false, 'Q4A16-BEI-M', 0, 0, 26);
INSERT INTO public.product VALUES (25, 79900, true, '2026-03-03 05:05:05.203', '2026-03-03 05:05:05.203', false, 'Q4A16-BEI-S', 0, 0, 25);
INSERT INTO public.product VALUES (26, 79900, true, '2026-03-03 05:05:05.305', '2026-03-03 05:05:05.305', false, 'Q4A16-BEI-L', 0, 0, 27);
INSERT INTO public.product VALUES (27, 79900, true, '2026-03-03 05:07:04.538', '2026-03-03 05:07:04.538', false, 'Q4A14-NEG-L', 0, 0, 35);
INSERT INTO public.product VALUES (28, 79900, true, '2026-03-03 05:07:04.537', '2026-03-03 05:07:04.537', false, 'Q4A14-NEG-M', 0, 0, 34);
INSERT INTO public.product VALUES (29, 79900, true, '2026-03-03 05:07:04.565', '2026-03-03 05:07:04.565', false, 'Q4A14-NEG-XL', 0, 0, 36);
INSERT INTO public.product VALUES (30, 79900, true, '2026-03-03 05:07:05.965', '2026-03-03 05:07:05.965', false, 'Q4A15-NEG-S', 0, 0, 37);
INSERT INTO public.product VALUES (31, 79900, true, '2026-03-03 05:07:06.09', '2026-03-03 05:07:06.09', false, 'Q4A15-NEG-XL', 0, 0, 40);
INSERT INTO public.product VALUES (32, 79900, true, '2026-03-03 05:07:06.231', '2026-03-03 05:07:06.231', false, 'Q4A16-NEG-L', 0, 0, 31);
INSERT INTO public.product VALUES (33, 79900, true, '2026-03-03 05:07:06.287', '2026-03-03 05:07:06.287', false, 'Q4A14-NEG-S', 0, 0, 33);
INSERT INTO public.product VALUES (34, 79900, true, '2026-03-03 05:07:06.279', '2026-03-03 05:07:06.279', false, 'Q4A16-NEG-S', 0, 0, 29);
INSERT INTO public.product VALUES (35, 79900, true, '2026-03-03 05:07:06.31', '2026-03-03 05:07:06.31', false, 'Q4A15-NEG-M', 0, 0, 38);
INSERT INTO public.product VALUES (36, 79900, true, '2026-03-03 05:07:06.338', '2026-03-03 05:07:06.338', false, 'Q4A16-NEG-XL', 0, 0, 32);
INSERT INTO public.product VALUES (37, 79900, true, '2026-03-03 05:07:06.398', '2026-03-03 05:07:06.398', false, 'Q4A15-NEG-L', 0, 0, 39);
INSERT INTO public.product VALUES (38, 79900, true, '2026-03-03 05:07:06.395', '2026-03-03 05:07:06.395', false, 'Q4A16-NEG-M', 0, 0, 30);
INSERT INTO public.product VALUES (39, 79900, true, '2026-03-31 19:37:24.849', '2026-03-03 05:08:18.124', false, 'Q4A13-BEI-XS', 0, 0, 17);
INSERT INTO public.product VALUES (46, 79900, true, '2026-03-31 19:37:40.938', '2026-03-03 05:08:18.171', false, 'Q4A13-NEG-M', 0, 0, 23);
INSERT INTO public.product VALUES (45, 79900, true, '2026-03-31 19:37:53.243', '2026-03-03 05:08:18.146', false, 'Q4A13-BEI-S', 0, 0, 18);
INSERT INTO public.product VALUES (44, 79900, true, '2026-03-31 19:38:06.895', '2026-03-03 05:08:18.148', false, 'Q4A13-NEG-L', 0, 0, 24);
INSERT INTO public.product VALUES (43, 79900, true, '2026-03-31 19:38:19.998', '2026-03-03 05:08:18.136', false, 'Q4A13-BEI-M', 0, 0, 19);
INSERT INTO public.product VALUES (42, 79900, true, '2026-03-31 19:38:32.863', '2026-03-03 05:08:18.137', false, 'Q4A13-NEG-XS', 0, 0, 21);
INSERT INTO public.product VALUES (41, 79900, true, '2026-03-31 19:38:46.36', '2026-03-03 05:08:18.132', false, 'Q4A13-NEG-S', 0, 0, 22);
INSERT INTO public.product VALUES (40, 79900, true, '2026-03-31 19:39:00.611', '2026-03-03 05:08:18.126', false, 'Q4A13-BEI-L', 0, 0, 20);
INSERT INTO public.product VALUES (47, 79900, true, '2026-03-31 19:58:43.948', '2026-03-31 19:58:43.948', false, 'Q1A12-CAF-U', 0, 0, 42);
INSERT INTO public.product VALUES (48, 79900, true, '2026-03-31 19:58:44.022', '2026-03-31 19:58:44.022', false, 'Q1A12-GRI-U', 0, 0, 44);
INSERT INTO public.product VALUES (49, 79900, true, '2026-03-31 19:58:44.288', '2026-03-31 19:58:44.288', false, 'Q1A12-BEI-U', 0, 0, 41);
INSERT INTO public.product VALUES (50, 79900, true, '2026-03-31 19:58:44.313', '2026-03-31 19:58:44.313', false, 'Q1A12-NEG-U', 0, 0, 43);


ALTER TABLE public.product ENABLE TRIGGER ALL;

--
-- Data for Name: order_item; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.order_item DISABLE TRIGGER ALL;

INSERT INTO public.order_item VALUES (8, 5, 29, 'Camiseta Estampado Frente y Manga', 'XL', 'Negro', 1, 79900, '2026-04-02 20:05:42.268', '2026-04-02 20:05:42.268', 15181);
INSERT INTO public.order_item VALUES (9, 5, 45, 'Camiseta Essentials Mujer', 'S', 'Beige', 1, 79900, '2026-04-02 20:05:42.268', '2026-04-02 20:05:42.268', 15181);


ALTER TABLE public.order_item ENABLE TRIGGER ALL;

--
-- Data for Name: payment_method; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.payment_method DISABLE TRIGGER ALL;



ALTER TABLE public.payment_method ENABLE TRIGGER ALL;

--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.payments DISABLE TRIGGER ALL;



ALTER TABLE public.payments ENABLE TRIGGER ALL;

--
-- Data for Name: payroll_period; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.payroll_period DISABLE TRIGGER ALL;



ALTER TABLE public.payroll_period ENABLE TRIGGER ALL;

--
-- Data for Name: payroll_entry; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.payroll_entry DISABLE TRIGGER ALL;



ALTER TABLE public.payroll_entry ENABLE TRIGGER ALL;

--
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.permission DISABLE TRIGGER ALL;

INSERT INTO public.permission VALUES (1, 'accounting.puc.view', 'Ver Plan de Cuentas', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (2, 'accounting.puc.manage', 'Gestionar Plan de
  Cuentas', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (3, 'accounting.journal.view', 'Ver Asientos Contables', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (4, 'accounting.journal.create', 'Crear Asientos
  Contables', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (5, 'accounting.expenses.view', 'Ver Gastos', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (6, 'accounting.expenses.manage', 'Gestionar Gastos', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (7, 'accounting.payroll.view', 'Ver Nómina', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (8, 'accounting.payroll.manage', 'Gestionar Nómina', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (9, 'accounting.bank.view', 'Ver Bancos y Conciliación', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (10, 'accounting.bank.manage', 'Gestionar Bancos y
  Conciliación', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (11, 'accounting.closing.manage', 'Gestionar Cierre
  Contable', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (12, 'accounting.reports.view', 'Ver Reportes Contables', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (13, 'accounting.tax.view', 'Ver Impuestos', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (14, 'accounting.budget.view', 'Ver Presupuesto', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (15, 'accounting.budget.manage', 'Gestionar Presupuesto', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (16, 'accounting.assets.view', 'Ver Activos Fijos', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (17, 'accounting.assets.manage', 'Gestionar Activos
  Fijos', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (18, 'accounting.withholding.view', 'Ver Certificados de
  Retención', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (19, 'accounting.withholding.manage', 'Gestionar
  Certificados de Retención', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (20, 'accounting.exogena.view', 'Ver Información
  Exógena', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (21, 'accounting.audit.view', 'Ver Auditoría Contable', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (22, 'accounting.indicators.view', 'Ver Indicadores
  Financieros', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (23, 'accounting.export', 'Exportar Datos Contables', 'Contabilidad', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (24, 'inventory.clothing.view', 'Ver Prendas', 'Inventario', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (25, 'inventory.clothing.manage', 'Gestionar Prendas', 'Inventario', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (26, 'inventory.products.view', 'Ver Productos', 'Inventario', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (27, 'inventory.products.manage', 'Gestionar Productos', 'Inventario', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (28, 'inventory.stock.view', 'Ver Stock', 'Inventario', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (29, 'inventory.images.manage', 'Gestionar Imágenes', 'Inventario', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (30, 'sales.orders.view', 'Ver Pedidos', 'Ventas', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (31, 'sales.orders.manage', 'Gestionar Pedidos', 'Ventas', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (32, 'sales.customers.view', 'Ver Clientes', 'Ventas', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (33, 'sales.customers.manage', 'Gestionar Clientes', 'Ventas', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (34, 'sales.reports.view', 'Ver Reportes de Ventas', 'Ventas', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (35, 'sales.dian.view', 'Ver Facturación DIAN', 'Ventas', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (36, 'sales.dian.manage', 'Gestionar Facturación DIAN', 'Ventas', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (37, 'admin.users.view', 'Ver Usuarios', 'Administración', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (38, 'admin.users.manage', 'Gestionar Usuarios', 'Administración', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (39, 'admin.roles.view', 'Ver Roles', 'Administración', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (40, 'admin.roles.manage', 'Gestionar Roles', 'Administración', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (41, 'admin.permissions.manage', 'Gestionar Permisos', 'Administración', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (42, 'admin.logs.view', 'Ver Logs del Sistema', 'Administración', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (43, 'admin.settings.manage', 'Gestionar Configuración', 'Administración', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (44, 'catalog.categories.view', 'Ver Categorías', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (45, 'catalog.categories.manage', 'Gestionar Categorías', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (46, 'catalog.collections.view', 'Ver Colecciones', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (47, 'catalog.collections.manage', 'Gestionar
  Colecciones', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (48, 'catalog.designs.view', 'Ver Diseños', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (49, 'catalog.designs.manage', 'Gestionar Diseños', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (50, 'catalog.colors.view', 'Ver Colores', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (51, 'catalog.colors.manage', 'Gestionar Colores', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (52, 'catalog.sizes.view', 'Ver Tallas', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (53, 'catalog.sizes.manage', 'Gestionar Tallas', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (54, 'catalog.seasons.view', 'Ver Temporadas', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (55, 'catalog.seasons.manage', 'Gestionar Temporadas', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (56, 'catalog.providers.view', 'Ver Proveedores', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);
INSERT INTO public.permission VALUES (57, 'catalog.providers.manage', 'Gestionar Proveedores', 'Catálogo', NULL, '2026-04-02 13:23:26.711', NULL);


ALTER TABLE public.permission ENABLE TRIGGER ALL;

--
-- Data for Name: pqr; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.pqr DISABLE TRIGGER ALL;



ALTER TABLE public.pqr ENABLE TRIGGER ALL;

--
-- Data for Name: pqr_image; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.pqr_image DISABLE TRIGGER ALL;



ALTER TABLE public.pqr_image ENABLE TRIGGER ALL;

--
-- Data for Name: provider_document; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.provider_document DISABLE TRIGGER ALL;



ALTER TABLE public.provider_document ENABLE TRIGGER ALL;

--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.returns DISABLE TRIGGER ALL;



ALTER TABLE public.returns ENABLE TRIGGER ALL;

--
-- Data for Name: return_item; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.return_item DISABLE TRIGGER ALL;



ALTER TABLE public.return_item ENABLE TRIGGER ALL;

--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.role DISABLE TRIGGER ALL;

INSERT INTO public.role VALUES ('Manager', '2025-11-19 14:07:59.333', 'Gerente de tienda', 2, NULL);
INSERT INTO public.role VALUES ('Sales', '2025-11-19 14:07:59.333', 'Vendedor', 3, NULL);
INSERT INTO public.role VALUES ('Shipping', '2025-11-19 14:07:59.333', 'Encargado de envio de productos', 4, NULL);
INSERT INTO public.role VALUES ('Reader', '2025-11-19 14:07:59.333', 'Rol de solo consultas', 6, NULL);
INSERT INTO public.role VALUES ('ADMINISTRADOR', '2025-11-19 14:07:59.333', 'Administrador con todos los permisos', 1, '2026-04-02 18:21:13.013');
INSERT INTO public.role VALUES ('CONTADOR', '2025-11-19 14:07:59.333', 'Rol para contador de la empresa', 5, '2026-04-02 18:21:43.653');


ALTER TABLE public.role ENABLE TRIGGER ALL;

--
-- Data for Name: role_permission; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.role_permission DISABLE TRIGGER ALL;



ALTER TABLE public.role_permission ENABLE TRIGGER ALL;

--
-- Data for Name: shipping_provider; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.shipping_provider DISABLE TRIGGER ALL;



ALTER TABLE public.shipping_provider ENABLE TRIGGER ALL;

--
-- Data for Name: shipment; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.shipment DISABLE TRIGGER ALL;



ALTER TABLE public.shipment ENABLE TRIGGER ALL;

--
-- Data for Name: shipment_rate; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.shipment_rate DISABLE TRIGGER ALL;



ALTER TABLE public.shipment_rate ENABLE TRIGGER ALL;

--
-- Data for Name: size_guide; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.size_guide DISABLE TRIGGER ALL;

INSERT INTO public.size_guide VALUES (1, 'XS', '48', '68', '2026-03-09 13:25:02.356', '2026-03-09 13:25:02.356');
INSERT INTO public.size_guide VALUES (2, 'S', '50', '70', '2026-03-09 13:25:16.777', '2026-03-09 13:25:16.777');
INSERT INTO public.size_guide VALUES (3, 'M', '53', '72', '2026-03-09 13:25:31.494', '2026-03-09 13:25:31.494');
INSERT INTO public.size_guide VALUES (4, 'L', '56', '74', '2026-03-09 13:25:45.747', '2026-03-09 13:25:45.747');
INSERT INTO public.size_guide VALUES (5, 'XL', '59', '76', '2026-03-09 13:26:00.868', '2026-03-09 13:26:00.868');
INSERT INTO public.size_guide VALUES (6, 'U', '75', '65', '2026-03-09 13:26:39.688', '2026-03-09 13:26:39.688');


ALTER TABLE public.size_guide ENABLE TRIGGER ALL;

--
-- Data for Name: subscriber; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.subscriber DISABLE TRIGGER ALL;



ALTER TABLE public.subscriber ENABLE TRIGGER ALL;

--
-- Data for Name: tracking_history; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.tracking_history DISABLE TRIGGER ALL;



ALTER TABLE public.tracking_history ENABLE TRIGGER ALL;

--
-- Data for Name: user_app; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.user_app DISABLE TRIGGER ALL;



ALTER TABLE public.user_app ENABLE TRIGGER ALL;

--
-- Data for Name: user_role; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.user_role DISABLE TRIGGER ALL;



ALTER TABLE public.user_role ENABLE TRIGGER ALL;

--
-- Data for Name: withholding_certificate; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

ALTER TABLE public.withholding_certificate DISABLE TRIGGER ALL;



ALTER TABLE public.withholding_certificate ENABLE TRIGGER ALL;

--
-- Name: accounting_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.accounting_audit_log_id_seq', 1, false);


--
-- Name: accounting_closing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.accounting_closing_id_seq', 1, false);


--
-- Name: address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.address_id_seq', 1, false);


--
-- Name: bank_account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.bank_account_id_seq', 1, false);


--
-- Name: bank_statement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.bank_statement_id_seq', 1, false);


--
-- Name: bank_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.bank_transaction_id_seq', 1, false);


--
-- Name: budget_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.budget_id_seq', 1, false);


--
-- Name: category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.category_id_seq', 4, false);


--
-- Name: city_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.city_id_seq', 1, false);


--
-- Name: clothing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.clothing_id_seq', 7, false);


--
-- Name: clothing_size_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.clothing_size_id_seq', 45, false);


--
-- Name: collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.collection_id_seq', 5, false);


--
-- Name: color_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.color_id_seq', 13, false);


--
-- Name: customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.customer_id_seq', 5, false);


--
-- Name: customer_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.customer_type_id_seq', 1, false);


--
-- Name: department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.department_id_seq', 1, false);


--
-- Name: depreciation_entry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.depreciation_entry_id_seq', 1, false);


--
-- Name: design_clothing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.design_clothing_id_seq', 60, false);


--
-- Name: design_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.design_id_seq', 7, false);


--
-- Name: design_provider_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.design_provider_id_seq', 1, false);


--
-- Name: dian_e_invoicing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.dian_e_invoicing_id_seq', 2, false);


--
-- Name: dian_note_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.dian_note_id_seq', 1, false);


--
-- Name: dian_resolution_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.dian_resolution_id_seq', 1, true);


--
-- Name: employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.employee_id_seq', 1, false);


--
-- Name: expense_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.expense_category_id_seq', 1, false);


--
-- Name: expense_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.expense_id_seq', 1, false);


--
-- Name: fixed_asset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.fixed_asset_id_seq', 1, false);


--
-- Name: gender_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.gender_id_seq', 4, false);


--
-- Name: identification_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.identification_type_id_seq', 1, false);


--
-- Name: image_clothing_id_image_clothing_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.image_clothing_id_image_clothing_seq', 71, false);


--
-- Name: journal_entry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.journal_entry_id_seq', 1, false);


--
-- Name: journal_entry_line_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.journal_entry_line_id_seq', 1, false);


--
-- Name: log_error_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.log_error_id_seq', 4, true);


--
-- Name: order_id_order_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.order_id_order_seq', 6, false);


--
-- Name: order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.order_item_id_seq', 10, false);


--
-- Name: payment_method_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.payment_method_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: payroll_entry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.payroll_entry_id_seq', 1, false);


--
-- Name: payroll_period_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.payroll_period_id_seq', 1, false);


--
-- Name: permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.permission_id_seq', 1, false);


--
-- Name: pqr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.pqr_id_seq', 1, false);


--
-- Name: pqr_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.pqr_image_id_seq', 1, false);


--
-- Name: product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.product_id_seq', 51, false);


--
-- Name: production_type_id_production_type_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.production_type_id_production_type_seq', 1, false);


--
-- Name: provider_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.provider_document_id_seq', 1, false);


--
-- Name: puc_account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.puc_account_id_seq', 1, false);


--
-- Name: return_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.return_item_id_seq', 1, false);


--
-- Name: returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.returns_id_seq', 1, false);


--
-- Name: role_id_role_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.role_id_role_seq', 1, false);


--
-- Name: role_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.role_permission_id_seq', 1, false);


--
-- Name: season_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.season_id_seq', 1, false);


--
-- Name: shipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.shipment_id_seq', 1, false);


--
-- Name: shipment_rate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.shipment_rate_id_seq', 1, false);


--
-- Name: shipping_provider_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.shipping_provider_id_seq', 1, false);


--
-- Name: size_guide_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.size_guide_id_seq', 1, false);


--
-- Name: size_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.size_id_seq', 7, false);


--
-- Name: subscriber_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.subscriber_id_seq', 1, false);


--
-- Name: tracking_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.tracking_history_id_seq', 1, false);


--
-- Name: user_app_id_user_app_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.user_app_id_user_app_seq', 1, false);


--
-- Name: user_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.user_role_id_seq', 1, false);


--
-- Name: withholding_certificate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.withholding_certificate_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict iV0Ldtvzue9MM0KqP1oWG1q6LFnKc2ZgXmV1qTRAFHYJkL3J7nCv54GvxT6K8Lu

