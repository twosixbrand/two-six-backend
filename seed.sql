--
-- PostgreSQL database dump
--

\restrict UpXTGjcIKwdTw1KIKcElI3Zr8xHtLvUw7cMAguoOtkBoJyojHvofRJQBsK4FNga

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
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public._prisma_migrations VALUES ('2148b468-619d-453e-ae8b-6a42cc6202c1', '1906b3b8ee68bdf7b9254b98938a09d1b9536f630e0dbd3a94b0afb45428dde2', '2025-12-27 17:56:38.184202-05', '20251025160231_update_category_table_bame', NULL, NULL, '2025-12-27 17:56:38.182444-05', 1);
INSERT INTO public._prisma_migrations VALUES ('54d194ce-3300-47fa-80ec-84f5d93a6109', 'fd0adb2a25259bccfebc8da64d95cee02d24f401f3116284bb7a6066d53f5a34', '2025-12-27 17:56:38.147782-05', '20251022025530_migrcion_backend_bd_two_six', NULL, NULL, '2025-12-27 17:56:38.140313-05', 1);
INSERT INTO public._prisma_migrations VALUES ('f2db9acf-5383-4155-a2d0-c47de9459bea', 'a3771dbaaf0b2d9388ef45d4d4b32cbc9dd88e6d0c2e257fe29ef6a0a5ad0dd8', '2025-12-27 17:56:38.152482-05', '20251023003446_update_product_for_outlet', NULL, NULL, '2025-12-27 17:56:38.148293-05', 1);
INSERT INTO public._prisma_migrations VALUES ('730a6bbe-5415-44d7-a143-a41af98a52c4', '70bc17e8fb9c4e1729cfcbc1f3abaeaffa9684b732f195110dd8efca7399fd25', '2025-12-27 17:56:38.284924-05', '20251030233558_update_schema_based_on_diagram', NULL, NULL, '2025-12-27 17:56:38.229069-05', 1);
INSERT INTO public._prisma_migrations VALUES ('1f82f9d9-aa04-4af7-b8b3-a2d57d29e804', 'a21d7daa5b380e42ea7c9e513d0bc5d1a04fa031a8a772c46337e10c9c30af9e', '2025-12-27 17:56:38.154978-05', '20251023033042_add_collection_table', NULL, NULL, '2025-12-27 17:56:38.152879-05', 1);
INSERT INTO public._prisma_migrations VALUES ('c189789c-648c-46d1-ab55-37311d8312b3', '319603e9ce1e09040d5d88f064222d9626e2f06331147dab0c9dc817eab71a9a', '2025-12-27 17:56:38.185654-05', '20251025185523_add_type_clothing_table', NULL, NULL, '2025-12-27 17:56:38.184505-05', 1);
INSERT INTO public._prisma_migrations VALUES ('91542a22-a4ef-4c4c-a404-64a750f42095', 'c639e1b1c737d26b65274673837ed1893885f9d0309db8179a0d63a2e248c7ee', '2025-12-27 17:56:38.156621-05', '20251023033508_add_category_t_table', NULL, NULL, '2025-12-27 17:56:38.155334-05', 1);
INSERT INTO public._prisma_migrations VALUES ('0d890f6f-e93f-4bfa-ae82-ad7a9051a8ef', 'b621de4df38dd2193a50a9933febc8e7ccee35973c6c6177029c006d2e03080e', '2025-12-27 17:56:38.161636-05', '20251023035838_add_consecutive_category_table', NULL, NULL, '2025-12-27 17:56:38.157028-05', 1);
INSERT INTO public._prisma_migrations VALUES ('bf94e683-864a-4ec5-a1f9-e8ebfb421d3f', '49580c9c5e592d3b7aa87d8740b847ed0588a5f3d4d5064d6c386441dc017ae1', '2025-12-27 17:56:38.162927-05', '20251023040605_update_category_gender_table', NULL, NULL, '2025-12-27 17:56:38.162024-05', 1);
INSERT INTO public._prisma_migrations VALUES ('eb1d672b-aa0c-4138-b637-977b0ad423d4', '46db98e74a64d8e522579c51ce22a4bd0926dc93b253b0d277024c9b77d89f40', '2025-12-27 17:56:38.188083-05', '20251026015014_rename_type_clothing_table', NULL, NULL, '2025-12-27 17:56:38.185925-05', 1);
INSERT INTO public._prisma_migrations VALUES ('50a6cfa1-e8f2-4b80-a1d8-c863ac4505e4', '2b632cb4ae6df86ac879f50bc22168e059563846b9e7923ac2b87487b631dc69', '2025-12-27 17:56:38.166102-05', '20251025050201_add_clothing_table', NULL, NULL, '2025-12-27 17:56:38.163303-05', 1);
INSERT INTO public._prisma_migrations VALUES ('7c095b30-9d3d-45cf-bfea-f35cf7a099ac', '371dfbed7799813ec32128cf2ad95c40eb627006f4f6be69555c4b40679c2c13', '2025-12-27 17:56:38.170057-05', '20251025054236_update_clothing_id_length', NULL, NULL, '2025-12-27 17:56:38.166507-05', 1);
INSERT INTO public._prisma_migrations VALUES ('ded44039-e176-4a17-9d88-96f3f4a57d4c', '44414ec3405d790c7c0fdce75d30603ef91fe16eb420051627ca869e743bb1cb', '2025-12-27 17:56:38.307049-05', '20251107030634_update_design_table', NULL, NULL, '2025-12-27 17:56:38.306236-05', 1);
INSERT INTO public._prisma_migrations VALUES ('6d31a07a-f190-4f28-ad55-741e75e3b408', '58870d607f0ed39a69ddb5430dd53134a5e96e5e8eb210ebac02a1361c700c28', '2025-12-27 17:56:38.170981-05', '20251025060846_add_component_stack_to_errorlog', NULL, NULL, '2025-12-27 17:56:38.170312-05', 1);
INSERT INTO public._prisma_migrations VALUES ('7cb4694b-e4cb-4a7b-a1ea-66ac7fe7146b', 'b6f9d0320c4793f12e12216b87f84fb776d8cd50c96d77753fe1b797570b07dc', '2025-12-27 17:56:38.201251-05', '20251026174307_add_user_role_tables', NULL, NULL, '2025-12-27 17:56:38.188414-05', 1);
INSERT INTO public._prisma_migrations VALUES ('6d8ae4de-239a-442e-a039-1aedbb7e0a30', '7f23111df10c0a3843bb0ddc5ffec7a115a53a71f332f2b38983b6587d304047', '2025-12-27 17:56:38.171904-05', '20251025142803_add_tracing_fields_to_errorlog', NULL, NULL, '2025-12-27 17:56:38.171251-05', 1);
INSERT INTO public._prisma_migrations VALUES ('41ab624c-11ff-4de2-9081-a33f40c12bfb', 'f83363172a995de53547239b8a2128134afe41ffaa124a397f33b27f8d7f8ea5', '2025-12-27 17:56:38.174722-05', '20251025154335_rename_category_t_to_category', NULL, NULL, '2025-12-27 17:56:38.172156-05', 1);
INSERT INTO public._prisma_migrations VALUES ('d08a1840-6093-49dc-ad4d-6cb88b89bc6d', 'a3407f3cdb628f687b1d90bf5acdb630dfaafadad11fbf34105aef4159a6cde0', '2025-12-27 17:56:38.286699-05', '20251103001053_update_schema_based_on_diagram', NULL, NULL, '2025-12-27 17:56:38.28548-05', 1);
INSERT INTO public._prisma_migrations VALUES ('72062744-45c3-40a8-b789-3646b91d92a8', '32b571a2a063aa377d2931ca2538c19ea0fb92e76c62473a3f21fb9823ca1f23', '2025-12-27 17:56:38.182068-05', '20251025155955_update_category_code_cat_to_varchar', NULL, NULL, '2025-12-27 17:56:38.175019-05', 1);
INSERT INTO public._prisma_migrations VALUES ('395aad38-fd95-49ce-b82d-c5332e854b33', '38e52f9c6fd6326a2995305fb840e5a1328c6cd037150a04384978efa31c5b94', '2025-12-27 17:56:38.205143-05', '20251028024854_enter_a_name_for_the_new_migration_renamed_user_to_user_app', NULL, NULL, '2025-12-27 17:56:38.201588-05', 1);
INSERT INTO public._prisma_migrations VALUES ('db7f2ba9-929e-4106-b38d-1fb185625f47', '84ac15482f8b8718d9c7cd234776470737655830d2c0c8863a94a1ba1d2a22fe', '2025-12-27 17:56:38.300476-05', '20251106040120_add_user_password', NULL, NULL, '2025-12-27 17:56:38.299617-05', 1);
INSERT INTO public._prisma_migrations VALUES ('6d3582a9-91ed-4736-9d6b-1bc8d43130a4', '1dc3b38a3214a2e37e1e171265a6895dac52bbac6d4807e5f150f9ecd30f9455', '2025-12-27 17:56:38.212794-05', '20251029043527_add_proveedor_table', NULL, NULL, '2025-12-27 17:56:38.205469-05', 1);
INSERT INTO public._prisma_migrations VALUES ('e94ae4a3-d852-4e9b-abc1-b38e8620dc7a', '868a968a9770c1e493e1a53104f3a0bb8ad61ad1d39a0be567010cc940a4b58c', '2025-12-27 17:56:38.288211-05', '20251103005302_add_gender_to_clothing', NULL, NULL, '2025-12-27 17:56:38.287088-05', 1);
INSERT INTO public._prisma_migrations VALUES ('a51f7372-cf07-4578-a5b0-848bb09cb989', '5685411c5b42638869e4e03e7d81e46a0d50d7df8eb7ab8c5587afd89117c4f2', '2025-12-27 17:56:38.225037-05', '20251029043956_add_proveedor_table', NULL, NULL, '2025-12-27 17:56:38.213159-05', 1);
INSERT INTO public._prisma_migrations VALUES ('2633700a-1cc8-4fad-9c64-149891ce0e7a', '1c464d25f65ffc22e394eef4ad09c113861b3a42df4234fdb0ed85dc208cfe8b', '2025-12-27 17:56:38.228293-05', '20251029173709_update_proveedor_to_provider', NULL, NULL, '2025-12-27 17:56:38.225384-05', 1);
INSERT INTO public._prisma_migrations VALUES ('55000c1e-b9d2-4736-bbed-e4bdd3498e44', '68c3b4c685f70f79ce891e8eaba6db7ccf62efcd742877eeb855635ff61c2ec7', '2025-12-27 17:56:38.290478-05', '20251103011922_add_consecutive_number_to_product', NULL, NULL, '2025-12-27 17:56:38.288539-05', 1);
INSERT INTO public._prisma_migrations VALUES ('7a1f1b17-dc1b-43cb-b9f3-2fcf5d94ca47', 'f7a2fe397ad11e590e68adcf329d0d7efd2e3dc8509ea587cb77c1630052e4c8', '2025-12-27 17:56:38.303309-05', '20251107023325_add_season_table_and_relation', NULL, NULL, '2025-12-27 17:56:38.300837-05', 1);
INSERT INTO public._prisma_migrations VALUES ('852e3a1f-f626-4369-97b0-b97413fcc918', '72a5215c68a441e4c35cca7b1b120e784ab6ed2c8124dcf94e29a28944c2b17d', '2025-12-27 17:56:38.291453-05', '20251104010336_update_creat_at_to_product', NULL, NULL, '2025-12-27 17:56:38.290709-05', 1);
INSERT INTO public._prisma_migrations VALUES ('883511a4-3438-43e9-9182-7aaa71f3c198', '2419106abaa24ab88578cfb81f056a686a685bae0fe481868acd1db5d561072a', '2025-12-27 17:56:38.299187-05', '20251105025430_update_ids', NULL, NULL, '2025-12-27 17:56:38.29181-05', 1);
INSERT INTO public._prisma_migrations VALUES ('374fb48e-7755-47b4-a03e-ca14326d59c5', '52de09e7087c7660623d05ede34ff979ba9c0360984699f5679c16c290b30bab', '2025-12-27 17:56:38.30896-05', '20251107033417_add_warranty_quantity_to_design_clothing', NULL, NULL, '2025-12-27 17:56:38.308297-05', 1);
INSERT INTO public._prisma_migrations VALUES ('cc51b332-ac5a-4480-bf68-ef14625cc863', '14902c8cd4a9d956b8fa6c5320104a3b7a4b95d1dfbe323e79e36e0255121752', '2025-12-27 17:56:38.305875-05', '20251107024359_rename_collection_year_column', NULL, NULL, '2025-12-27 17:56:38.303609-05', 1);
INSERT INTO public._prisma_migrations VALUES ('50c1fa39-90b7-4332-bac3-217019a30d42', '7ffd7c25964db4c8d9b51ca6f85a597036edcded7f02854edd49485a6e658397', '2025-12-27 17:56:38.307985-05', '20251107031835_add_name_to_collection', NULL, NULL, '2025-12-27 17:56:38.307371-05', 1);
INSERT INTO public._prisma_migrations VALUES ('ceff9f7b-de62-4ba8-9bff-54432e65519a', '730e8793bb820aef7bc171ec3af510db8596b76f39b035760ef8e2cff776ef85', '2025-12-27 17:56:38.314453-05', '20251107041223_rename_orders_to_order', NULL, NULL, '2025-12-27 17:56:38.31031-05', 1);
INSERT INTO public._prisma_migrations VALUES ('b2fc17d3-eff8-48d6-b309-d7a4858f1a61', '19bc4e010894f22e7bf34310e2049d2d70234947c47da0673a8aa124651b83c4', '2025-12-27 17:56:38.309946-05', '20251107035058_add_sku_to_product', NULL, NULL, '2025-12-27 17:56:38.309289-05', 1);
INSERT INTO public._prisma_migrations VALUES ('37ce5cb1-c9f8-4504-ba2e-3ea3f8bd79b2', '4e14625db450fb2c5ffd22931685cf34a30d08e5bbf82a95f5c0ffef89afbf3d', '2025-12-27 17:56:38.322931-05', '20251107041423_rename_order_items_to_order_item', NULL, NULL, '2025-12-27 17:56:38.314818-05', 1);
INSERT INTO public._prisma_migrations VALUES ('9260ac8a-264b-406c-a41a-8166a6658eb2', '7689f970d8170a64b3e54a4133307683d19d193911b65c03496e0bb21b70f4a5', '2025-12-27 17:56:38.326197-05', '20251107045013_refactor_order_table', NULL, NULL, '2025-12-27 17:56:38.324061-05', 1);
INSERT INTO public._prisma_migrations VALUES ('97a1fed3-b530-4696-b047-7009d2b5c85d', '57f54ade1bda10152044bfcc8931fc7497d68f41013301cd81751c330a544d99', '2025-12-27 17:56:38.327161-05', '20251107162911_add_iva_item_to_order_item', NULL, NULL, '2025-12-27 17:56:38.32657-05', 1);
INSERT INTO public._prisma_migrations VALUES ('26e45338-17d2-423f-8b49-e9d4539c64be', '573bc1a89dd376e0a10c95541cc9d78e000178fd6286675b403d20640347011c', '2025-12-27 17:56:38.3297-05', '20251109173301_change_design_quantity_to_int', NULL, NULL, '2025-12-27 17:56:38.327499-05', 1);
INSERT INTO public._prisma_migrations VALUES ('3d322dda-b9fe-49a7-b3fb-2d7c04e70462', '2f06e10e5198acf458d67df72ebf1c2b1988b13e97060602848c0c4c291e6742', '2025-12-27 17:56:38.356346-05', '20251227202129_add_image_url_to_design', NULL, NULL, '2025-12-27 17:56:38.355835-05', 1);
INSERT INTO public._prisma_migrations VALUES ('afc8dfc4-85b6-4561-8706-a11f9a33aae5', 'e6c8a474977bb2239f84631558be8a55f52973a9e49f61630329a7c7963daee9', '2025-12-27 17:56:38.330985-05', '20251111121653_add_design_description', NULL, NULL, '2025-12-27 17:56:38.33006-05', 1);
INSERT INTO public._prisma_migrations VALUES ('84e99889-3552-4b70-a869-faaddef61a75', 'a2574d6c03cbb7b39799f3ffb85dde18ab616f52c2ff771f12f3db477b5043e7', '2025-12-27 17:56:38.335567-05', '20251111134732_refactor_design_provider_relations', NULL, NULL, '2025-12-27 17:56:38.331372-05', 1);
INSERT INTO public._prisma_migrations VALUES ('14de65e5-7539-4972-93c4-3ecf4e899fb2', '43f9f23900c86ed19bf714958d35ec61c33ae2371bf71e251d02f8f0e0c22945', '2025-12-27 17:56:38.339689-05', '20251114034607_renamed_returnitems_to_returnitem', NULL, NULL, '2025-12-27 17:56:38.336199-05', 1);
INSERT INTO public._prisma_migrations VALUES ('30b1a8bd-4847-4534-a8b3-5427c19c88c6', '4cb2ed12a4be51eb9a8896e9902034261792f7c765a5b5a01a56cbb316d735ae', '2025-12-27 17:56:38.362894-05', '20251227221013_rename_design_clothing_to_clothing_color', NULL, NULL, '2025-12-27 17:56:38.357867-05', 1);
INSERT INTO public._prisma_migrations VALUES ('e51f5b1e-0d7b-436a-ae29-b25e69d497b9', '690e1611aa236dc4d69705173aabdd7b6d0cfc01e6d8b5d79aa8a8cd9b7ab875', '2025-12-27 17:56:38.340671-05', '20251114045210_add_discount_percentage', NULL, NULL, '2025-12-27 17:56:38.340066-05', 1);
INSERT INTO public._prisma_migrations VALUES ('1611b46f-4bd0-48c9-8f35-48119cacb1b1', '40aa7788788bb673fe9ce2b08605a758284787420c65f6595942f7e59efc908a', '2025-12-27 17:56:38.341612-05', '20251116211422_increase_error_log_page_length', NULL, NULL, '2025-12-27 17:56:38.340984-05', 1);
INSERT INTO public._prisma_migrations VALUES ('9f6f1642-25bf-4e68-80d0-0f576d22d480', '41eed41424f952c32132cd0e12cf967a83928542ee26304cac76952262f71c37', '2025-12-27 17:56:38.34385-05', '20251120014400_add_otp_to_user', NULL, NULL, '2025-12-27 17:56:38.341952-05', 1);
INSERT INTO public._prisma_migrations VALUES ('130036bc-b02d-4015-8237-d737b395ee98', '32ca84dfe600648d41d4483ab3a605f9729c54f0b7b4d4b673a5e87c287aad9c', '2025-12-27 17:59:21.388037-05', '20251227225921_extract_clothing_size', NULL, NULL, '2025-12-27 17:59:21.378111-05', 1);
INSERT INTO public._prisma_migrations VALUES ('b7f53d54-96d2-4fbc-8569-8da0858ee1ea', '5039831213382ea87756e7507494694cdccadac30efe7f4e0dd5d7bece82b444', '2025-12-27 17:56:38.344819-05', '20251125020957_remove_product_description', NULL, NULL, '2025-12-27 17:56:38.344207-05', 1);
INSERT INTO public._prisma_migrations VALUES ('8f6936ab-410c-4fb3-a002-8ddfa8641396', '869771ada7ca0b0ccf7a9c895cc9b07f78f37457bfc5f4a8e4a9375b233931de', '2025-12-27 17:56:38.345714-05', '20251126002757_removed_name_and_consecutive_from_product', NULL, NULL, '2025-12-27 17:56:38.345129-05', 1);
INSERT INTO public._prisma_migrations VALUES ('5a234f67-abcb-4557-8d92-d8c8db30f5ee', 'c395fd771a50b094407c4bff3bea59e4ab31ec50fb5918e006b45d8eea14ba3a', '2025-12-27 17:56:38.352292-05', '20251219003145_sync_schema', NULL, NULL, '2025-12-27 17:56:38.346032-05', 1);
INSERT INTO public._prisma_migrations VALUES ('5b4c223f-6dbc-46ea-843d-90356e2a2f0d', 'dbf236d525fd45dcfe7ea5ade5f22f64238ca88eb5128a2dc8676df05fb9795c', '2025-12-27 23:37:00.111116-05', '20251228043700_remove_stock_add_min_alert', NULL, NULL, '2025-12-27 23:37:00.013108-05', 1);
INSERT INTO public._prisma_migrations VALUES ('5058c582-185f-49cb-a4d0-404744265bea', '9a22c35136cf36b08c646a094ba1ff861a67ccf94fc3e05909b143735733eb67', '2025-12-27 17:56:38.353791-05', '20251219013050_add_image_url_to_design_clothing', NULL, NULL, '2025-12-27 17:56:38.352652-05', 1);
INSERT INTO public._prisma_migrations VALUES ('d8909a03-f4cf-46e2-8e85-85bc7766a9a1', 'f8ce80f19c8422d9d590edfbd7e5c13c8e7f17346dc7f445bc4b0cd11b678f32', '2025-12-27 17:56:38.354778-05', '20251219020637_remove_image_url_from_product', NULL, NULL, '2025-12-27 17:56:38.354149-05', 1);
INSERT INTO public._prisma_migrations VALUES ('013f68f3-e1ba-44ce-916b-154250a5b61a', '1c1f781037ef3df58f5dd87b6072a17dd268b831d56b69341aacd4c1d1401f96', '2025-12-27 17:56:38.355564-05', '20251227011100_remove_quantity_from_design', NULL, NULL, '2025-12-27 17:56:38.355046-05', 1);
INSERT INTO public._prisma_migrations VALUES ('2209b4a8-bf13-4cc8-8935-6be6d1275bc8', '025024e5c30d8bd07d733f822737cd68cd34752cbf0712c9e78a6fca8bd9073b', '2025-12-29 17:40:30.471636-05', '20251229224030_remove_design_image_url', NULL, NULL, '2025-12-29 17:40:30.465601-05', 1);
INSERT INTO public._prisma_migrations VALUES ('874d5a2c-a59d-417f-bf93-02cc00f9905f', '2a023555d5ae20a955975b400a8c70b9e78128ab1a3cd544f432707ff31bd1f7', '2026-01-20 20:37:30.321061-05', '20260121013616_add_gender_table', NULL, NULL, '2026-01-20 20:37:30.296635-05', 1);
INSERT INTO public._prisma_migrations VALUES ('5e5cc16f-8234-4f62-b4f1-cbeadf3dda47', '20489af62ab59f1f2235f18919ed4fd3ec6fdf9e9da2ad34e60cd97bd0dacef2', '2026-01-20 21:01:09.288089-05', '20260121020036_refactor_gender_relation', NULL, NULL, '2026-01-20 21:01:09.274813-05', 1);
INSERT INTO public._prisma_migrations VALUES ('15a5c9cd-4dac-4b86-9ec6-17a6b9127ddd', '0b094d73665f50b302acd8d622f289f325521541e3b36c9f85f38ecfbc31a8f9', '2026-01-25 11:11:43.714947-05', '20260125161143_refactor_clothing_images', NULL, NULL, '2026-01-25 11:11:43.697668-05', 1);


