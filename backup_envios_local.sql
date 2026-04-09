--
-- PostgreSQL database dump
--

\restrict 1EmtarECknIikaRE7ahURZQ6hvb0buv6sbW1qPVCIOq17aXk9YBJfuPuikAhaOq

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
-- Data for Name: city; Type: TABLE DATA; Schema: public; Owner: jmanmrique
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.city DISABLE TRIGGER ALL;



ALTER TABLE public.city ENABLE TRIGGER ALL;

--
-- Name: city_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jmanmrique
--

SELECT pg_catalog.setval('public.city_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict 1EmtarECknIikaRE7ahURZQ6hvb0buv6sbW1qPVCIOq17aXk9YBJfuPuikAhaOq

