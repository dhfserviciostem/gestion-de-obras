-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: construction_management
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `assigned_to` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `estimated_hours` decimal(8,2) DEFAULT NULL,
  `actual_hours` decimal(8,2) DEFAULT '0.00',
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `progress_percentage` decimal(5,2) DEFAULT '0.00',
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `dependencies` text,
  `materials_needed` text,
  `equipment_needed` text,
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_activities_project` (`project_id`),
  KEY `idx_activities_assigned` (`assigned_to`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activities_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `activities_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,1,'Excavación y movimiento de tierras','Preparación del terreno y excavación para cimentaciones',4,'2024-01-15','2024-02-15',240.00,220.00,'completed',100.00,'high','[]','Combustible para maquinaria','Excavadoras, camiones','Completado según cronograma',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(2,1,'Cimentación y estructura','Construcción de cimientos y estructura de hormigón armado',4,'2024-02-16','2024-04-30',480.00,350.00,'completed',100.00,'critical','[1]','Hormigón, ferralla, encofrados','Grúa torre, hormigonera','Estructura completada con éxito',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(3,1,'Albañilería y cerramientos','Construcción de muros, tabiques y cerramientos exteriores',6,'2024-05-01','2024-07-15',360.00,280.00,'completed',100.00,'high','[2]','Ladrillo, mortero, aislamiento','Andamios, herramientas manuales','Fase completada',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(4,1,'Instalaciones eléctricas','Instalación de cableado eléctrico y cuadros de distribución',4,'2024-06-01','2024-08-15',200.00,180.00,'completed',100.00,'medium','[3]','Cable eléctrico, tubos, cuadros','Herramientas eléctricas','Instalación según normativa',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(5,1,'Instalaciones de fontanería','Instalación de tuberías de agua y saneamiento',6,'2024-06-15','2024-08-30',180.00,160.00,'completed',100.00,'medium','[3]','Tuberías PVC, grifería, sanitarios','Herramientas fontanería','Pruebas de presión OK',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(6,1,'Acabados interiores','Alicatados, pavimentos y pintura interior',4,'2024-08-01','2024-10-15',320.00,250.00,'in_progress',78.00,'medium','[4,5]','Azulejos, pavimento, pintura','Herramientas acabados','En progreso según planificación',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(7,1,'Jardines y zonas comunes','Ajardinamiento y construcción de zonas comunes',6,'2024-09-01','2024-11-30',160.00,45.00,'in_progress',28.00,'low','[6]','Plantas, césped, mobiliario urbano','Herramientas jardinería','Pendiente finalización acabados',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(8,2,'Demolición y preparación','Demolición de estructuras existentes y preparación del solar',7,'2024-03-01','2024-04-15',200.00,180.00,'completed',100.00,'high','[]','Combustible, contenedores','Excavadoras, martillos neumáticos','Demolición completada',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(9,2,'Estructura principal','Construcción de la estructura principal del hotel',7,'2024-04-16','2024-08-30',600.00,420.00,'in_progress',70.00,'critical','[8]','Hormigón, acero estructural','Grúas torre, bombas hormigón','Avance según cronograma',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(10,2,'Fachadas y cerramientos','Construcción de fachadas y cerramientos exteriores',7,'2024-07-01','2024-11-15',400.00,180.00,'in_progress',45.00,'high','[9]','Paneles fachada, cristal, sellantes','Andamios, herramientas fachada','Iniciado en planta baja',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(11,2,'Instalaciones generales','Instalaciones eléctricas, fontanería y climatización',7,'2024-08-01','2024-12-31',480.00,120.00,'pending',25.00,'high','[9]','Cables, tuberías, equipos clima','Herramientas instalaciones','Pendiente avance estructura',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(12,3,'Cimentación especial','Cimentación profunda para parking subterráneo',4,'2024-02-10','2024-04-10',300.00,280.00,'completed',100.00,'critical','[]','Hormigón especial, micropilotes','Maquinaria cimentación especial','Cimentación completada',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(13,3,'Estructura parking','Construcción de estructura del parking subterráneo',4,'2024-04-11','2024-06-30',240.00,230.00,'completed',100.00,'high','[12]','Hormigón armado, encofrados','Grúa, bombas hormigón','Estructura parking terminada',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(14,3,'Estructura oficinas','Construcción de estructura de las plantas de oficinas',4,'2024-07-01','2024-09-15',320.00,280.00,'completed',100.00,'high','[13]','Hormigón, acero estructural','Grúa torre, encofrados','Estructura completada',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(15,3,'Instalaciones tecnológicas','Instalación de fibra óptica y sistemas domóticos',4,'2024-09-01','2024-11-15',200.00,140.00,'in_progress',70.00,'medium','[14]','Fibra óptica, equipos domótica','Herramientas especializadas','Instalación avanzada',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(16,3,'Acabados premium','Acabados de alta calidad para espacios de oficina',4,'2024-10-01','2024-11-30',180.00,90.00,'in_progress',50.00,'medium','[15]','Materiales premium, mobiliario','Herramientas acabados','En proceso de instalación',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(17,4,'Estudio patrimonial','Análisis y documentación del estado del edificio histórico',7,'2024-04-01','2024-04-30',80.00,75.00,'completed',100.00,'critical','[]','Materiales documentación','Equipos medición, cámaras','Estudio completado y aprobado',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(18,4,'Consolidación estructural','Refuerzo y consolidación de la estructura existente',7,'2024-05-01','2024-07-15',300.00,220.00,'completed',100.00,'critical','[17]','Materiales consolidación','Equipos especializados','Consolidación exitosa',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(19,4,'Restauración fachada','Restauración de la fachada histórica',7,'2024-06-01','2024-09-30',240.00,180.00,'in_progress',75.00,'high','[18]','Materiales históricos, morteros','Andamios especiales','Restauración avanzada',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(20,4,'Modernización interior','Adaptación interior para uso residencial moderno',7,'2024-08-01','2024-10-15',200.00,80.00,'in_progress',40.00,'medium','[19]','Materiales modernos compatibles','Herramientas estándar','Iniciada modernización',2,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(21,1,'Excavación y cimentación','Excavación del terreno y construcción de cimentación',4,'2024-01-15','2024-02-28',200.00,180.00,'completed',100.00,'high','[]','Hormigón, acero, encofrados','Excavadora, hormigonera','Cimentación completada según planos',2,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(22,1,'Estructura de hormigón','Construcción de estructura portante de hormigón armado',4,'2024-03-01','2024-05-15',400.00,350.00,'completed',100.00,'high','[1]','Hormigón, acero, encofrados','Grúa, hormigonera','Estructura de 5 plantas terminada',2,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(23,1,'Instalaciones eléctricas','Instalación de sistema eléctrico completo',5,'2024-05-01','2024-07-30',300.00,150.00,'in_progress',50.00,'medium','[2]','Cables, cuadros eléctricos, luminarias','Herramientas eléctricas','Instalación en progreso',2,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(24,2,'Demolición parcial','Demolición de estructuras existentes para ampliación',4,'2024-03-01','2024-03-31',150.00,150.00,'completed',100.00,'high','[]','Contenedores de escombros','Martillo neumático, excavadora','Demolición completada',2,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(25,2,'Nueva estructura metálica','Construcción de estructura metálica para ampliación',4,'2024-04-01','2024-06-15',300.00,200.00,'in_progress',67.00,'high','[4]','Perfiles metálicos, tornillería','Grúa, soldadora','Estructura en construcción',2,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(26,3,'Movimiento de tierras','Nivelación y preparación del terreno',4,'2024-02-01','2024-02-28',100.00,100.00,'completed',100.00,'high','[]','Tierra vegetal','Bulldozer, motoniveladora','Terreno preparado',3,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(27,3,'Instalación de riego','Sistema de riego automático para zonas verdes',5,'2024-03-01','2024-04-15',80.00,60.00,'in_progress',75.00,'medium','[6]','Tuberías de riego, aspersores','Herramientas de excavación','Sistema de riego en instalación',3,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(28,1,'Excavación y cimentación','Excavación del terreno y construcción de cimentación',4,'2024-01-15','2024-02-28',200.00,180.00,'completed',100.00,'high','[]','Hormigón, acero, encofrados','Excavadora, hormigonera','Cimentación completada según planos',2,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(29,1,'Estructura de hormigón','Construcción de estructura portante de hormigón armado',4,'2024-03-01','2024-05-15',400.00,350.00,'completed',100.00,'high','[1]','Hormigón, acero, encofrados','Grúa, hormigonera','Estructura de 5 plantas terminada',2,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(30,1,'Instalaciones eléctricas','Instalación de sistema eléctrico completo',5,'2024-05-01','2024-07-30',300.00,150.00,'in_progress',50.00,'medium','[2]','Cables, cuadros eléctricos, luminarias','Herramientas eléctricas','Instalación en progreso',2,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(31,2,'Demolición parcial','Demolición de estructuras existentes para ampliación',4,'2024-03-01','2024-03-31',150.00,150.00,'completed',100.00,'high','[]','Contenedores de escombros','Martillo neumático, excavadora','Demolición completada',2,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(32,2,'Nueva estructura metálica','Construcción de estructura metálica para ampliación',4,'2024-04-01','2024-06-15',300.00,200.00,'in_progress',67.00,'high','[4]','Perfiles metálicos, tornillería','Grúa, soldadora','Estructura en construcción',2,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(33,3,'Movimiento de tierras','Nivelación y preparación del terreno',4,'2024-02-01','2024-02-28',100.00,100.00,'completed',100.00,'high','[]','Tierra vegetal','Bulldozer, motoniveladora','Terreno preparado',3,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(34,3,'Instalación de riego','Sistema de riego automático para zonas verdes',5,'2024-03-01','2024-04-15',80.00,60.00,'in_progress',75.00,'medium','[6]','Tuberías de riego, aspersores','Herramientas de excavación','Sistema de riego en instalación',3,'2025-09-14 14:24:20','2025-09-14 14:24:20');
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(50) NOT NULL,
  `record_id` int NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,2,'CREATE','projects',1,NULL,'{\"name\": \"Residencial Las Flores\", \"client_id\": 1}','192.168.1.100','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2025-09-06 06:59:45'),(2,2,'CREATE','projects',2,NULL,'{\"name\": \"Hotel Costa Blanca\", \"client_id\": 4}','192.168.1.100','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2025-09-06 06:59:45'),(3,4,'UPDATE','activities',6,NULL,'{\"actual_hours\": 250, \"progress_percentage\": 78}','192.168.1.105','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2025-09-06 06:59:45'),(4,3,'UPLOAD','files',7,NULL,'{\"filename\": \"Seguimiento Semanal Obras.xlsx\", \"project_id\": 3}','192.168.1.103','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2025-09-06 06:59:45'),(5,2,'UPDATE','projects',1,NULL,'{\"actual_cost\": 1200000, \"progress_percentage\": 65.5}','192.168.1.100','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','2025-09-06 06:59:45'),(6,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 07:11:58'),(7,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 07:16:26'),(8,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 07:20:00'),(9,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 07:22:13'),(10,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 07:25:57'),(11,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 07:28:48'),(12,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 07:30:03'),(13,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 07:34:46'),(14,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 07:36:52'),(15,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:05:19'),(16,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:09:46'),(17,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:16:00'),(18,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:17:31'),(19,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:21:28'),(20,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:25:46'),(21,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:27:20'),(22,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:37:36'),(23,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:41:05'),(24,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-06 08:45:24'),(25,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-07 01:24:55'),(26,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-07 01:25:24'),(27,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-07 01:26:13'),(28,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 22:48:21'),(29,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 22:58:37'),(30,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 23:03:30'),(31,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 23:09:25'),(32,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 23:15:10'),(33,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 23:15:52'),(34,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 23:21:18'),(35,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 23:21:42'),(36,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 23:24:21'),(37,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 23:43:04'),(38,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-09 23:47:37'),(39,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-10 00:01:20'),(40,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-10 00:02:20'),(41,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-10 00:11:33'),(42,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36','2025-09-10 00:12:14'),(43,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 12:49:03'),(44,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 13:02:34'),(45,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 14:17:07'),(46,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 14:25:19'),(47,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 14:25:40'),(48,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 15:15:32'),(49,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 15:21:40'),(50,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 15:25:45'),(51,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 15:34:46'),(52,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 15:41:05'),(53,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 15:48:28'),(54,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 15:52:02'),(55,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 15:55:23'),(56,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 15:57:17'),(57,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:02:28'),(58,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:04:29'),(59,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:06:41'),(60,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:07:51'),(61,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:09:28'),(62,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:10:41'),(63,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:12:11'),(64,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:13:16'),(65,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:16:02'),(66,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:17:08'),(67,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:19:38'),(68,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:26:28'),(69,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:44:08'),(70,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 16:48:19'),(71,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:04:40'),(72,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:08:29'),(73,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:11:44'),(74,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:17:21'),(75,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:21:12'),(76,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:27:00'),(77,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:29:25'),(78,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:30:57'),(79,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:38:43'),(80,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 17:42:21'),(81,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:09:37'),(82,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:10:09'),(83,1,'UPLOAD','files',19,NULL,'{\"fileType\": \"pdf\", \"filename\": \"PT-0004.pdf\", \"projectId\": \"2\"}',NULL,NULL,'2025-09-14 18:11:52'),(84,1,'DOWNLOAD','files',19,NULL,NULL,NULL,NULL,'2025-09-14 18:11:57'),(85,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:13:07'),(86,1,'UPDATE','users',14,NULL,'{\"role\": \"worker\", \"email\": \"carlos.lopez@empresa.com\", \"phone\": \"600456789\", \"isActive\": true, \"lastName\": \"López\", \"password\": \"123456\", \"username\": \"carlos.lopez\", \"firstName\": \"Carlos\"}',NULL,NULL,'2025-09-14 18:13:38'),(87,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:14:21'),(88,1,'UPDATE','users',14,NULL,'{\"role\": \"worker\", \"email\": \"carlos.lopez@empresa.com\", \"phone\": \"600456789\", \"isActive\": true, \"lastName\": \"López\", \"password\": \"123456\", \"username\": \"carlos.lopez\", \"firstName\": \"Carlos\"}',NULL,NULL,'2025-09-14 18:14:42'),(89,14,'LOGIN','users',14,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:16:05'),(90,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:18:38'),(91,1,'UPDATE','users',14,NULL,'{\"role\": \"worker\", \"email\": \"carlos.lopez@empresa.com\", \"phone\": \"600456789\", \"isActive\": true, \"lastName\": \"López\", \"password\": \"[HIDDEN]\", \"username\": \"carlos.lopez\", \"firstName\": \"Carlos\"}',NULL,NULL,'2025-09-14 18:18:52'),(92,14,'LOGIN','users',14,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:19:03'),(93,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:22:59'),(94,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:31:34'),(95,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:31:53'),(96,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:37:18'),(97,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:41:31'),(98,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:45:13'),(99,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:58:19'),(100,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 18:59:12'),(101,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 19:03:45'),(102,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-14 20:17:32'),(103,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-24 11:18:56'),(104,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-24 11:20:39'),(105,1,'LOGIN','users',1,NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36','2025-09-24 12:50:45');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `company` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(50) DEFAULT 'España',
  `contact_person` varchar(100) DEFAULT NULL,
  `notes` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'María González','Constructora González S.L.','maria@gonzalez-construcciones.es','+34 91 123 4567','Calle Mayor 45','Madrid','Madrid','28001','España','María González','Cliente preferente desde 2020',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(2,'Juan Pérez','Inmobiliaria Pérez','juan.perez@inmobiliariaperez.com','+34 93 234 5678','Avenida Diagonal 123','Barcelona','Barcelona','08001','España','Juan Pérez','Especializado en viviendas residenciales',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(3,'Ana Martín','Desarrollos Urbanos S.A.','ana.martin@desarrollosurbanos.es','+34 95 345 6789','Plaza de España 10','Sevilla','Andalucía','41001','España','Ana Martín','Proyectos de gran envergadura',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(4,'Carlos Ruiz','Hoteles Costa del Sol','carlos@hotelescostadelsol.com','+34 96 456 7890','Paseo Marítimo 25','Málaga','Andalucía','29001','España','Carlos Ruiz','Cadena hotelera en expansión',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(5,'Elena Vázquez','Oficinas Modernas S.L.','elena@oficinasmodernas.es','+34 98 567 8901','Polígono Industrial Norte','Valencia','Valencia','46001','España','Elena Vázquez','Especializada en espacios de oficina',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(6,'Constructora ABC S.L.','ABC Construcciones','info@abcconstrucciones.com','911234567','Calle Mayor 123','Madrid','Madrid','28001','España','Roberto Sánchez','Cliente principal con múltiples proyectos',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(7,'Inmobiliaria XYZ','XYZ Inmobiliaria','contacto@xyzinmobiliaria.com','912345678','Avenida de la Paz 45','Barcelona','Barcelona','08001','España','Laura Fernández','Especializada en viviendas de lujo',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(8,'Ayuntamiento de Valencia','Ayuntamiento','obras@valencia.es','963123456','Plaza del Ayuntamiento 1','Valencia','Valencia','46002','España','Miguel Torres','Proyectos públicos y urbanización',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(9,'Constructora ABC S.L.','ABC Construcciones','info@abcconstrucciones.com','911234567','Calle Mayor 123','Madrid','Madrid','28001','España','Roberto Sánchez','Cliente principal con múltiples proyectos',1,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(10,'Inmobiliaria XYZ','XYZ Inmobiliaria','contacto@xyzinmobiliaria.com','912345678','Avenida de la Paz 45','Barcelona','Barcelona','08001','España','Laura Fernández','Especializada en viviendas de lujo',1,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(11,'Ayuntamiento de Valencia','Ayuntamiento','obras@valencia.es','963123456','Plaza del Ayuntamiento 1','Valencia','Valencia','46002','España','Miguel Torres','Proyectos públicos y urbanización',1,'2025-09-14 14:24:20','2025-09-14 14:24:20');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file_permissions`
--

DROP TABLE IF EXISTS `file_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL,
  `user_id` int NOT NULL,
  `permission_type` enum('read','write','admin') DEFAULT 'read',
  `granted_by` int DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_file_user_permission` (`file_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `granted_by` (`granted_by`),
  CONSTRAINT `file_permissions_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE,
  CONSTRAINT `file_permissions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `file_permissions_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_permissions`
--

LOCK TABLES `file_permissions` WRITE;
/*!40000 ALTER TABLE `file_permissions` DISABLE KEYS */;
INSERT INTO `file_permissions` VALUES (1,1,3,'read',2,'2025-09-06 06:59:45'),(2,1,4,'read',2,'2025-09-06 06:59:45'),(3,2,7,'write',2,'2025-09-06 06:59:45'),(4,4,2,'admin',4,'2025-09-06 06:59:45'),(5,4,3,'read',4,'2025-09-06 06:59:45'),(6,5,3,'read',2,'2025-09-06 06:59:45'),(7,5,4,'read',2,'2025-09-06 06:59:45'),(8,6,7,'write',2,'2025-09-06 06:59:45'),(9,7,2,'admin',3,'2025-09-06 06:59:45'),(10,7,4,'read',3,'2025-09-06 06:59:45');
/*!40000 ALTER TABLE `file_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` enum('excel','word','cad','image','pdf','other') NOT NULL,
  `file_size` bigint NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `activity_id` int DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `description` text,
  `is_shared` tinyint(1) DEFAULT '0',
  `version` int DEFAULT '1',
  `parent_file_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `activity_id` (`activity_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `parent_file_id` (`parent_file_id`),
  KEY `idx_files_project` (`project_id`),
  KEY `idx_files_type` (`file_type`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `files_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `files_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `files_ibfk_4` FOREIGN KEY (`parent_file_id`) REFERENCES `files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
INSERT INTO `files` VALUES (1,'uuid1_planos_residencial.dwg','Planos Residencial Las Flores.dwg','/uploads/uuid1_planos_residencial.dwg','cad',2048576,'application/dwg',1,1,2,'Planos arquitectónicos del proyecto residencial',1,1,NULL,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(2,'uuid2_presupuesto_hotel.xlsx','Presupuesto Hotel Costa Blanca.xlsx','/uploads/uuid2_presupuesto_hotel.xlsx','excel',524288,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',2,8,2,'Presupuesto detallado del proyecto hotelero',1,1,NULL,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(3,'uuid3_memoria_oficinas.docx','Memoria Técnica Oficinas Valencia.docx','/uploads/uuid3_memoria_oficinas.docx','word',1048576,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',3,12,2,'Memoria técnica del proyecto de oficinas',0,1,NULL,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(4,'uuid4_foto_obra1.jpg','Progreso Obra Residencial - Semana 20.jpg','/uploads/uuid4_foto_obra1.jpg','image',3145728,'image/jpeg',1,6,4,'Fotografía del progreso de la obra residencial',1,1,NULL,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(5,'uuid5_certificado_calidad.pdf','Certificado Calidad Materiales.pdf','/uploads/uuid5_certificado_calidad.pdf','pdf',786432,'application/pdf',1,2,2,'Certificado de calidad de los materiales utilizados',1,1,NULL,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(6,'uuid6_planos_hotel.dwg','Planos Hotel - Planta Baja.dwg','/uploads/uuid6_planos_hotel.dwg','cad',4194304,'application/dwg',2,9,2,'Planos de la planta baja del hotel',1,1,NULL,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(7,'uuid7_seguimiento_obra.xlsx','Seguimiento Semanal Obras.xlsx','/uploads/uuid7_seguimiento_obra.xlsx','excel',262144,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',3,15,3,'Hoja de seguimiento semanal del progreso',1,2,NULL,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(8,'uuid8_informe_rehabilitacion.docx','Informe Rehabilitación Centro Histórico.docx','/uploads/uuid8_informe_rehabilitacion.docx','word',2097152,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',4,17,2,'Informe técnico de la rehabilitación',0,1,NULL,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(9,'test-file-8-1.txt','Archivo de prueba 1 - Obra de Prueba 3','uploads/test-file-8-1.txt','other',1024,'text/plain',8,NULL,1,'Archivo de prueba 1 para Obra de Prueba 3',0,1,NULL,'2025-09-09 23:20:20','2025-09-09 23:20:20'),(10,'test-file-7-1.txt','Archivo de prueba 1 - Obra de Prueba 2','uploads/test-file-7-1.txt','other',1024,'text/plain',7,NULL,1,'Archivo de prueba 1 para Obra de Prueba 2',0,1,NULL,'2025-09-09 23:20:20','2025-09-09 23:20:20'),(11,'test-file-7-2.txt','Archivo de prueba 2 - Obra de Prueba 2','uploads/test-file-7-2.txt','other',1024,'text/plain',7,NULL,1,'Archivo de prueba 2 para Obra de Prueba 2',0,1,NULL,'2025-09-09 23:20:20','2025-09-09 23:20:20'),(12,'test-file-6-1.txt','Archivo de prueba 1 - Obra de Prueba 1','uploads/test-file-6-1.txt','other',1024,'text/plain',6,NULL,1,'Archivo de prueba 1 para Obra de Prueba 1',0,1,NULL,'2025-09-09 23:20:20','2025-09-09 23:20:20'),(13,'test-file-6-2.txt','Archivo de prueba 2 - Obra de Prueba 1','uploads/test-file-6-2.txt','other',1024,'text/plain',6,NULL,1,'Archivo de prueba 2 para Obra de Prueba 1',0,1,NULL,'2025-09-09 23:20:20','2025-09-09 23:20:20'),(14,'test-file-6-3.txt','Archivo de prueba 3 - Obra de Prueba 1','uploads/test-file-6-3.txt','other',1024,'text/plain',6,NULL,1,'Archivo de prueba 3 para Obra de Prueba 1',0,1,NULL,'2025-09-09 23:20:20','2025-09-09 23:20:20'),(15,'planos_edificio_pinos_20240115.pdf','planos_edificio_pinos.pdf','/uploads/project1/planos_edificio_pinos_20240115.pdf','pdf',2048576,NULL,1,NULL,2,'Planos arquitectónicos del edificio residencial',1,1,NULL,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(16,'memoria_calculo_estructura_20240120.pdf','memoria_calculo_estructura.pdf','/uploads/project1/memoria_calculo_estructura_20240120.pdf','pdf',1536000,NULL,1,NULL,2,'Memoria de cálculo de la estructura',0,1,NULL,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(17,'planos_centro_comercial_20240301.dwg','planos_centro_comercial.dwg','/uploads/project2/planos_centro_comercial_20240301.dwg','cad',8192000,NULL,2,NULL,2,'Planos CAD de la ampliación',0,1,NULL,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(18,'planos_parque_central_20240201.pdf','planos_parque_central.pdf','/uploads/project3/planos_parque_central_20240201.pdf','pdf',3072000,NULL,3,NULL,3,'Planos del diseño del parque',1,1,NULL,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(19,'2cf3f39c-6b00-4f93-bb9b-595fc6dfac88.pdf','PT-0004.pdf','C:\\sgp\\uploads\\2cf3f39c-6b00-4f93-bb9b-595fc6dfac88.pdf','pdf',650774,'application/pdf',2,NULL,1,'un nuevo archivo',1,1,NULL,'2025-09-14 18:11:52','2025-09-14 18:11:52');
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_team`
--

DROP TABLE IF EXISTS `project_team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_team` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('manager','supervisor','worker','observer') DEFAULT 'worker',
  `permissions` json DEFAULT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_project_user` (`project_id`,`user_id`),
  KEY `idx_project_team_project` (`project_id`),
  KEY `idx_project_team_user` (`user_id`),
  CONSTRAINT `project_team_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_team_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_team`
--

LOCK TABLES `project_team` WRITE;
/*!40000 ALTER TABLE `project_team` DISABLE KEYS */;
INSERT INTO `project_team` VALUES (1,1,2,'manager','{\"read\": true, \"admin\": true, \"write\": true}','2025-09-06 06:59:45'),(2,1,3,'supervisor','{\"read\": true, \"admin\": false, \"write\": true}','2025-09-06 06:59:45'),(3,1,4,'worker','{\"read\": true, \"admin\": false, \"write\": false}','2025-09-06 06:59:45'),(4,1,6,'worker','{\"read\": true, \"admin\": false, \"write\": false}','2025-09-06 06:59:45'),(5,2,2,'manager','{\"read\": true, \"admin\": true, \"write\": true}','2025-09-06 06:59:45'),(6,2,5,'supervisor','{\"read\": true, \"admin\": false, \"write\": true}','2025-09-06 06:59:45'),(7,2,7,'worker','{\"read\": true, \"admin\": false, \"write\": false}','2025-09-06 06:59:45'),(8,3,2,'manager','{\"read\": true, \"admin\": true, \"write\": true}','2025-09-06 06:59:45'),(9,3,3,'supervisor','{\"read\": true, \"admin\": false, \"write\": true}','2025-09-06 06:59:45'),(10,3,4,'worker','{\"read\": true, \"admin\": false, \"write\": false}','2025-09-06 06:59:45'),(11,4,2,'manager','{\"read\": true, \"admin\": true, \"write\": true}','2025-09-06 06:59:45'),(12,4,5,'supervisor','{\"read\": true, \"admin\": false, \"write\": true}','2025-09-06 06:59:45'),(13,5,2,'manager','{\"read\": true, \"admin\": true, \"write\": true}','2025-09-06 06:59:45');
/*!40000 ALTER TABLE `project_team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `client_id` int DEFAULT NULL,
  `project_manager_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `estimated_budget` decimal(15,2) DEFAULT NULL,
  `actual_cost` decimal(15,2) DEFAULT '0.00',
  `status` enum('planning','in_progress','on_hold','completed','cancelled') DEFAULT 'planning',
  `progress_percentage` decimal(5,2) DEFAULT '0.00',
  `address` text,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `coordinates` varchar(100) DEFAULT NULL,
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `notes` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_manager_id` (`project_manager_id`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_client` (`client_id`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`project_manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'Residencial Las Flores','Construcción de 50 viviendas unifamiliares con zonas comunes, piscina y jardines',1,2,'2024-01-15','2024-12-20',2500000.00,1200000.00,'in_progress',86.57,'Urbanización Las Flores, Parcela 15','Madrid','Madrid','28050',NULL,'high','Proyecto emblemático con certificación energética A',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(2,'Hotel Costa Blanca','Construcción de hotel de 4 estrellas con 120 habitaciones, spa y centro de convenciones',4,2,'2024-03-01','2025-02-28',4200000.00,1800000.00,'in_progress',60.00,'Avenida del Mar 88','Málaga','Andalucía','29620',NULL,'critical','Apertura programada para temporada alta 2025',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(3,'Oficinas Tecnológicas Valencia','Complejo de oficinas modernas con espacios coworking y parking subterráneo',5,2,'2024-02-10','2024-11-30',1800000.00,950000.00,'in_progress',84.00,'Polígono Tecnológico, Manzana C','Valencia','Valencia','46980',NULL,'medium','Incluye instalaciones de fibra óptica y domótica',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(4,'Rehabilitación Centro Histórico','Restauración y modernización de edificio histórico para uso residencial',2,2,'2024-04-01','2024-10-15',850000.00,420000.00,'in_progress',78.75,'Calle del Carmen 23','Barcelona','Barcelona','08001',NULL,'medium','Proyecto con restricciones patrimoniales',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(5,'Centro Comercial Andalucía','Construcción de centro comercial con 80 locales y hipermercado',3,2,'2024-05-15','2025-08-30',6500000.00,1950000.00,'planning',NULL,'Autovía A-4, Km 15','Sevilla','Andalucía','41940',NULL,'high','Fase de permisos y licencias en curso',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(6,'Obra de Prueba 1','Descripción de la obra de prueba 1',NULL,NULL,NULL,NULL,NULL,0.00,'in_progress',0.00,NULL,NULL,NULL,NULL,NULL,'high',NULL,1,'2025-09-09 23:20:20','2025-09-09 23:20:20'),(7,'Obra de Prueba 2','Descripción de la obra de prueba 2',NULL,NULL,NULL,NULL,NULL,0.00,'planning',0.00,NULL,NULL,NULL,NULL,NULL,'medium',NULL,1,'2025-09-09 23:20:20','2025-09-09 23:20:20'),(8,'Obra de Prueba 3','Descripción de la obra de prueba 3',NULL,NULL,NULL,NULL,NULL,0.00,'completed',0.00,NULL,NULL,NULL,NULL,NULL,'low',NULL,1,'2025-09-09 23:20:20','2025-09-09 23:20:20'),(9,'Edificio Residencial Los Pinos','Construcción de edificio residencial de 5 plantas con 20 viviendas',1,2,'2024-01-15','2024-12-31',2500000.00,1250000.00,'in_progress',50.00,'Calle Los Pinos 25','Madrid','Madrid','28010',NULL,'high','Proyecto prioritario con entrega en diciembre',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(10,'Reforma Centro Comercial','Ampliación y modernización del centro comercial existente',2,2,'2024-03-01','2024-10-15',1800000.00,900000.00,'in_progress',60.00,'Avenida de la Paz 45','Barcelona','Barcelona','08001',NULL,'medium','Incluye nueva zona de restauración',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(11,'Urbanización Parque Central','Creación de parque urbano con zonas verdes y equipamientos',3,3,'2024-02-01','2024-08-30',800000.00,400000.00,'in_progress',45.00,'Zona Central de Valencia','Valencia','Valencia','46002',NULL,'medium','Proyecto público con financiación municipal',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(12,'Edificio Residencial Los Pinos','Construcción de edificio residencial de 5 plantas con 20 viviendas',1,2,'2024-01-15','2024-12-31',2500000.00,1250000.00,'in_progress',50.00,'Calle Los Pinos 25','Madrid','Madrid','28010',NULL,'high','Proyecto prioritario con entrega en diciembre',1,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(13,'Reforma Centro Comercial','Ampliación y modernización del centro comercial existente',2,2,'2024-03-01','2024-10-15',1800000.00,900000.00,'in_progress',60.00,'Avenida de la Paz 45','Barcelona','Barcelona','08001',NULL,'medium','Incluye nueva zona de restauración',1,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(14,'Urbanización Parque Central','Creación de parque urbano con zonas verdes y equipamientos',3,3,'2024-02-01','2024-08-30',800000.00,400000.00,'in_progress',45.00,'Zona Central de Valencia','Valencia','Valencia','46002',NULL,'medium','Proyecto público con financiación municipal',1,'2025-09-14 14:24:20','2025-09-14 14:24:20');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `company` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(50) DEFAULT 'España',
  `contact_person` varchar(100) DEFAULT NULL,
  `supplier_type` enum('materials','equipment','services','subcontractor') DEFAULT 'materials',
  `tax_id` varchar(50) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT NULL,
  `notes` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Materiales Construcción Madrid','MCM S.A.','ventas@mcm.es','+34 91 111 2222','Polígono Industrial Sur','Madrid','Madrid','28002','España','Roberto Silva','materials','A12345678','30 días','Proveedor principal de cemento y áridos',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(2,'Ferralla Ibérica','Ferralla Ibérica S.L.','pedidos@ferralla.com','+34 93 222 3333','Zona Industrial Este','Barcelona','Barcelona','08002','España','Miguel Torres','materials','B23456789','45 días','Especialistas en estructuras metálicas',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(3,'Alquiler Maquinaria Pesada','AMP Rental','alquiler@amp.es','+34 95 333 4444','Carretera Nacional 340','Sevilla','Andalucía','41002','España','Francisco López','equipment','C34567890','15 días','Grúas, excavadoras y maquinaria pesada',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(4,'Instalaciones Eléctricas Pro','IEP S.L.','info@iep.es','+34 96 444 5555','Avenida de la Industria 15','Valencia','Valencia','46002','España','Laura Jiménez','services','D45678901','30 días','Instalaciones eléctricas y domótica',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(5,'Fontanería y Climatización','FyC Servicios','contacto@fyc.es','+34 98 555 6666','Calle de los Oficios 8','Bilbao','País Vasco','48001','España','David Fernández','services','E56789012','30 días','Fontanería, calefacción y aire acondicionado',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(6,'Materiales del Norte S.L.','Materiales del Norte','ventas@materialesnorte.com','944111111','Polígono Industrial Norte','Bilbao','Vizcaya','48015','España','Elena Vázquez','materials','B12345678','30 días','Proveedor principal de materiales de construcción',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(7,'Equipos y Maquinaria S.A.','Equipos S.A.','alquiler@equipos.com','911222222','Carretera de Circunvalación 200','Madrid','Madrid','28045','España','Antonio Jiménez','equipment','A87654321','15 días','Alquiler de maquinaria pesada',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(8,'Servicios de Limpieza Pro','Limpieza Pro S.L.','info@limpiezapro.com','912333333','Calle del Servicio 50','Barcelona','Barcelona','08025','España','Isabel Moreno','services','B11223344','30 días','Servicios de limpieza post-obra',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(9,'Materiales del Norte S.L.','Materiales del Norte','ventas@materialesnorte.com','944111111','Polígono Industrial Norte','Bilbao','Vizcaya','48015','España','Elena Vázquez','materials','B12345678','30 días','Proveedor principal de materiales de construcción',1,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(10,'Equipos y Maquinaria S.A.','Equipos S.A.','alquiler@equipos.com','911222222','Carretera de Circunvalación 200','Madrid','Madrid','28045','España','Antonio Jiménez','equipment','A87654321','15 días','Alquiler de maquinaria pesada',1,'2025-09-14 14:24:20','2025-09-14 14:24:20'),(11,'Servicios de Limpieza Pro','Limpieza Pro S.L.','info@limpiezapro.com','912333333','Calle del Servicio 50','Barcelona','Barcelona','08025','España','Isabel Moreno','services','B11223344','30 días','Servicios de limpieza post-obra',1,'2025-09-14 14:24:20','2025-09-14 14:24:20');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `session_id` varchar(128) NOT NULL,
  `user_id` int DEFAULT NULL,
  `expires` timestamp NULL DEFAULT NULL,
  `data` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `role` enum('admin','manager','supervisor','worker') DEFAULT 'worker',
  `phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@construccion.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Administrador','Sistema','admin',NULL,1,'2025-09-06 06:57:18','2025-09-06 06:57:18'),(2,'jgarcia','j.garcia@construccion.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','José','García','manager','+34 91 111 1111',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(3,'mlopez','m.lopez@construccion.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','María','López','supervisor','+34 93 222 2222',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(4,'aruiz','a.ruiz@construccion.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Antonio','Ruiz','worker','+34 95 333 3333',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(5,'cmartin','c.martin@construccion.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Carmen','Martín','supervisor','+34 96 444 4444',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(6,'pfernandez','p.fernandez@construccion.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Pedro','Fernández','worker','+34 98 555 5555',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(7,'lsanchez','l.sanchez@construccion.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Lucía','Sánchez','worker','+34 91 666 6666',1,'2025-09-06 06:59:45','2025-09-06 06:59:45'),(12,'juan.perez','juan.perez@empresa.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Juan','Pérez','manager','600234567',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(13,'maria.garcia','maria.garcia@empresa.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','María','García','supervisor','600345678',1,'2025-09-14 14:23:11','2025-09-14 14:23:11'),(14,'carlos.lopez','carlos.lopez@empresa.com','$2a$10$Wjd2eiYttMireT0wY3QZmuH60su0FKnpzIC8c0koU5dGGH3Aalpju','Carlos','López','worker','600456789',1,'2025-09-14 14:23:11','2025-09-14 18:18:52'),(15,'ana.martinez','ana.martinez@empresa.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Ana','Martínez','worker','600567890',1,'2025-09-14 14:23:11','2025-09-14 14:23:11');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-24 11:45:40