--
-- Data for Name: customer_type; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.customer_type VALUES (1, 'Persona Natural', '2025-12-27 17:56:40.67', NULL);
INSERT INTO public.customer_type VALUES (2, 'Persona Juridica', '2025-12-27 17:56:40.67', NULL);


--
-- Data for Name: identification_type; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.identification_type VALUES (1, 'Cédula de Ciudadanía', '2025-12-27 17:56:40.671', '2025-12-27 17:56:40.671', 'CC');
INSERT INTO public.identification_type VALUES (2, 'Número de Identificación Tributaria', '2025-12-27 17:56:40.671', '2025-12-27 17:56:40.671', 'NIT');
INSERT INTO public.identification_type VALUES (3, 'Cédula de Extranjería', '2025-12-27 17:56:40.671', '2025-12-27 17:56:40.671', 'CE');
INSERT INTO public.identification_type VALUES (4, 'Pasaporte', '2025-12-27 17:56:40.671', '2025-12-27 17:56:40.671', 'PAS');
INSERT INTO public.identification_type VALUES (5, 'Tarjeta de Identidad', '2025-12-27 17:56:40.671', '2025-12-27 17:56:40.671', 'TI');


--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.customer VALUES (1, 1, 'Carlos Ramirez', 'carlos.r@email.com', '3209876543', false, 'Calle 100 # 20-30', 'Bogotá', 'Cundinamarca', '110111', 'Colombia', '2025-12-27 17:56:40.672', NULL, 1, NULL, NULL, false);
INSERT INTO public.customer VALUES (2, 2, 'Moda Express SAS', 'compras@modaexpress.co', '3001112233', true, 'Carrera 45 # 10-15 Bodega 5', 'Medellín', 'Antioquia', '050001', 'Colombia', '2025-12-27 17:56:40.672', NULL, 2, NULL, NULL, false);
INSERT INTO public.customer VALUES (1, 1, 'Test User', 'test@test.com', '3001234567', false, 'Calle 123', 'Leticia', 'Amazonas', '000000', 'Colombia', '2026-02-27 17:22:29.078', '2026-02-27 17:57:45.472', 4, NULL, NULL, false);
INSERT INTO public.customer VALUES (1, 1, 'kammm', 'asdasd@dsasd.com', '23434234', false, 'cl 76 45 09', 'Andes', 'Antioquia', '000000', 'Colombia', '2026-02-27 22:58:45.824', '2026-02-27 22:58:45.824', 5, NULL, NULL, false);
INSERT INTO public.customer VALUES (1, 1, 'Jorge A ', 'jmanriquejh@hotmail.com', 'Manrique J', false, 'Cr 50 A # 24 - 51', 'Itagüí', 'Antioquia', '000000', 'Colombia', '2026-03-04 00:15:33.505', '2026-03-04 02:14:37.155', 6, NULL, NULL, true);
INSERT INTO public.customer VALUES (1, 1, 'Vanessa buitrago', 'vanebuitragop6@gmail.com', '3152959882', false, 'Cr 50 A # 24 - 51, Apto 514.', 'Itagüí', 'Antioquia', '000000', 'Colombia', '2026-03-04 02:32:38.441', '2026-03-04 02:35:00.295', 7, NULL, NULL, true);
INSERT INTO public.customer VALUES (1, 1, 'Test', 'test500@example.com', '1234567890', false, 'Calle 123', 'Bogota', 'Cundinamarca', '000000', 'Colombia', '2026-03-04 02:52:21.03', '2026-03-04 02:52:39.69', 8, '$2b$10$7tRKSEkYOJVUp2mgs97Fd.14Yb22lI1Wor1.RjcGyDQe6eUzDt4DK', '2026-03-04 03:02:39.621', false);
INSERT INTO public.customer VALUES (1, 1, 'Jorge', 'jamanrique@gmail.com', '2423434', false, 'cr 50', 'Itagüí', 'Antioquia', '000000', 'Colombia', '2026-02-27 14:52:58.295', '2026-03-06 16:17:40.958', 3, NULL, NULL, true);


--
-- Data for Name: address; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--



--
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.category VALUES ('Ropa Parte Superior', '2025-12-27 17:56:40.643', 1, NULL);
INSERT INTO public.category VALUES ('Ropa Parte Inferior', '2025-12-27 17:56:40.643', 2, NULL);
INSERT INTO public.category VALUES ('Accesorios', '2025-12-27 17:56:40.643', 3, NULL);
INSERT INTO public.category VALUES ('Test Category 1772418417593', '2026-03-02 02:26:57.681', 4, '2026-03-02 02:26:57.681');
INSERT INTO public.category VALUES ('Test Category 1772418447248', '2026-03-02 02:27:27.371', 5, '2026-03-02 02:27:27.371');
INSERT INTO public.category VALUES ('Test Category 1772418752355', '2026-03-02 02:32:32.44', 6, '2026-03-02 02:32:32.44');


--
-- Data for Name: department; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.department VALUES (1, 'Amazonas', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (2, 'Antioquia', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (3, 'Arauca', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (4, 'Atlántico', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (5, 'Bogotá D.C.', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (6, 'Bolívar', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (7, 'Boyacá', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (8, 'Caldas', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (9, 'Caquetá', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (10, 'Casanare', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (11, 'Cauca', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (12, 'Cesar', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (13, 'Chocó', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (14, 'Córdoba', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (15, 'Cundinamarca', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (16, 'Guainía', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (17, 'Guaviare', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (18, 'Huila', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (19, 'La Guajira', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (20, 'Magdalena', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (21, 'Meta', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (22, 'Nariño', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (23, 'Norte de Santander', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (24, 'Putumayo', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (25, 'Quindío', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (26, 'Risaralda', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (27, 'San Andrés y Providencia', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (28, 'Santander', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (29, 'Sucre', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (30, 'Tolima', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (31, 'Valle del Cauca', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (32, 'Vaupés', '2025-12-15 21:09:33.387', NULL);
INSERT INTO public.department VALUES (33, 'Vichada', '2025-12-15 21:09:33.387', NULL);


--
-- Data for Name: city; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.city VALUES (1, 'Leticia', true, 35000, 1, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (2, 'Puerto Nariño', true, 35000, 1, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (3, 'Tarapacá', true, 35000, 1, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (4, 'La Pedrera', true, 35000, 1, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (5, 'Medellín', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (6, 'Bello', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (7, 'Itagüí', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (8, 'Envigado', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (9, 'Apartadó', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (10, 'Rionegro', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (11, 'Turbo', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (12, 'Caucasia', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (13, 'Sabaneta', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (14, 'La Estrella', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (15, 'Caldas', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (16, 'Copacabana', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (17, 'Girardota', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (18, 'Barbosa', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (19, 'Marinilla', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (20, 'Guarne', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (21, 'La Ceja', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (22, 'El Carmen de Viboral', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (23, 'El Retiro', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (24, 'Santuario', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (25, 'Santa Fe de Antioquia', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (26, 'Sopetrán', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (27, 'San Jerónimo', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (28, 'Yarumal', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (29, 'Santa Rosa de Osos', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (30, 'Amagá', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (31, 'Ciudad Bolívar', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (32, 'Jardín', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (33, 'Andes', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (34, 'Urrao', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (35, 'Chigorodó', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (36, 'Carepa', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (37, 'Necoclí', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (38, 'Arboletes', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (39, 'San Pedro de los Milagros', true, 15000, 2, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (40, 'Arauca', true, 25000, 3, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (41, 'Arauquita', true, 25000, 3, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (42, 'Saravena', true, 25000, 3, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (43, 'Tame', true, 25000, 3, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (44, 'Fortul', true, 25000, 3, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (45, 'Puerto Rondón', true, 25000, 3, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (46, 'Cravo Norte', true, 25000, 3, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (47, 'Barranquilla', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (48, 'Soledad', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (49, 'Malambo', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (50, 'Sabanalarga', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (51, 'Galapa', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (52, 'Puerto Colombia', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (53, 'Baranoa', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (54, 'Santo Tomás', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (55, 'Palmar de Varela', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (56, 'Sabanagrande', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (57, 'Luruaco', true, 18000, 4, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (58, 'Bogotá', true, 12000, 5, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (59, 'Cartagena', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (60, 'Magangué', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (61, 'El Carmen de Bolívar', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (62, 'Turbaco', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (63, 'Arjona', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (64, 'Mompós', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (65, 'San Juan Nepomuceno', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (66, 'San Jacinto', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (67, 'Santa Rosa del Sur', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (68, 'Achí', true, 18000, 6, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (69, 'Tunja', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (70, 'Duitama', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (71, 'Sogamoso', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (72, 'Chiquinquirá', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (73, 'Puerto Boyacá', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (74, 'Paipa', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (75, 'Moniquirá', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (76, 'Samacá', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (77, 'Nobsa', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (78, 'Villa de Leyva', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (79, 'Garagoa', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (80, 'Soatá', true, 15000, 7, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (81, 'Manizales', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (82, 'La Dorada', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (83, 'Chinchiná', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (84, 'Villamaría', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (85, 'Riosucio', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (86, 'Anserma', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (87, 'Supía', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (88, 'Salamina', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (89, 'Manzanares', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (90, 'Aguadas', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (91, 'Neira', true, 15000, 8, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (92, 'Florencia', true, 25000, 9, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (93, 'San Vicente del Caguán', true, 25000, 9, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (94, 'Cartagena del Chairá', true, 25000, 9, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (95, 'Puerto Rico', true, 25000, 9, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (96, 'El Doncello', true, 25000, 9, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (97, 'Yopal', true, 20000, 10, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (98, 'Aguazul', true, 20000, 10, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (99, 'Villanueva', true, 20000, 10, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (100, 'Paz de Ariporo', true, 20000, 10, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (101, 'Monterrey', true, 20000, 10, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (102, 'Tauramena', true, 20000, 10, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (103, 'Maní', true, 20000, 10, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (104, 'Popayán', true, 20000, 11, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (105, 'Santander de Quilichao', true, 20000, 11, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (106, 'Puerto Tejada', true, 20000, 11, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (107, 'Patía', true, 20000, 11, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (108, 'Piendamó', true, 20000, 11, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (109, 'El Tambo', true, 20000, 11, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (110, 'Miranda', true, 20000, 11, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (111, 'Corinto', true, 20000, 11, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (112, 'Caloto', true, 20000, 11, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (113, 'Valledupar', true, 20000, 12, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (114, 'Aguachica', true, 20000, 12, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (115, 'Agustín Codazzi', true, 20000, 12, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (116, 'Bosconia', true, 20000, 12, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (117, 'Curumaní', true, 20000, 12, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (118, 'El Copey', true, 20000, 12, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (119, 'La Jagua de Ibirico', true, 20000, 12, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (120, 'Chiriguaná', true, 20000, 12, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (121, 'Quibdó', true, 30000, 13, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (122, 'Istmina', true, 30000, 13, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (123, 'Tadó', true, 30000, 13, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (124, 'Condoto', true, 30000, 13, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (125, 'Riosucio', true, 30000, 13, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (126, 'Bahía Solano', true, 30000, 13, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (127, 'Montería', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (128, 'Lorica', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (129, 'Sahagún', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (130, 'Cereté', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (131, 'Montelíbano', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (132, 'Planeta Rica', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (133, 'Tierralta', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (134, 'Ciénaga de Oro', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (135, 'Chinú', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (136, 'Ayapel', true, 20000, 14, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (137, 'Soacha', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (138, 'Facatativá', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (139, 'Fusagasugá', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (140, 'Zipaquirá', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (141, 'Chía', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (142, 'Girardot', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (143, 'Mosquera', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (144, 'Madrid', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (145, 'Funza', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (146, 'Cajicá', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (147, 'Tocancipá', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (148, 'Cota', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (149, 'Sibaté', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (150, 'Villeta', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (151, 'La Mesa', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (152, 'Anapoima', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (153, 'Guaduas', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (154, 'Ubaté', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (155, 'Pacho', true, 12000, 15, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (156, 'Inírida', true, 35000, 16, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (157, 'San José del Guaviare', true, 30000, 17, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (158, 'Calamar', true, 30000, 17, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (159, 'El Retorno', true, 30000, 17, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (160, 'Miraflores', true, 30000, 17, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (161, 'Neiva', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (162, 'Pitalito', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (163, 'Garzón', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (164, 'La Plata', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (165, 'Campoalegre', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (166, 'San Agustín', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (167, 'Gigante', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (168, 'Aipe', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (169, 'Palermo', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (170, 'Rivera', true, 18000, 18, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (171, 'Riohacha', true, 22000, 19, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (172, 'Maicao', true, 22000, 19, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (173, 'Uribia', true, 22000, 19, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (174, 'Manaure', true, 22000, 19, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (175, 'Fonseca', true, 22000, 19, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (176, 'San Juan del Cesar', true, 22000, 19, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (177, 'Barrancas', true, 22000, 19, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (178, 'Santa Marta', true, 20000, 20, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (179, 'Ciénaga', true, 20000, 20, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (180, 'Zona Bananera', true, 20000, 20, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (181, 'Fundación', true, 20000, 20, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (182, 'El Banco', true, 20000, 20, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (183, 'Plato', true, 20000, 20, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (184, 'Aracataca', true, 20000, 20, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (185, 'Pivijay', true, 20000, 20, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (186, 'Villavicencio', true, 18000, 21, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (187, 'Acacías', true, 18000, 21, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (188, 'Granada', true, 18000, 21, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (189, 'Puerto López', true, 18000, 21, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (190, 'San Martín', true, 18000, 21, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (191, 'Cumaral', true, 18000, 21, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (192, 'Restrepo', true, 18000, 21, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (193, 'Puerto Gaitán', true, 18000, 21, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (194, 'Pasto', true, 22000, 22, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (195, 'Tumaco', true, 22000, 22, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (196, 'Ipiales', true, 22000, 22, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (197, 'La Unión', true, 22000, 22, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (198, 'Samaniego', true, 22000, 22, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (199, 'Túquerres', true, 22000, 22, '2025-12-15 21:24:22.9', NULL);
INSERT INTO public.city VALUES (200, 'El Charco', true, 22000, 22, '2025-12-15 21:24:22.9', NULL);


--
-- Data for Name: gender; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.gender VALUES (1, 'MASCULINO', '2026-01-20 21:01:09.276', '2026-01-20 21:01:09.276');
INSERT INTO public.gender VALUES (2, 'FEMENINO', '2026-01-20 21:01:09.276', '2026-01-20 21:01:09.276');
INSERT INTO public.gender VALUES (3, 'UNISEX', '2026-01-20 21:01:09.276', '2026-01-20 21:01:09.276');


--
-- Data for Name: type_clothing; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.type_clothing VALUES ('A ', 'Camiseta', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('B ', 'Polo', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('C ', 'Camisa', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('D ', 'Buso', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('E ', 'Chaqueta', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('F ', 'Pantalon Largo', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('G ', 'Jean', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('H ', 'Calzado', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('I ', 'Gorra', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('J ', 'Pantalon Corto', '2025-12-27 17:56:40.642', NULL);
INSERT INTO public.type_clothing VALUES ('K ', 'Vestido', '2025-12-27 17:56:40.642', NULL);


--
-- Data for Name: clothing; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.clothing VALUES ('Camiseta Estampada Espalda', '2025-11-14 02:38:59.92', 1, 'A ', '2026-02-15 20:21:44.478', 4, 1);
INSERT INTO public.clothing VALUES ('Camiseta Estampado Frente y Manga', '2025-11-14 02:39:37.683', 1, 'A ', '2026-02-15 20:21:55.413', 5, 1);
INSERT INTO public.clothing VALUES ('Camiseta Estampado Frente', '2025-11-14 02:40:24.851', 1, 'A ', '2026-02-15 20:22:11.534', 6, 1);
INSERT INTO public.clothing VALUES ('Camiseta Essentials Unisex', '2025-11-11 08:59:53.001', 1, 'A ', '2026-02-15 20:22:20.294', 1, 3);
INSERT INTO public.clothing VALUES ('Camiseta Essentials Mujer', '2025-11-11 08:59:53.001', 1, 'A ', '2026-02-15 20:22:25.644', 3, 2);
INSERT INTO public.clothing VALUES ('Crop Top Estampada Frente', '2025-11-11 08:59:53.001', 1, 'A ', '2026-02-15 20:22:39.445', 2, 2);


--
-- Data for Name: season; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.season VALUES (1, '1er Ciclo', 'Temporada de enero a marzo', '2025-12-27 17:56:40.637', NULL);
INSERT INTO public.season VALUES (2, '2do Ciclo', 'Temporada de abril a junio', '2025-12-27 17:56:40.637', NULL);
INSERT INTO public.season VALUES (3, '3er Ciclo', 'Temporada de julio a septiembre', '2025-12-27 17:56:40.637', NULL);
INSERT INTO public.season VALUES (4, '4to Ciclo', 'Temporada de octubre a diciembre', '2025-12-27 17:56:40.637', NULL);


--
-- Data for Name: year_production; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.year_production VALUES ('2025-12-27 17:56:40.635', 'Producción para el año 2025', 'Q ', 'Año 2025', NULL);
INSERT INTO public.year_production VALUES ('2025-12-27 17:56:40.635', 'Producción para el año 2026', 'R ', 'Año 2026', NULL);
INSERT INTO public.year_production VALUES ('2025-12-27 17:56:40.635', 'Producción para el año 2027', 'S ', 'Año 2027', NULL);
INSERT INTO public.year_production VALUES ('2025-12-27 17:56:40.635', 'Producción para el año 2028', 'T ', 'Año 2028', NULL);
INSERT INTO public.year_production VALUES ('2025-12-27 17:56:40.635', 'Producción para el año 2029', 'U ', 'Año 2029', NULL);
INSERT INTO public.year_production VALUES ('2025-12-27 17:56:40.635', 'Producción para el año 2030', 'V ', 'Año 2030', NULL);


--
-- Data for Name: collection; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.collection VALUES ('La Renovación del Básico', '2025-12-27 17:56:40.639', 1, NULL, 1, 'Q ', 'Colección 1 trimestre del año 2025');
INSERT INTO public.collection VALUES ('La Excelencia en la Silueta', '2025-12-27 17:56:40.639', 2, NULL, 2, 'Q ', 'Colección 2 trimestre del año 2025');
INSERT INTO public.collection VALUES ('Regreso a la Rutina', '2025-12-27 17:56:40.639', 3, NULL, 3, 'Q ', 'Colección 3 trimestre del año 2025');
INSERT INTO public.collection VALUES ('Cápsula de Fin de Año', '2025-12-27 17:56:40.639', 4, NULL, 4, 'Q ', 'Colección 4 trimestre del año 2025');
INSERT INTO public.collection VALUES ('Ropa ligera y vibrante para el verano', '2025-12-27 17:56:40.682', 5, NULL, 1, 'Q ', 'Colección Verano 2025');


--
-- Data for Name: color; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.color VALUES (1, 'Blanco', '2025-12-27 17:56:40.644', NULL, '#FFFFFF');
INSERT INTO public.color VALUES (2, 'Negro', '2025-12-27 17:56:40.644', NULL, '#000000');
INSERT INTO public.color VALUES (15, 'Chocolate', '2025-12-27 17:56:40.644', NULL, '#D2691E');
INSERT INTO public.color VALUES (16, 'Gris', '2026-02-15 23:27:30.263', '2026-02-15 23:27:30.263', '#8d8785');
INSERT INTO public.color VALUES (13, 'Café', '2025-12-27 17:56:40.644', '2026-02-16 00:06:54.119', '#6c443d');


--
-- Data for Name: design; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.design VALUES (1, 1, 4, 'Q4A11', 37000, '2025-12-28 00:10:21.976', '2026-02-15 20:24:19.556', 'La camiseta Essentials de Two Six es la base perfecta para cualquier guardarropa, ofreciendo un balance ideal entre calidad, comodidad y estilo discreto.
Fabricada con Tela Qatar, esta prenda garantiza una sensación excepcionalmente fresca y ligera, ideal para el uso diario o para actividades que requieren máximo confort. Su Classic Fit asegura una caída estándar, cómoda y favorecedora para todo tipo de cuerpo.
El diseño presenta el distintivo estampado localizado del gorila en punto corazón, ejecutado con una textura que le añade un toque premium y de profundidad. Es la pieza perfecta para llevar el espíritu de Two Six de forma sutil y auténtica.
Detalles Clave del Producto:
Fit: Classic Fit (Corte clásico, cómodo y versátil).
Tejido: Tela Qatar (Alta transpirabilidad y frescura).
Diseño: Estampado localizado de gorila con textura.
Estilo: Cuello redondo y manga corta.
Colores Disponibles: Blanco, Negro, Café y Gris', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/1/idDesign-1.png');
INSERT INTO public.design VALUES (2, 3, 4, 'Q4A12', 36900, '2025-12-29 00:23:26.405', '2026-02-15 20:30:21.67', 'Descubre la combinación perfecta de confort y actitud con la camiseta Essentials de Two Six. Pensada para tu ritmo de vida, está confeccionada en Tela Fría de alta calidad, un tejido que garantiza una sensación increíblemente fresca y ligera, ideal para mantenerte cómoda todo el día, incluso en movimiento. El diseño presenta el distintivo estampado localizado del gorila, símbolo de fuerza y autenticidad, junto con el identificador. Su silueta regular se adapta a tu figura sin ser ajustada, ofreciendo un look casual, versátil y con un inconfundible carácter urbano. Características Esenciales: Tejido: Tela Fría Premium (Máxima transpirabilidad y sensación de frescura). Diseño: Estampado localizado del Gorila en el punto corazón. Corte: Silueta Regular, cuello redondo y manga corta. Comodidad: Ideal para el uso diario, Colores Disponibles: Blanco y Negro.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/2/idDesign-2.png');
INSERT INTO public.design VALUES (3, 5, 4, 'Q4A13', 37000, '2026-02-07 19:26:16.116', '2026-02-15 18:06:06.929', 'Descubre la combinación perfecta de confort y actitud con la camiseta Essentials de Two Six. Pensada para tu ritmo de vida, está confeccionada en Tela Fría de alta calidad, un tejido que garantiza una sensación increíblemente fresca y ligera, ideal para mantenerte cómoda todo el día, incluso en movimiento.
El diseño presenta el distintivo estampado localizado del gorila, símbolo de fuerza y autenticidad, junto con el identificador. Su silueta regular se adapta a tu figura sin ser ajustada, ofreciendo un look casual, versátil y con un inconfundible carácter urbano.
Características Esenciales:
Tejido: Tela Fría Premium (Máxima transpirabilidad y sensación de frescura).
Diseño: Estampado localizado del Gorila en el punto corazón.
Corte: Silueta Regular, cuello redondo y manga corta.
Comodidad: Ideal para el uso diario, 
Colores Disponibles: Blanco y Negro.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/3/idDesign-3.png');
INSERT INTO public.design VALUES (4, 4, 4, 'Q4A14', 36333, '2026-02-15 21:26:16.287', '2026-02-15 21:26:43.441', 'Diseñada para quienes valoran la comodidad sin sacrificar la actitud, esta prenda ofrece un Fit Oversize de tendencia, dándote máxima libertad de movimiento y una silueta relajada. Está confeccionada en Tela Qatar, conocida por su ligereza, caída perfecta y tacto suave, ideal para usarla en cualquier temporada.
El diseño se centra en un estampado frontal llamativo con el logo TWO SIX y el mensaje "crafted for real ones". El toque de exclusividad lo da el escudo bordado en la manga izquierda, un detalle sutil que marca la diferencia.
Características Esenciales:
Fit: Oversize (Corte amplio y relajado).
Tejido: Tela Qatar (Frescura, ligereza y excelente caída).
Diseño Principal: Estampado central TWO SIX en el frente.
Detalle Premium: Escudo de la marca bordado en la manga.
Estilo: Manga corta y cuello redondo.
Color: Negro.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/4/idDesign-4.png');
INSERT INTO public.design VALUES (5, 2, 4, 'Q4A15', 36333, '2026-02-15 21:29:08.488', '2026-02-15 21:29:56.116', 'Esta camiseta de Two Six está diseñada para seguirte el paso, combinando la actitud inconfundible del streetwear con la tecnología de alto rendimiento. No es solo cool por el diseño; ¡es literalmente fresca!
El diseño presenta el skyline imponente de la metrópolis con un vibe retro y el mensaje que lo dice todo: "CRAFTED FOR REAL ONES". Una declaración para aquellos que se mueven con autenticidad y que valoran tanto el estilo como la comodidad funcional.
Características Exclusivas Two Six:
Tecnología de Tela Fría: Confeccionada con un tejido especial que ofrece una sensación refrescante al tacto y ayuda a regular la temperatura. Ideal para los días calurosos, el movimiento constante o simplemente para mantenerte cómodo y seco.
Ajuste y Comodidad: El tejido de alta calidad es ligero, transpirable y suave, garantizando un ajuste cómodo sin sacrificar la durabilidad que esperas de Two Six.
Diseño Gráfico Classic Premium: Estampado con una silueta urbana y tonos que resaltan, con el mensaje CRAFTED FOR REAL ONES – Símbolo de autenticidad y esfuerzo.
Color Versátil: Negro, un color base elegante que realza el estampado y combina perfectamente con cualquier outfit urbano.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/5/idDesign-5.png');
INSERT INTO public.design VALUES (6, 6, 4, 'Q4A16', 33342, '2026-02-15 23:18:03.971', '2026-02-15 23:18:50.043', 'La autenticidad reside en lo esencial. Esta camiseta de hombre de Two Six es la base perfecta para cualquier atuendo, diseñada para quienes aprecian la calidad y el detalle sutil.
Fabricada en Tela Qatar, te ofrece una experiencia de uso sumamente fresca y ligera, ideal para climas cálidos o para tu rutina activa. El icónico logo Two Six se presenta de forma elegante en punto corazón.
Detalles de la Prenda:
Tejido: Tela Qatar (Máxima comodidad y transpirabilidad).
Estilo: Minimalista con logo de marca discreto en punto corazón.
Carácter Urbano: Tipografía  en la espalda para un toque de carácter.
Ajuste: Cuello redondo y manga corta.
Colores: Negro y Blanco.', 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/Design/6/idDesign-6.png');


--
-- Data for Name: clothing_color; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.clothing_color VALUES (5, 2, 1, '2026-01-25 18:13:36.143', '2026-01-25 18:13:36.143');
INSERT INTO public.clothing_color VALUES (6, 1, 1, '2026-01-25 18:44:47.149', '2026-01-25 18:44:47.149');
INSERT INTO public.clothing_color VALUES (7, 1, 2, '2026-02-07 17:03:06.449', '2026-02-07 17:03:06.449');
INSERT INTO public.clothing_color VALUES (8, 2, 2, '2026-02-07 17:06:58.34', '2026-02-07 17:06:58.34');
INSERT INTO public.clothing_color VALUES (9, 2, 3, '2026-02-07 19:28:09.643', '2026-02-07 19:28:09.643');
INSERT INTO public.clothing_color VALUES (10, 2, 4, '2026-02-15 23:22:41.161', '2026-02-15 23:22:41.161');
INSERT INTO public.clothing_color VALUES (11, 1, 4, '2026-02-15 23:23:39.003', '2026-02-15 23:23:39.003');
INSERT INTO public.clothing_color VALUES (12, 2, 5, '2026-02-15 23:24:48.879', '2026-02-15 23:24:48.879');
INSERT INTO public.clothing_color VALUES (13, 1, 5, '2026-02-15 23:25:09.138', '2026-02-15 23:25:09.138');
INSERT INTO public.clothing_color VALUES (14, 13, 5, '2026-02-15 23:25:40.723', '2026-02-15 23:25:40.723');
INSERT INTO public.clothing_color VALUES (15, 16, 5, '2026-02-15 23:27:59.466', '2026-02-15 23:27:59.466');
INSERT INTO public.clothing_color VALUES (16, 13, 1, '2026-02-15 23:28:47.75', '2026-02-15 23:28:47.75');
INSERT INTO public.clothing_color VALUES (17, 16, 1, '2026-02-15 23:29:18.67', '2026-02-15 23:29:18.67');
INSERT INTO public.clothing_color VALUES (18, 2, 6, '2026-02-15 23:44:23.667', '2026-02-15 23:44:23.667');


--
-- Data for Name: size; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.size VALUES (1, 'XS', 'Extra Pequeña', '2025-12-27 17:56:40.646', NULL);
INSERT INTO public.size VALUES (2, 'S', 'Pequeña', '2025-12-27 17:56:40.646', NULL);
INSERT INTO public.size VALUES (3, 'M', 'Mediana', '2025-12-27 17:56:40.646', NULL);
INSERT INTO public.size VALUES (4, 'L', 'Grande', '2025-12-27 17:56:40.646', NULL);
INSERT INTO public.size VALUES (5, 'XL', 'Extra Grande', '2025-12-27 17:56:40.646', NULL);
INSERT INTO public.size VALUES (6, 'U', 'Único', '2025-12-27 17:56:40.646', NULL);


--
-- Data for Name: clothing_size; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.clothing_size VALUES (19, 4, 5, 18, 18, 0, 0, 0, '2026-01-25 18:13:36.143', '2026-01-25 18:13:36.143', NULL);
INSERT INTO public.clothing_size VALUES (20, 5, 5, 9, 9, 0, 0, 0, '2026-01-25 18:13:36.143', '2026-01-25 18:13:36.143', NULL);
INSERT INTO public.clothing_size VALUES (21, 2, 6, 5, 5, 0, 0, 0, '2026-01-25 18:44:47.149', '2026-01-25 18:44:47.149', NULL);
INSERT INTO public.clothing_size VALUES (22, 3, 6, 16, 16, 0, 0, 0, '2026-01-25 18:44:47.149', '2026-01-25 18:44:47.149', NULL);
INSERT INTO public.clothing_size VALUES (23, 4, 6, 18, 18, 0, 0, 0, '2026-01-25 18:44:47.149', '2026-01-25 18:44:47.149', NULL);
INSERT INTO public.clothing_size VALUES (24, 5, 6, 9, 9, 0, 0, 0, '2026-01-25 18:44:47.149', '2026-01-25 18:44:47.149', NULL);
INSERT INTO public.clothing_size VALUES (26, 2, 7, 18, 18, 0, 0, 0, '2026-02-07 17:03:06.449', '2026-02-07 17:03:06.449', NULL);
INSERT INTO public.clothing_size VALUES (27, 3, 7, 16, 16, 0, 0, 0, '2026-02-07 17:03:06.449', '2026-02-07 17:03:06.449', NULL);
INSERT INTO public.clothing_size VALUES (28, 4, 7, 6, 6, 0, 0, 0, '2026-02-07 17:03:06.449', '2026-02-07 17:03:06.449', NULL);
INSERT INTO public.clothing_size VALUES (29, 1, 8, 8, 8, 0, 0, 0, '2026-02-07 17:06:58.34', '2026-02-07 17:06:58.34', NULL);
INSERT INTO public.clothing_size VALUES (31, 3, 8, 16, 16, 0, 0, 0, '2026-02-07 17:06:58.34', '2026-02-07 17:06:58.34', NULL);
INSERT INTO public.clothing_size VALUES (32, 4, 8, 6, 6, 0, 0, 0, '2026-02-07 17:06:58.34', '2026-02-07 17:06:58.34', NULL);
INSERT INTO public.clothing_size VALUES (34, 3, 9, 16, 16, 0, 0, 0, '2026-02-07 19:28:09.643', '2026-02-07 19:28:09.643', NULL);
INSERT INTO public.clothing_size VALUES (35, 4, 9, 18, 18, 0, 0, 0, '2026-02-07 19:28:09.643', '2026-02-07 19:28:09.643', NULL);
INSERT INTO public.clothing_size VALUES (37, 2, 10, 5, 5, 0, 0, 0, '2026-02-15 23:22:41.161', '2026-02-15 23:22:41.161', NULL);
INSERT INTO public.clothing_size VALUES (38, 3, 10, 16, 16, 0, 0, 0, '2026-02-15 23:22:41.161', '2026-02-15 23:22:41.161', NULL);
INSERT INTO public.clothing_size VALUES (39, 4, 10, 18, 18, 0, 0, 0, '2026-02-15 23:22:41.161', '2026-02-15 23:22:41.161', NULL);
INSERT INTO public.clothing_size VALUES (41, 2, 11, 5, 5, 0, 0, 0, '2026-02-15 23:23:39.003', '2026-02-15 23:23:39.003', NULL);
INSERT INTO public.clothing_size VALUES (42, 3, 11, 16, 16, 0, 0, 0, '2026-02-15 23:23:39.003', '2026-02-15 23:23:39.003', NULL);
INSERT INTO public.clothing_size VALUES (43, 4, 11, 18, 18, 0, 0, 0, '2026-02-15 23:23:39.003', '2026-02-15 23:23:39.003', NULL);
INSERT INTO public.clothing_size VALUES (44, 5, 11, 9, 9, 0, 0, 0, '2026-02-15 23:23:39.003', '2026-02-15 23:23:39.003', NULL);
INSERT INTO public.clothing_size VALUES (45, 6, 12, 25, 25, 0, 0, 0, '2026-02-15 23:24:48.879', '2026-02-15 23:24:48.879', NULL);
INSERT INTO public.clothing_size VALUES (46, 6, 13, 25, 25, 0, 0, 0, '2026-02-15 23:25:09.138', '2026-02-15 23:25:09.138', NULL);
INSERT INTO public.clothing_size VALUES (49, 2, 16, 5, 5, 0, 0, 0, '2026-02-15 23:28:47.75', '2026-02-15 23:28:47.75', NULL);
INSERT INTO public.clothing_size VALUES (51, 4, 16, 18, 18, 0, 0, 0, '2026-02-15 23:28:47.75', '2026-02-15 23:28:47.75', NULL);
INSERT INTO public.clothing_size VALUES (53, 2, 17, 5, 5, 0, 0, 0, '2026-02-15 23:29:18.67', '2026-02-15 23:29:18.67', NULL);
INSERT INTO public.clothing_size VALUES (54, 3, 17, 16, 16, 0, 0, 0, '2026-02-15 23:29:18.67', '2026-02-15 23:29:18.67', NULL);
INSERT INTO public.clothing_size VALUES (56, 5, 17, 9, 9, 0, 0, 0, '2026-02-15 23:29:18.67', '2026-02-15 23:29:18.67', NULL);
INSERT INTO public.clothing_size VALUES (57, 2, 18, 5, 5, 0, 0, 0, '2026-02-15 23:44:23.667', '2026-02-15 23:44:23.667', NULL);
INSERT INTO public.clothing_size VALUES (58, 3, 18, 16, 16, 0, 0, 0, '2026-02-15 23:44:23.667', '2026-02-15 23:44:23.667', NULL);
INSERT INTO public.clothing_size VALUES (59, 4, 18, 18, 18, 0, 0, 0, '2026-02-15 23:44:23.667', '2026-02-15 23:44:23.667', NULL);
INSERT INTO public.clothing_size VALUES (60, 5, 18, 9, 9, 0, 0, 0, '2026-02-15 23:44:23.667', '2026-02-15 23:44:23.667', NULL);
INSERT INTO public.clothing_size VALUES (47, 6, 14, 25, 24, 1, 0, 0, '2026-02-15 23:25:40.723', '2026-02-27 15:55:38.717', NULL);
INSERT INTO public.clothing_size VALUES (30, 2, 8, 18, 17, 1, 0, 0, '2026-02-07 17:06:58.34', '2026-02-27 15:55:38.717', NULL);
INSERT INTO public.clothing_size VALUES (40, 5, 10, 9, 8, 1, 0, 0, '2026-02-15 23:22:41.161', '2026-02-27 17:18:06.988', NULL);
INSERT INTO public.clothing_size VALUES (18, 3, 5, 16, 15, 1, 0, 0, '2026-01-25 18:13:36.143', '2026-02-27 17:22:29.078', NULL);
INSERT INTO public.clothing_size VALUES (50, 3, 16, 16, 15, 1, 0, 0, '2026-02-15 23:28:47.75', '2026-02-27 17:42:32.174', NULL);
INSERT INTO public.clothing_size VALUES (48, 6, 15, 25, 23, 2, 0, 0, '2026-02-15 23:27:59.466', '2026-02-27 17:42:32.174', NULL);
INSERT INTO public.clothing_size VALUES (52, 5, 16, 9, 7, 2, 0, 0, '2026-02-15 23:28:47.75', '2026-02-27 17:50:55.039', NULL);
INSERT INTO public.clothing_size VALUES (17, 2, 5, 5, 4, 1, 0, 0, '2026-01-25 18:13:36.143', '2026-02-27 17:57:45.472', NULL);
INSERT INTO public.clothing_size VALUES (55, 4, 17, 18, 15, 3, 0, 0, '2026-02-15 23:29:18.67', '2026-02-27 22:58:45.824', NULL);
INSERT INTO public.clothing_size VALUES (36, 5, 9, 9, 6, 3, 0, 0, '2026-02-07 19:28:09.643', '2026-02-27 22:58:45.824', NULL);
INSERT INTO public.clothing_size VALUES (33, 2, 9, 5, 4, 1, 0, 0, '2026-02-07 19:28:09.643', '2026-03-04 00:15:33.505', NULL);
INSERT INTO public.clothing_size VALUES (25, 1, 7, 8, 7, 1, 0, 0, '2026-02-07 17:03:06.449', '2026-03-04 02:35:00.295', NULL);


--
-- Data for Name: production_type; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--



--
-- Data for Name: provider; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.provider VALUES ('900123456-7', 'contacto@textilescol.com', '123-456789-0', 'Ahorros', 'Bancolombia', 'Textiles de Colombia S.A.S', '2025-12-27 17:56:40.634', '6015551234', NULL);
INSERT INTO public.provider VALUES ('800987654-3', 'ventas@dismod.com', '987-654321-1', 'Corriente', 'Davivienda', 'Diseños Modernos Ltda', '2025-12-27 17:56:40.634', '6045559876', NULL);
INSERT INTO public.provider VALUES ('901234567-8', 'contacto@confeccionesvalle.com', '456-789012-3', 'Corriente', 'Banco de Bogotá', 'Confecciones del Valle', '2025-12-27 17:56:40.681', '6025551122', NULL);


--
-- Data for Name: design_provider; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--



--
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public."order" VALUES (1, 1, '2024-05-10 10:30:00', 'Entregado', true, 'Calle 100 # 20-30, Bogotá', '2025-12-27 17:56:40.673', NULL, 39881, '2024-05-10 10:32:00', 10000, 219900);
INSERT INTO public."order" VALUES (2, 3, '2026-02-27 14:52:58.317', 'Pendiente', false, 'Cr 50 # 24 - 51, Itagüí, Antioquia', '2026-02-27 14:52:58.295', '2026-02-27 14:52:58.295', 15181, '2026-02-27 14:52:58.317', 15000, 94900);
INSERT INTO public."order" VALUES (3, 3, '2026-02-27 15:18:30.021', 'Pendiente', false, 'cr 50 # 24 - 51, Itagüí, Antioquia', '2026-02-27 15:18:30.005', '2026-02-27 15:18:30.005', 30362, '2026-02-27 15:18:30.021', 15000, 174800);
INSERT INTO public."order" VALUES (4, 3, '2026-02-27 15:55:38.732', 'Pendiente', false, 'cr 50 #24 - 51, Itagüí, Antioquia', '2026-02-27 15:55:38.717', '2026-02-27 15:55:38.717', 28462, '2026-02-27 15:55:38.732', 15000, 164800);
INSERT INTO public."order" VALUES (5, 3, '2026-02-27 17:18:07.006', 'Pendiente', false, 'Cr 50 #24-51, Itagüí, Antioquia', '2026-02-27 17:18:06.988', '2026-02-27 17:18:06.988', 30362, '2026-02-27 17:18:07.006', 15000, 174800);
INSERT INTO public."order" VALUES (6, 4, '2026-02-27 17:22:29.126', 'Pendiente', false, 'Calle 123, Arauca, Arauca', '2026-02-27 17:22:29.078', '2026-02-27 17:22:29.078', 15181, '2026-02-27 17:22:29.126', 25000, 104900);
INSERT INTO public."order" VALUES (7, 3, '2026-02-27 17:42:32.196', 'Pagado', true, 'cr 50 # 24 - 51, Itagüí, Antioquia', '2026-02-27 17:42:32.174', '2026-02-27 17:43:27.818', 30362, '2026-02-27 17:42:32.196', 15000, 174800);
INSERT INTO public."order" VALUES (8, 3, '2026-02-27 17:50:55.163', 'Pendiente', false, 'cr 23 c 434 2, Itagüí, Antioquia', '2026-02-27 17:50:55.039', '2026-02-27 17:50:55.039', 15181, '2026-02-27 17:50:55.163', 15000, 94900);
INSERT INTO public."order" VALUES (9, 4, '2026-02-27 17:57:45.715', 'Pendiente', false, 'Calle 123, Leticia, Amazonas', '2026-02-27 17:57:45.472', '2026-02-27 17:57:45.472', 15181, '2026-02-27 17:57:45.715', 35000, 114900);
INSERT INTO public."order" VALUES (10, 3, '2026-02-27 18:01:38.423', 'Pendiente', false, 'cr 50, Itagüí, Antioquia', '2026-02-27 18:01:38.396', '2026-02-27 18:01:38.396', 30362, '2026-02-27 18:01:38.423', 15000, 174800);
INSERT INTO public."order" VALUES (11, 5, '2026-02-27 22:58:45.859', 'Pendiente', false, 'cl 76 45 09, Andes, Antioquia', '2026-02-27 22:58:45.824', '2026-02-27 22:58:45.824', 30362, '2026-02-27 22:58:45.859', 15000, 174800);
INSERT INTO public."order" VALUES (12, 6, '2026-03-04 00:15:33.531', 'Pagado', true, 'Cr 50 A # 24 - 51, Itagüí, Antioquia', '2026-03-04 00:15:33.505', '2026-03-04 00:22:24.149', 15181, '2026-03-04 00:15:33.531', 15000, 94900);
INSERT INTO public."order" VALUES (13, 7, '2026-03-04 02:35:00.325', 'Pagado', true, 'Cr 50 A # 24 - 51, Apto 514., Itagüí, Antioquia', '2026-03-04 02:35:00.295', '2026-03-04 02:36:00.855', 13281, '2026-03-04 02:35:00.325', 15000, 84900);


--
-- Data for Name: dian_e_invoicing; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--



--
-- Data for Name: image_clothing; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.image_clothing VALUES (62, 16, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1771198491360.png', 1, '2026-02-15 23:34:51.489', '2026-02-16 00:08:35.93');
INSERT INTO public.image_clothing VALUES (41, 5, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/negro/masculino/q4a11-negro-masculino-1771179302409.png', 1, '2026-02-15 18:15:02.76', '2026-03-03 01:55:44.587');
INSERT INTO public.image_clothing VALUES (64, 16, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1771198491614.png', 3, '2026-02-15 23:34:51.838', '2026-02-16 00:08:44.437');
INSERT INTO public.image_clothing VALUES (61, 16, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1771198491183.png', 4, '2026-02-15 23:34:51.356', '2026-02-16 00:08:44.437');
INSERT INTO public.image_clothing VALUES (63, 16, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1771198491494.png', 5, '2026-02-15 23:34:51.609', '2026-02-16 00:08:44.437');
INSERT INTO public.image_clothing VALUES (42, 5, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/negro/masculino/q4a11-negro-masculino-1771179302762.png', 2, '2026-02-15 18:15:02.989', '2026-03-03 01:55:44.587');
INSERT INTO public.image_clothing VALUES (40, 5, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/negro/masculino/q4a11-negro-masculino-1771179285249.png', 3, '2026-02-15 18:14:45.503', '2026-03-03 01:55:44.587');
INSERT INTO public.image_clothing VALUES (47, 5, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/negro/unisex/q4a11-negro-unisex-1771188605048.png', 4, '2026-02-15 20:50:07.179', '2026-03-03 01:55:44.587');
INSERT INTO public.image_clothing VALUES (49, 6, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/blanco/unisex/q4a11-blanco-unisex-1771188766015.png', 4, '2026-02-15 20:52:46.18', '2026-02-15 20:52:51.177');
INSERT INTO public.image_clothing VALUES (48, 6, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/blanco/unisex/q4a11-blanco-unisex-1771188702793.png', 3, '2026-02-15 20:51:42.991', '2026-02-15 20:52:04.917');
INSERT INTO public.image_clothing VALUES (45, 6, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/blanco/masculino/q4a11-blanco-masculino-1771180298639.png', 1, '2026-02-15 18:31:38.77', '2026-02-15 20:51:46.309');
INSERT INTO public.image_clothing VALUES (46, 6, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/blanco/masculino/q4a11-blanco-masculino-1771180298773.png', 2, '2026-02-15 18:31:38.906', '2026-02-15 20:51:46.309');
INSERT INTO public.image_clothing VALUES (50, 7, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a12/blanco/femenino/q4a12-blanco-femenino-1771188854811.png', 1, '2026-02-15 20:54:14.982', '2026-02-15 20:54:29.688');
INSERT INTO public.image_clothing VALUES (52, 7, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a12/blanco/femenino/q4a12-blanco-femenino-1771188855103.png', 2, '2026-02-15 20:54:15.235', '2026-02-15 20:54:29.688');
INSERT INTO public.image_clothing VALUES (54, 7, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a12/blanco/femenino/q4a12-blanco-femenino-1771188855356.png', 3, '2026-02-15 20:54:15.6', '2026-02-15 20:54:29.688');
INSERT INTO public.image_clothing VALUES (51, 7, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a12/blanco/femenino/q4a12-blanco-femenino-1771188854986.png', 4, '2026-02-15 20:54:15.1', '2026-02-15 20:54:29.688');
INSERT INTO public.image_clothing VALUES (53, 7, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a12/blanco/femenino/q4a12-blanco-femenino-1771188855240.png', 5, '2026-02-15 20:54:15.35', '2026-02-15 20:54:29.688');
INSERT INTO public.image_clothing VALUES (59, 8, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a12/negro/femenino/q4a12-negro-femenino-1771190447257.png', 2, '2026-02-15 21:20:47.441', '2026-02-15 21:21:11.395');
INSERT INTO public.image_clothing VALUES (56, 8, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a12/negro/femenino/q4a12-negro-femenino-1771190446808.png', 3, '2026-02-15 21:20:46.975', '2026-02-15 21:21:11.395');
INSERT INTO public.image_clothing VALUES (34, 9, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/masculino/q4a13-negro-masculino-1771179061947.png', 1, '2026-02-15 18:11:02.136', '2026-02-15 21:22:27.563');
INSERT INTO public.image_clothing VALUES (35, 9, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/masculino/q4a13-negro-masculino-1771179062139.png', 2, '2026-02-15 18:11:02.281', '2026-02-15 21:22:27.563');
INSERT INTO public.image_clothing VALUES (38, 9, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/masculino/q4a13-negro-masculino-1771179095577.png', 3, '2026-02-15 18:11:36.142', '2026-02-15 21:22:27.563');
INSERT INTO public.image_clothing VALUES (55, 8, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a12/negro/femenino/q4a12-negro-femenino-1771190446401.png', 1, '2026-02-15 21:20:46.799', '2026-02-15 21:21:07.069');
INSERT INTO public.image_clothing VALUES (36, 9, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/masculino/q4a13-negro-masculino-1771179080093.png', 4, '2026-02-15 18:11:20.224', '2026-02-15 21:22:27.563');
INSERT INTO public.image_clothing VALUES (58, 8, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a12/negro/femenino/q4a12-negro-femenino-1771190447149.png', 4, '2026-02-15 21:20:47.251', '2026-02-15 21:21:11.395');
INSERT INTO public.image_clothing VALUES (37, 9, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a13/negro/masculino/q4a13-negro-masculino-1771179080227.png', 5, '2026-02-15 18:11:20.37', '2026-02-15 21:22:27.563');
INSERT INTO public.image_clothing VALUES (67, 17, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1771198538161.png', 1, '2026-02-15 23:35:38.285', '2026-02-16 00:09:52.302');
INSERT INTO public.image_clothing VALUES (69, 17, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1771198538416.png', 3, '2026-02-15 23:35:38.612', '2026-02-16 00:09:52.302');
INSERT INTO public.image_clothing VALUES (66, 17, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1771198538039.png', 4, '2026-02-15 23:35:38.158', '2026-02-16 00:09:52.302');
INSERT INTO public.image_clothing VALUES (68, 17, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1771198538289.png', 5, '2026-02-15 23:35:38.41', '2026-02-16 00:09:52.302');
INSERT INTO public.image_clothing VALUES (75, 11, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/blanco/masculino/q4a14-blanco-masculino-1771198697944.png', 1, '2026-02-15 23:38:18.474', '2026-02-15 23:38:24.716');
INSERT INTO public.image_clothing VALUES (77, 11, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/blanco/masculino/q4a14-blanco-masculino-1771198698642.png', 2, '2026-02-15 23:38:18.76', '2026-02-15 23:38:24.716');
INSERT INTO public.image_clothing VALUES (79, 11, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/blanco/masculino/q4a14-blanco-masculino-1771198698887.png', 3, '2026-02-15 23:38:19.099', '2026-02-15 23:38:24.716');
INSERT INTO public.image_clothing VALUES (78, 11, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/blanco/masculino/q4a14-blanco-masculino-1771198698766.png', 4, '2026-02-15 23:38:18.881', '2026-02-15 23:38:24.716');
INSERT INTO public.image_clothing VALUES (70, 10, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1771198587780.png', 1, '2026-02-15 23:36:27.945', '2026-02-15 23:36:43.034');
INSERT INTO public.image_clothing VALUES (76, 11, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/blanco/masculino/q4a14-blanco-masculino-1771198698479.png', 5, '2026-02-15 23:38:18.639', '2026-02-15 23:38:24.716');
INSERT INTO public.image_clothing VALUES (81, 12, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/negro/femenino/q4a15-negro-femenino-1771198744350.png', 4, '2026-02-15 23:39:04.478', '2026-02-15 23:39:41.781');
INSERT INTO public.image_clothing VALUES (72, 10, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1771198588070.png', 2, '2026-02-15 23:36:28.191', '2026-02-15 23:36:43.034');
INSERT INTO public.image_clothing VALUES (74, 10, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1771198588311.png', 3, '2026-02-15 23:36:28.528', '2026-02-15 23:36:43.034');
INSERT INTO public.image_clothing VALUES (73, 10, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1771198588195.png', 4, '2026-02-15 23:36:28.306', '2026-02-15 23:36:43.034');
INSERT INTO public.image_clothing VALUES (71, 10, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a14/negro/masculino/q4a14-negro-masculino-1771198587949.png', 5, '2026-02-15 23:36:28.066', '2026-02-15 23:36:43.034');
INSERT INTO public.image_clothing VALUES (84, 13, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/blanco/femenino/q4a15-blanco-femenino-1771198822716.png', 1, '2026-02-15 23:40:23.202', '2026-02-15 23:40:23.202');
INSERT INTO public.image_clothing VALUES (85, 13, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/blanco/femenino/q4a15-blanco-femenino-1771198823205.png', 2, '2026-02-15 23:40:23.405', '2026-02-15 23:40:23.405');
INSERT INTO public.image_clothing VALUES (86, 13, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/blanco/femenino/q4a15-blanco-femenino-1771198823409.png', 3, '2026-02-15 23:40:23.568', '2026-02-15 23:40:23.568');
INSERT INTO public.image_clothing VALUES (87, 14, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/cafe/femenino/q4a15-cafe-femenino-1771198876144.png', 1, '2026-02-15 23:41:16.326', '2026-02-15 23:41:16.326');
INSERT INTO public.image_clothing VALUES (88, 14, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/cafe/femenino/q4a15-cafe-femenino-1771198876330.png', 2, '2026-02-15 23:41:16.532', '2026-02-15 23:41:16.532');
INSERT INTO public.image_clothing VALUES (89, 14, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/cafe/femenino/q4a15-cafe-femenino-1771198876535.png', 3, '2026-02-15 23:41:16.7', '2026-02-15 23:41:16.7');
INSERT INTO public.image_clothing VALUES (90, 15, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/gris/femenino/q4a15-gris-femenino-1771198913675.png', 1, '2026-02-15 23:41:53.854', '2026-02-15 23:41:53.854');
INSERT INTO public.image_clothing VALUES (80, 12, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/negro/femenino/q4a15-negro-femenino-1771198744205.png', 1, '2026-02-15 23:39:04.344', '2026-02-15 23:39:41.781');
INSERT INTO public.image_clothing VALUES (83, 12, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/negro/femenino/q4a15-negro-femenino-1771198744684.png', 2, '2026-02-15 23:39:04.869', '2026-02-15 23:39:41.781');
INSERT INTO public.image_clothing VALUES (82, 12, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/negro/femenino/q4a15-negro-femenino-1771198744480.png', 3, '2026-02-15 23:39:04.679', '2026-02-15 23:39:41.781');
INSERT INTO public.image_clothing VALUES (91, 15, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/gris/femenino/q4a15-gris-femenino-1771198913858.png', 2, '2026-02-15 23:41:54.142', '2026-02-15 23:41:54.142');
INSERT INTO public.image_clothing VALUES (92, 15, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a15/gris/femenino/q4a15-gris-femenino-1771198914146.png', 3, '2026-02-15 23:41:54.311', '2026-02-15 23:41:54.311');
INSERT INTO public.image_clothing VALUES (96, 18, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1771199079512.png', 1, '2026-02-15 23:44:39.639', '2026-02-15 23:45:04.893');
INSERT INTO public.image_clothing VALUES (94, 18, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1771199079222.png', 2, '2026-02-15 23:44:39.385', '2026-02-15 23:45:04.893');
INSERT INTO public.image_clothing VALUES (98, 18, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1771199079756.png', 3, '2026-02-15 23:44:39.937', '2026-02-15 23:45:04.893');
INSERT INTO public.image_clothing VALUES (95, 18, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1771199079389.png', 4, '2026-02-15 23:44:39.507', '2026-02-15 23:45:04.893');
INSERT INTO public.image_clothing VALUES (97, 18, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a16/negro/masculino/q4a16-negro-masculino-1771199079645.png', 5, '2026-02-15 23:44:39.75', '2026-02-15 23:45:04.893');
INSERT INTO public.image_clothing VALUES (99, 16, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/cafe/unisex/q4a11-cafe-unisex-1771200512374.png', 2, '2026-02-16 00:08:32.98', '2026-02-16 00:08:44.437');
INSERT INTO public.image_clothing VALUES (100, 17, 'https://twosix-catalog-storage.atl1.digitaloceanspaces.com/DLLO/ropa-parte-superior/coleccion-4-trimestre-del-ano-2025/q4a11/gris/unisex/q4a11-gris-unisex-1771200548968.png', 2, '2026-02-16 00:09:09.168', '2026-02-16 00:09:52.302');


--
-- Data for Name: log_error; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.log_error VALUES (1, 'field?.toLowerCase is not a function', 'TypeError: field?.toLowerCase is not a function
    at http://localhost:5176/src/pages/ProductPage.jsx:60:27
    at Array.some (<anonymous>)
    at http://localhost:5176/src/pages/ProductPage.jsx:59:29
    at Array.filter (<anonymous>)
    at http://localhost:5176/src/pages/ProductPage.jsx:43:21
    at updateMemo (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=0561b407:6545:21)
    at Object.useMemo (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=0561b407:18969:20)
    at exports.useMemo (http://localhost:5176/node_modules/.vite/deps/chunk-YX2XZWS3.js?v=638bb606:947:36)
    at ProductPage (http://localhost:5176/src/pages/ProductPage.jsx:39:28)
    at Object.react_stack_bottom_frame (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=0561b407:18509:20)', NULL, 'cms', '/product', '2025-12-29 00:29:57.742', '2025-12-29 00:29:57.742');
INSERT INTO public.log_error VALUES (2, 'Internal server error', 'Error: Internal server error
    at handleResponse (http://localhost:5173/src/services/clothingApi.js:12:13)
    at async handleSave (http://localhost:5173/src/pages/ClothingPage.jsx:45:9)', NULL, 'cms', '/clothing', '2026-01-24 19:09:04.025', '2026-01-24 19:09:04.025');
INSERT INTO public.log_error VALUES (3, 'genderApi.getGenders is not a function', 'TypeError: genderApi.getGenders is not a function
    at http://localhost:5175/src/pages/ClothingColorPage.jsx?t=1769359537182:32:21
    at http://localhost:5175/src/pages/ClothingColorPage.jsx?t=1769359537182:48:5
    at Object.react_stack_bottom_frame (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:18567:20)
    at runWithFiberInDEV (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:997:72)
    at commitHookEffectListMount (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:9411:163)
    at commitHookPassiveMountEffects (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:9465:60)
    at commitPassiveMountOnFiber (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:11040:29)
    at recursivelyTraversePassiveMountEffects (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:11010:13)
    at commitPassiveMountOnFiber (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:11201:13)
    at recursivelyTraversePassiveMountEffects (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:11010:13)', NULL, 'cms', '/clothing-color', '2026-01-25 16:45:37.302', '2026-01-25 16:45:37.302');
INSERT INTO public.log_error VALUES (4, 'ImageClothingPage is not defined', 'ReferenceError: ImageClothingPage is not defined
    at MainLayout (http://localhost:5175/src/App.jsx?t=1769359573388:208:100)
    at Object.react_stack_bottom_frame (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:18509:20)
    at renderWithHooks (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:5654:24)
    at updateFunctionComponent (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:7475:21)
    at beginWork (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:8525:20)
    at runWithFiberInDEV (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:997:72)
    at performUnitOfWork (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:12561:98)
    at workLoopSync (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:12424:43)
    at renderRootSync (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:12408:13)
    at performWorkOnRoot (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:11827:37)', NULL, 'cms', '/clothing-color', '2026-01-25 16:46:13.5', '2026-01-25 16:46:13.5');
INSERT INTO public.log_error VALUES (5, 'genderApi.getGenders is not a function', 'TypeError: genderApi.getGenders is not a function
    at http://localhost:5175/src/pages/ClothingColorPage.jsx?t=1769359537182:32:21
    at http://localhost:5175/src/pages/ClothingColorPage.jsx?t=1769359537182:48:5
    at Object.react_stack_bottom_frame (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:18567:20)
    at runWithFiberInDEV (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:997:72)
    at commitHookEffectListMount (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:9411:163)
    at commitHookPassiveMountEffects (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:9465:60)
    at commitPassiveMountOnFiber (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:11040:29)
    at recursivelyTraversePassiveMountEffects (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:11010:13)
    at commitPassiveMountOnFiber (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:11201:13)
    at recursivelyTraversePassiveMountEffects (http://localhost:5175/node_modules/.vite/deps/react-dom_client.js?v=5c4de787:11010:13)', NULL, 'cms', '/clothing-color', '2026-01-25 16:46:19.572', '2026-01-25 16:46:19.572');
INSERT INTO public.log_error VALUES (7, 'genderApi.getGenders is not a function', 'TypeError: genderApi.getGenders is not a function
    at http://localhost:5176/src/pages/ClothingColorPage.jsx:32:21
    at http://localhost:5176/src/pages/ClothingColorPage.jsx:48:5
    at Object.react_stack_bottom_frame (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:18567:20)
    at runWithFiberInDEV (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:997:72)
    at commitHookEffectListMount (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:9411:163)
    at commitHookPassiveMountEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:9465:60)
    at commitPassiveMountOnFiber (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11040:29)
    at recursivelyTraversePassiveMountEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11010:13)
    at commitPassiveMountOnFiber (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11201:13)
    at recursivelyTraversePassiveMountEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11010:13)', NULL, 'cms', '/clothing-color', '2026-01-25 16:57:24.296', '2026-01-25 16:57:24.296');
INSERT INTO public.log_error VALUES (6, 'genderApi.getGenders is not a function', 'TypeError: genderApi.getGenders is not a function
    at http://localhost:5176/src/pages/ClothingColorPage.jsx:32:21
    at http://localhost:5176/src/pages/ClothingColorPage.jsx:48:5
    at Object.react_stack_bottom_frame (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:18567:20)
    at runWithFiberInDEV (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:997:72)
    at commitHookEffectListMount (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:9411:163)
    at commitHookPassiveMountEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:9465:60)
    at reconnectPassiveEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11273:13)
    at doubleInvokeEffectsOnFiber (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:13339:135)
    at runWithFiberInDEV (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:997:72)
    at recursivelyTraverseAndDoubleInvokeEffectsInDEV (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:13312:78)', NULL, 'cms', '/clothing-color', '2026-01-25 16:57:24.296', '2026-01-25 16:57:24.296');
INSERT INTO public.log_error VALUES (17, 'Internal server error', 'Error: Internal server error
    at handleResponse (http://localhost:5173/src/services/apiUtils.js:15:19)
    at async Promise.all (index 0)
    at async fetchData (http://localhost:5173/src/pages/MasterDesignPage.jsx:21:61)', NULL, 'cms', 'App: cms | Api: master-design', '2026-02-15 18:06:31.53', '2026-02-15 18:06:31.53');
INSERT INTO public.log_error VALUES (8, 'genderApi.getGenders is not a function', 'TypeError: genderApi.getGenders is not a function
    at http://localhost:5176/src/pages/ClothingColorPage.jsx:32:21
    at http://localhost:5176/src/pages/ClothingColorPage.jsx:48:5
    at Object.react_stack_bottom_frame (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:18567:20)
    at runWithFiberInDEV (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:997:72)
    at commitHookEffectListMount (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:9411:163)
    at commitHookPassiveMountEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:9465:60)
    at commitPassiveMountOnFiber (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11040:29)
    at recursivelyTraversePassiveMountEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11010:13)
    at commitPassiveMountOnFiber (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11201:13)
    at recursivelyTraversePassiveMountEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11010:13)', NULL, 'cms', '/clothing-color', '2026-01-25 16:58:20.966', '2026-01-25 16:58:20.966');
INSERT INTO public.log_error VALUES (9, 'genderApi.getGenders is not a function', 'TypeError: genderApi.getGenders is not a function
    at http://localhost:5176/src/pages/ClothingColorPage.jsx:32:21
    at http://localhost:5176/src/pages/ClothingColorPage.jsx:48:5
    at Object.react_stack_bottom_frame (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:18567:20)
    at runWithFiberInDEV (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:997:72)
    at commitHookEffectListMount (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:9411:163)
    at commitHookPassiveMountEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:9465:60)
    at reconnectPassiveEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11273:13)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11240:11)
    at reconnectPassiveEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11317:13)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=4b40addf:11240:11)', NULL, 'cms', '/clothing-color', '2026-01-25 16:58:20.966', '2026-01-25 16:58:20.966');
INSERT INTO public.log_error VALUES (10, 'Failed to fetch sizes', 'Error: Failed to fetch sizes
    at Module.getSizes (http://localhost:5181/src/services/sizeApi.js:7:11)
    at async Promise.all (index 3)
    at async http://localhost:5181/src/pages/ClothingColorPage.jsx:26:76', NULL, 'cms', '/clothing-color', '2026-01-25 18:02:31.616', '2026-01-25 18:02:31.616');
INSERT INTO public.log_error VALUES (11, 'useParams is not defined', 'ReferenceError: useParams is not defined
    at ImageClothingPage (http://localhost:5182/src/pages/ImageClothingPage.jsx:6:18)
    at Object.react_stack_bottom_frame (http://localhost:5182/node_modules/.vite/deps/react-dom_client.js?v=d552a71f:18509:20)
    at renderWithHooks (http://localhost:5182/node_modules/.vite/deps/react-dom_client.js?v=d552a71f:5654:24)
    at updateFunctionComponent (http://localhost:5182/node_modules/.vite/deps/react-dom_client.js?v=d552a71f:7475:21)
    at beginWork (http://localhost:5182/node_modules/.vite/deps/react-dom_client.js?v=d552a71f:8525:20)
    at runWithFiberInDEV (http://localhost:5182/node_modules/.vite/deps/react-dom_client.js?v=d552a71f:997:72)
    at performUnitOfWork (http://localhost:5182/node_modules/.vite/deps/react-dom_client.js?v=d552a71f:12561:98)
    at workLoopSync (http://localhost:5182/node_modules/.vite/deps/react-dom_client.js?v=d552a71f:12424:43)
    at renderRootSync (http://localhost:5182/node_modules/.vite/deps/react-dom_client.js?v=d552a71f:12408:13)
    at performWorkOnRoot (http://localhost:5182/node_modules/.vite/deps/react-dom_client.js?v=d552a71f:11827:37)', NULL, 'cms', '/image-clothing/4', '2026-01-25 18:08:10.759', '2026-01-25 18:08:10.759');
INSERT INTO public.log_error VALUES (12, 'setIdGender is not defined', 'ReferenceError: setIdGender is not defined
    at http://localhost:5183/src/components/clothing-color/ClothingColorForm.jsx:52:7
    at Object.react_stack_bottom_frame (http://localhost:5183/node_modules/.vite/deps/react-dom_client.js?v=a7cd4a3a:18567:20)
    at runWithFiberInDEV (http://localhost:5183/node_modules/.vite/deps/react-dom_client.js?v=a7cd4a3a:997:72)
    at commitHookEffectListMount (http://localhost:5183/node_modules/.vite/deps/react-dom_client.js?v=a7cd4a3a:9411:163)
    at commitHookPassiveMountEffects (http://localhost:5183/node_modules/.vite/deps/react-dom_client.js?v=a7cd4a3a:9465:60)
    at commitPassiveMountOnFiber (http://localhost:5183/node_modules/.vite/deps/react-dom_client.js?v=a7cd4a3a:11040:29)
    at recursivelyTraversePassiveMountEffects (http://localhost:5183/node_modules/.vite/deps/react-dom_client.js?v=a7cd4a3a:11010:13)
    at commitPassiveMountOnFiber (http://localhost:5183/node_modules/.vite/deps/react-dom_client.js?v=a7cd4a3a:11201:13)
    at recursivelyTraversePassiveMountEffects (http://localhost:5183/node_modules/.vite/deps/react-dom_client.js?v=a7cd4a3a:11010:13)
    at commitPassiveMountOnFiber (http://localhost:5183/node_modules/.vite/deps/react-dom_client.js?v=a7cd4a3a:11201:13)', NULL, 'cms', '/clothing-color', '2026-01-25 18:10:24.05', '2026-01-25 18:10:24.05');
INSERT INTO public.log_error VALUES (13, 'clothingColorApi.getClothingColor is not a function', 'TypeError: clothingColorApi.getClothingColor is not a function
    at http://localhost:5184/src/pages/ImageClothingPage.jsx:22:43
    at http://localhost:5184/src/pages/ImageClothingPage.jsx:60:7
    at Object.react_stack_bottom_frame (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:18567:20)
    at runWithFiberInDEV (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:997:72)
    at commitHookEffectListMount (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:9411:163)
    at commitHookPassiveMountEffects (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:9465:60)
    at reconnectPassiveEffects (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:11273:13)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:11240:11)
    at reconnectPassiveEffects (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:11317:13)
    at recursivelyTraverseReconnectPassiveEffects (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:11240:11)', NULL, 'cms', 'image-clothing-fetch-details', '2026-01-25 18:13:39.551', '2026-01-25 18:13:39.551');
INSERT INTO public.log_error VALUES (14, 'clothingColorApi.getClothingColor is not a function', 'TypeError: clothingColorApi.getClothingColor is not a function
    at http://localhost:5184/src/pages/ImageClothingPage.jsx:22:43
    at http://localhost:5184/src/pages/ImageClothingPage.jsx:60:7
    at Object.react_stack_bottom_frame (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:18567:20)
    at runWithFiberInDEV (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:997:72)
    at commitHookEffectListMount (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:9411:163)
    at commitHookPassiveMountEffects (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:9465:60)
    at commitPassiveMountOnFiber (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:11040:29)
    at recursivelyTraversePassiveMountEffects (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:11010:13)
    at commitPassiveMountOnFiber (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:11201:13)
    at recursivelyTraversePassiveMountEffects (http://localhost:5184/node_modules/.vite/deps/react-dom_client.js?v=3ed2473b:11010:13)', NULL, 'cms', 'image-clothing-fetch-details', '2026-01-25 18:13:39.551', '2026-01-25 18:13:39.551');
INSERT INTO public.log_error VALUES (16, 'id_collection must be an integer number,id_clothing must be an integer number,manufactured_cost must be a number conforming to the specified constraints', 'Error: id_collection must be an integer number,id_clothing must be an integer number,manufactured_cost must be a number conforming to the specified constraints
    at handleResponse (http://localhost:5175/src/services/apiUtils.js:15:19)
    at async handleSave (http://localhost:5175/src/pages/MasterDesignPage.jsx:42:9)', NULL, 'cms', 'App: cms | Api: master-design', '2026-02-03 02:11:18.026', '2026-02-03 02:11:18.026');
INSERT INTO public.log_error VALUES (18, 'Internal server error', 'Error: Internal server error
    at handleResponse (http://localhost:5173/src/services/apiUtils.js:15:19)
    at async Promise.all (index 0)
    at async fetchData (http://localhost:5173/src/pages/MasterDesignPage.jsx:21:61)', NULL, 'cms', '/master-design', '2026-02-15 18:06:31.532', '2026-02-15 18:06:31.532');
INSERT INTO public.log_error VALUES (20, 'Validation failed (numeric string is expected)', 'Error: Validation failed (numeric string is expected)
    at handleResponse (/Users/jmanrique/Documents/apps/two-six-cms/src/services/orderApi.ts:9:15)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at fetchOrder (/Users/jmanrique/Documents/apps/two-six-cms/src/pages/OrderDetailPage.tsx:20:26)', NULL, 'cms', '/order/undefined', '2026-03-01 15:55:52.42', '2026-03-01 15:55:52.42');
INSERT INTO public.log_error VALUES (19, 'Objects are not valid as a React child (found: object with keys {id, name, createdAt, updatedAt}). If you meant to render a collection of children, use an array instead.', 'Error: Objects are not valid as a React child (found: object with keys {id, name, createdAt, updatedAt}). If you meant to render a collection of children, use an array instead.
    at throwOnInvalidObjectTypeImpl (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:4598:15)
    at throwOnInvalidObjectType (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:4606:13)
    at createChild (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:4784:13)
    at reconcileChildrenArray (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:4965:26)
    at reconcileChildFibersImpl (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:5171:88)
    at http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:5237:35
    at reconcileChildren (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:7182:53)
    at beginWork (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:8701:104)
    at runWithFiberInDEV (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:997:72)
    at performUnitOfWork (http://localhost:5176/node_modules/.vite/deps/react-dom_client.js?v=7148cfd4:12561:98)', NULL, 'cms', '/clothing-color', '2026-02-15 20:30:53.85', '2026-02-15 20:30:53.85');
INSERT INTO public.log_error VALUES (15, 'id_collection must be an integer number,id_clothing must be an integer number,manufactured_cost must be a number conforming to the specified constraints', 'Error: id_collection must be an integer number,id_clothing must be an integer number,manufactured_cost must be a number conforming to the specified constraints
    at handleResponse (http://localhost:5175/src/services/apiUtils.js:15:19)
    at async handleSave (http://localhost:5175/src/pages/MasterDesignPage.jsx:42:9)', NULL, 'cms', '/master-design', '2026-02-03 02:11:18.029', '2026-02-03 02:11:18.029');


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.product VALUES (15, 79900, true, '2026-01-28 23:56:01.684', '2026-01-28 23:56:01.684', false, 'Q4A11-NEG-M', 0, 0, 18);
INSERT INTO public.product VALUES (16, 79900, true, '2026-01-28 23:56:01.684', '2026-01-28 23:56:01.684', false, 'Q4A11-NEG-L', 0, 0, 19);
INSERT INTO public.product VALUES (13, 79900, true, '2026-01-28 23:56:01.685', '2026-01-28 23:56:01.685', false, 'Q4A11-NEG-XL', 0, 0, 20);
INSERT INTO public.product VALUES (14, 79900, true, '2026-01-28 23:56:01.684', '2026-01-28 23:56:01.684', false, 'Q4A11-NEG-S', 0, 0, 17);
INSERT INTO public.product VALUES (17, 79900, true, '2026-01-28 23:56:36.699', '2026-01-28 23:56:36.699', false, 'Q4A11-BLA-M', 0, 0, 22);
INSERT INTO public.product VALUES (18, 79900, true, '2026-01-28 23:56:36.699', '2026-01-28 23:56:36.699', false, 'Q4A11-BLA-S', 0, 0, 21);
INSERT INTO public.product VALUES (19, 79900, true, '2026-01-28 23:56:36.701', '2026-01-28 23:56:36.701', false, 'Q4A11-BLA-L', 0, 0, 23);
INSERT INTO public.product VALUES (20, 79900, true, '2026-01-28 23:56:36.702', '2026-01-28 23:56:36.702', false, 'Q4A11-BLA-XL', 0, 0, 24);
INSERT INTO public.product VALUES (28, 69900, true, '2026-02-07 17:11:39.448', '2026-02-07 17:10:14.106', false, 'Q4A12-NEG-S', 0, 0, 30);
INSERT INTO public.product VALUES (27, 69900, true, '2026-02-07 17:11:56.215', '2026-02-07 17:10:14.105', false, 'Q4A12-NEG-XS', 0, 0, 29);
INSERT INTO public.product VALUES (26, 69900, true, '2026-02-07 17:12:11.18', '2026-02-07 17:10:14.093', false, 'Q4A12-NEG-L', 0, 0, 32);
INSERT INTO public.product VALUES (25, 69900, true, '2026-02-07 17:18:15.866', '2026-02-07 17:10:14.088', false, 'Q4A12-BLA-L', 0, 0, 28);
INSERT INTO public.product VALUES (22, 69900, true, '2026-02-07 17:24:04.614', '2026-02-07 17:10:14.076', false, 'Q4A12-BLA-M', 0, 0, 27);
INSERT INTO public.product VALUES (23, 69900, true, '2026-02-07 17:24:18.736', '2026-02-07 17:10:14.077', false, 'Q4A12-NEG-M', 0, 0, 31);
INSERT INTO public.product VALUES (21, 69900, true, '2026-02-07 17:24:31.935', '2026-02-07 17:10:14.074', false, 'Q4A12-BLA-S', 0, 0, 26);
INSERT INTO public.product VALUES (24, 69900, true, '2026-02-07 17:25:57.827', '2026-02-07 17:10:14.074', false, 'Q4A12-BLA-XS', 0, 0, 25);
INSERT INTO public.product VALUES (32, 79900, true, '2026-02-07 19:30:52.97', '2026-02-07 19:30:52.97', false, 'Q4A13-NEG-S', 0, 0, 33);
INSERT INTO public.product VALUES (29, 79900, true, '2026-02-07 19:30:52.974', '2026-02-07 19:30:52.974', false, 'Q4A13-NEG-XL', 0, 0, 36);
INSERT INTO public.product VALUES (30, 79900, true, '2026-02-07 19:30:52.973', '2026-02-07 19:30:52.973', false, 'Q4A13-NEG-L', 0, 0, 35);
INSERT INTO public.product VALUES (31, 79900, true, '2026-02-07 19:30:52.97', '2026-02-07 19:30:52.97', false, 'Q4A13-NEG-M', 0, 0, 34);
INSERT INTO public.product VALUES (34, 79900, true, '2026-02-15 23:47:49.206', '2026-02-15 23:47:49.206', false, 'Q4A11-CAF-M', 0, 0, 50);
INSERT INTO public.product VALUES (33, 79900, true, '2026-02-15 23:47:49.206', '2026-02-15 23:47:49.206', false, 'Q4A11-CAF-L', 0, 0, 51);
INSERT INTO public.product VALUES (36, 79900, true, '2026-02-15 23:47:49.206', '2026-02-15 23:47:49.206', false, 'Q4A11-CAF-XL', 0, 0, 52);
INSERT INTO public.product VALUES (35, 79900, true, '2026-02-15 23:47:49.205', '2026-02-15 23:47:49.205', false, 'Q4A11-CAF-S', 0, 0, 49);
INSERT INTO public.product VALUES (37, 79900, true, '2026-02-15 23:48:42.441', '2026-02-15 23:48:42.441', false, 'Q4A11-GRI-S', 0, 0, 53);
INSERT INTO public.product VALUES (38, 79900, true, '2026-02-15 23:48:42.441', '2026-02-15 23:48:42.441', false, 'Q4A11-GRI-M', 0, 0, 54);
INSERT INTO public.product VALUES (39, 79900, true, '2026-02-15 23:48:42.443', '2026-02-15 23:48:42.443', false, 'Q4A11-GRI-L', 0, 0, 55);
INSERT INTO public.product VALUES (40, 79900, true, '2026-02-15 23:48:42.444', '2026-02-15 23:48:42.444', false, 'Q4A11-GRI-XL', 0, 0, 56);
INSERT INTO public.product VALUES (41, 79900, true, '2026-02-15 23:49:26.185', '2026-02-15 23:49:26.185', false, 'Q4A14-NEG-M', 0, 0, 38);
INSERT INTO public.product VALUES (42, 79900, true, '2026-02-15 23:49:26.186', '2026-02-15 23:49:26.186', false, 'Q4A14-NEG-L', 0, 0, 39);
INSERT INTO public.product VALUES (43, 79900, true, '2026-02-15 23:49:26.185', '2026-02-15 23:49:26.185', false, 'Q4A14-NEG-S', 0, 0, 37);
INSERT INTO public.product VALUES (44, 79900, true, '2026-02-15 23:49:26.186', '2026-02-15 23:49:26.186', false, 'Q4A14-NEG-XL', 0, 0, 40);
INSERT INTO public.product VALUES (45, 79900, true, '2026-02-15 23:50:05.114', '2026-02-15 23:50:05.114', false, 'Q4A14-BLA-M', 0, 0, 42);
INSERT INTO public.product VALUES (46, 79900, true, '2026-02-15 23:50:05.114', '2026-02-15 23:50:05.114', false, 'Q4A14-BLA-L', 0, 0, 43);
INSERT INTO public.product VALUES (47, 79900, true, '2026-02-15 23:50:05.114', '2026-02-15 23:50:05.114', false, 'Q4A14-BLA-S', 0, 0, 41);
INSERT INTO public.product VALUES (48, 79900, true, '2026-02-15 23:50:05.114', '2026-02-15 23:50:05.114', false, 'Q4A14-BLA-XL', 0, 0, 44);
INSERT INTO public.product VALUES (49, 69900, true, '2026-02-15 23:51:07.505', '2026-02-15 23:51:07.505', false, 'Q4A16-NEG-M', 0, 0, 58);
INSERT INTO public.product VALUES (50, 69900, true, '2026-02-15 23:51:07.505', '2026-02-15 23:51:07.505', false, 'Q4A16-NEG-S', 0, 0, 57);
INSERT INTO public.product VALUES (51, 69900, true, '2026-02-15 23:51:07.505', '2026-02-15 23:51:07.505', false, 'Q4A16-NEG-L', 0, 0, 59);
INSERT INTO public.product VALUES (52, 69900, true, '2026-02-15 23:51:07.506', '2026-02-15 23:51:07.506', false, 'Q4A16-NEG-XL', 0, 0, 60);
INSERT INTO public.product VALUES (53, 79900, true, '2026-02-15 23:59:15.106', '2026-02-15 23:59:15.106', false, 'Q4A15-NEG-U', 0, 0, 45);
INSERT INTO public.product VALUES (54, 79900, true, '2026-02-15 23:59:15.12', '2026-02-15 23:59:15.12', false, 'Q4A15-GRI-U', 0, 0, 48);
INSERT INTO public.product VALUES (55, 79900, true, '2026-02-15 23:59:15.12', '2026-02-15 23:59:15.12', false, 'Q4A15-CAF-U', 0, 0, 47);
INSERT INTO public.product VALUES (56, 79900, true, '2026-02-15 23:59:15.121', '2026-02-15 23:59:15.121', false, 'Q4A15-BLA-U', 0, 0, 46);


--
-- Data for Name: order_item; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.order_item VALUES (3, 2, 36, 'Camiseta Essentials Unisex', 'XL', 'Café', 1, 79900, '2026-02-27 14:52:58.295', '2026-02-27 14:52:58.295', 15181);
INSERT INTO public.order_item VALUES (4, 3, 39, 'Camiseta Essentials Unisex', 'L', 'Gris', 1, 79900, '2026-02-27 15:18:30.005', '2026-02-27 15:18:30.005', 15181);
INSERT INTO public.order_item VALUES (5, 3, 29, 'Camiseta Estampado Frente y Manga', 'XL', 'Negro', 1, 79900, '2026-02-27 15:18:30.005', '2026-02-27 15:18:30.005', 15181);
INSERT INTO public.order_item VALUES (6, 4, 55, 'Crop Top Estampada Frente', 'U', 'Café', 1, 79900, '2026-02-27 15:55:38.717', '2026-02-27 15:55:38.717', 15181);
INSERT INTO public.order_item VALUES (7, 4, 28, 'Camiseta Essentials Mujer', 'S', 'Negro', 1, 69900, '2026-02-27 15:55:38.717', '2026-02-27 15:55:38.717', 13281);
INSERT INTO public.order_item VALUES (8, 5, 54, 'Crop Top Estampada Frente', 'U', 'Gris', 1, 79900, '2026-02-27 17:18:06.988', '2026-02-27 17:18:06.988', 15181);
INSERT INTO public.order_item VALUES (9, 5, 44, 'Camiseta Estampada Espalda', 'XL', 'Negro', 1, 79900, '2026-02-27 17:18:06.988', '2026-02-27 17:18:06.988', 15181);
INSERT INTO public.order_item VALUES (10, 6, 15, 'Camiseta Essentials Unisex', 'M', 'Negro', 1, 79900, '2026-02-27 17:22:29.078', '2026-02-27 17:22:29.078', 15181);
INSERT INTO public.order_item VALUES (11, 7, 34, 'Camiseta Essentials Unisex', 'M', 'Café', 1, 79900, '2026-02-27 17:42:32.174', '2026-02-27 17:42:32.174', 15181);
INSERT INTO public.order_item VALUES (12, 7, 54, 'Crop Top Estampada Frente', 'U', 'Gris', 1, 79900, '2026-02-27 17:42:32.174', '2026-02-27 17:42:32.174', 15181);
INSERT INTO public.order_item VALUES (13, 8, 36, 'Camiseta Essentials Unisex', 'XL', 'Café', 1, 79900, '2026-02-27 17:50:55.039', '2026-02-27 17:50:55.039', 15181);
INSERT INTO public.order_item VALUES (14, 9, 14, 'Camiseta Essentials Unisex', 'S', 'Negro', 1, 79900, '2026-02-27 17:57:45.472', '2026-02-27 17:57:45.472', 15181);
INSERT INTO public.order_item VALUES (15, 10, 39, 'Camiseta Essentials Unisex', 'L', 'Gris', 1, 79900, '2026-02-27 18:01:38.396', '2026-02-27 18:01:38.396', 15181);
INSERT INTO public.order_item VALUES (16, 10, 29, 'Camiseta Estampado Frente y Manga', 'XL', 'Negro', 1, 79900, '2026-02-27 18:01:38.396', '2026-02-27 18:01:38.396', 15181);
INSERT INTO public.order_item VALUES (17, 11, 39, 'Camiseta Essentials Unisex', 'L', 'Gris', 1, 79900, '2026-02-27 22:58:45.824', '2026-02-27 22:58:45.824', 15181);
INSERT INTO public.order_item VALUES (18, 11, 29, 'Camiseta Estampado Frente y Manga', 'XL', 'Negro', 1, 79900, '2026-02-27 22:58:45.824', '2026-02-27 22:58:45.824', 15181);
INSERT INTO public.order_item VALUES (19, 12, 32, 'Camiseta Estampado Frente y Manga', 'S', 'Negro', 1, 79900, '2026-03-04 00:15:33.505', '2026-03-04 00:15:33.505', 15181);
INSERT INTO public.order_item VALUES (20, 13, 24, 'Camiseta Essentials Mujer', 'XS', 'Blanco', 1, 69900, '2026-03-04 02:35:00.295', '2026-03-04 02:35:00.295', 13281);


--
-- Data for Name: payment_method; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.payment_method VALUES (1, 'Tarjeta de Crédito', true, '2025-12-27 17:56:40.676', NULL);
INSERT INTO public.payment_method VALUES (2, 'PSE', true, '2025-12-27 17:56:40.676', NULL);
INSERT INTO public.payment_method VALUES (3, 'Efectivo', false, '2025-12-27 17:56:40.676', NULL);
INSERT INTO public.payment_method VALUES (4, 'Wompi', true, '2026-02-27 17:43:27.83', '2026-02-27 17:43:27.83');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.payments VALUES (1, 1, 1, 1, 'Aprobado', '2024-05-10 10:32:00', 'TXN123ABC456', 249781, '2025-12-27 17:56:40.677', NULL);
INSERT INTO public.payments VALUES (2, 7, 3, 4, 'APPROVED', '2026-02-27 17:43:25.079', 'ORDER-7-1772214152214', 174800, '2026-02-27 17:43:27.832', '2026-02-27 17:43:27.832');
INSERT INTO public.payments VALUES (3, 12, 6, 4, 'APPROVED', '2026-03-04 00:22:21.085', 'ORDER-12-1772583333550', 94900, '2026-03-04 00:22:24.164', '2026-03-04 00:22:24.164');
INSERT INTO public.payments VALUES (4, 13, 7, 4, 'APPROVED', '2026-03-04 02:35:55.382', 'ORDER-13-1772591700345', 84900, '2026-03-04 02:36:00.872', '2026-03-04 02:36:00.872');


--
-- Data for Name: pqr; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.pqr VALUES (1, 'T6-2026-001', 'Juan perez', '98777676', 'jmanriquejh@hotmail.com', '', 'Queja', 'Queja de prueba...', 'Abierto', '2026-03-06 04:50:18.63', '2026-03-06 04:50:18.63', false, NULL);
INSERT INTO public.pqr VALUES (2, 'T6-2026-002', 'Sandra Mesa', '676766776', 'jmanriquejh@hotmail.com', '', 'Petición', 'Peticion de prueba', 'Abierto', '2026-03-06 05:25:25.786', '2026-03-06 05:25:25.786', false, NULL);
INSERT INTO public.pqr VALUES (3, 'T6-2026-003', 'Vanessa Lopez', '43333444', 'jmanriquejh@hotmail.com', '', 'Reclamo', 'Reclamo de sugerencia', 'Abierto', '2026-03-06 05:26:18.602', '2026-03-06 05:26:18.602', false, NULL);
INSERT INTO public.pqr VALUES (4, 'T6-2026-004', 'Lina Valle', '7677777', 'jmanriquejh@hotmail.com', '', 'Sugerencia', 'Sugerencia de prueba', 'Abierto', '2026-03-06 05:27:30.489', '2026-03-06 05:27:30.489', false, NULL);


--
-- Data for Name: pqr_image; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--



--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--



--
-- Data for Name: return_item; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--



--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.role VALUES ('Admin', '2025-12-27 17:56:40.628', 'Administrador con todos los permisos', 1, NULL);
INSERT INTO public.role VALUES ('Manager', '2025-12-27 17:56:40.628', 'Gerente de tienda', 2, NULL);
INSERT INTO public.role VALUES ('Sales', '2025-12-27 17:56:40.628', 'Vendedor', 3, NULL);
INSERT INTO public.role VALUES ('Shipping', '2025-12-27 17:56:40.628', 'Encargado de envio de productos', 4, NULL);
INSERT INTO public.role VALUES ('Counter', '2025-12-27 17:56:40.628', 'Rol para contador de la empresa', 5, NULL);
INSERT INTO public.role VALUES ('Reader', '2025-12-27 17:56:40.628', 'Rol de solo consultas', 6, NULL);


--
-- Data for Name: shipping_provider; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.shipping_provider VALUES (1, 'Servientrega', 'https://www.servientrega.com/wps/portal/rastreo-envio/!ut/p/z1/04.../?guia=', true, '2025-12-27 17:56:40.678', NULL);
INSERT INTO public.shipping_provider VALUES (2, 'Interrapidísimo', 'https://www.interrapidisimo.com/sigue-tu-envio/?guia=', true, '2025-12-27 17:56:40.678', NULL);


--
-- Data for Name: shipment; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.shipment VALUES (1, 1, 1, '1234567890', 'Entregado', '2024-05-13 00:00:00', '2024-05-12 15:00:00', NULL, '2025-12-27 17:56:40.679', NULL);


--
-- Data for Name: shipment_rate; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--



--
-- Data for Name: subscriber; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.subscriber VALUES (2, 'jmanriquejh@hotmail.com', '2026-03-04 00:58:03.106', true, false);
INSERT INTO public.subscriber VALUES (1, 'test@example.com', '2026-03-04 00:51:30.097', false, true);


--
-- Data for Name: tracking_history; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.tracking_history VALUES (1, 1, 'En centro de distribución', '2024-05-11 08:00:00', 'Bogotá, Colombia', 'BOG-CEDI', '2025-12-27 17:56:40.68', NULL);
INSERT INTO public.tracking_history VALUES (2, 1, 'En reparto', '2024-05-12 09:00:00', 'Bogotá, Colombia', 'BOG-REP', '2025-12-27 17:56:40.68', NULL);
INSERT INTO public.tracking_history VALUES (3, 1, 'Entregado', '2024-05-12 15:00:00', 'Bogotá, Colombia', 'ENTREGADO-OK', '2025-12-27 17:56:40.68', NULL);


--
-- Data for Name: user_app; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.user_app VALUES ('vbuitrago', 'Vanessa Buitrago', '2025-12-27 17:56:40.629', 'vanebuitragop6@gmail.com', 2, NULL, '21526059', '$2b$10$z1x2c3v4b5n6m7l8k9j0hOg9f8d7s6a5s4d3f2g1h2j3k4l5m6n', NULL, NULL);
INSERT INTO public.user_app VALUES ('jmanrique', 'Jorge Manrique', '2025-12-27 17:56:40.629', 'jamanrique@gmail.com', 1, '2026-03-02 05:00:01.885', '3101234567', '$2b$10$f9a8s7d6f5g4h3j2k1l0iOu9n8b7v6c5d4f3g2h1j0k9l8m7n6b5v', NULL, NULL);
INSERT INTO public.user_app VALUES ('twosix', 'Two Six', '2025-12-27 17:56:40.629', 'twosixmarca@gmail.com', 3, '2026-03-06 15:22:33.644', '3101234567', '$2b$10$f9a8s7d6f5g4h3j2k1l0iOu9n8b7v6c5d4f3g2h1j0k9l8m7n6b5v', '$2b$10$LRrm85A/snk2KXnYYsa03u2evlyMmkrnxKeOchuQnSZDEKc74Qfb6', '2026-03-06 15:32:33.499');


--
-- Data for Name: user_role; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

INSERT INTO public.user_role VALUES ('2025-12-27 17:56:40.631', 1, 1, 1, NULL);
INSERT INTO public.user_role VALUES ('2025-12-27 17:56:40.631', 2, 2, 2, NULL);


--
-- Name: address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.address_id_seq', 1, false);


--
-- Name: category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.category_id_seq', 6, true);


--
-- Name: city_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.city_id_seq', 1, false);


--
-- Name: clothing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.clothing_id_seq', 9, true);


--
-- Name: clothing_size_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.clothing_size_id_seq', 60, true);


--
-- Name: collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.collection_id_seq', 5, true);


--
-- Name: color_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.color_id_seq', 16, true);


--
-- Name: customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.customer_id_seq', 8, true);


--
-- Name: customer_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.customer_type_id_seq', 2, true);


--
-- Name: department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.department_id_seq', 1, false);


--
-- Name: design_clothing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.design_clothing_id_seq', 18, true);


--
-- Name: design_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.design_id_seq', 6, true);


--
-- Name: design_provider_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.design_provider_id_seq', 1, false);


--
-- Name: dian_e_invoicing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.dian_e_invoicing_id_seq', 1, false);


--
-- Name: gender_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.gender_id_seq', 3, true);


--
-- Name: identification_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.identification_type_id_seq', 5, true);


--
-- Name: image_clothing_id_image_clothing_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.image_clothing_id_image_clothing_seq', 101, true);


--
-- Name: log_error_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.log_error_id_seq', 20, true);


--
-- Name: order_id_order_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.order_id_order_seq', 13, true);


--
-- Name: order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.order_item_id_seq', 20, true);


--
-- Name: payment_method_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.payment_method_id_seq', 4, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.payments_id_seq', 4, true);


--
-- Name: pqr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.pqr_id_seq', 4, true);


--
-- Name: pqr_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.pqr_image_id_seq', 1, false);


--
-- Name: product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.product_id_seq', 56, true);


--
-- Name: production_type_id_production_type_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.production_type_id_production_type_seq', 1, false);


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

SELECT pg_catalog.setval('public.role_id_role_seq', 6, true);


--
-- Name: season_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.season_id_seq', 4, true);


--
-- Name: shipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.shipment_id_seq', 1, true);


--
-- Name: shipment_rate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.shipment_rate_id_seq', 1, false);


--
-- Name: shipping_provider_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.shipping_provider_id_seq', 2, true);


--
-- Name: size_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.size_id_seq', 6, true);


--
-- Name: subscriber_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.subscriber_id_seq', 2, true);


--
-- Name: tracking_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.tracking_history_id_seq', 3, true);


--
-- Name: user_app_id_user_app_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.user_app_id_user_app_seq', 2, true);


--
-- Name: user_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.user_role_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--

\unrestrict UpXTGjcIKwdTw1KIKcElI3Zr8xHtLvUw7cMAguoOtkBoJyojHvofRJQBsK4FNga

