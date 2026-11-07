-- Esquema de la base de datos en Hostinger (MySQL / MariaDB).
-- Ejecutar una vez en phpMyAdmin: hPanel → Bases de datos → phpMyAdmin → pestaña SQL.

CREATE TABLE IF NOT EXISTS proyectos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT NOT NULL,
  responsable VARCHAR(120) NOT NULL DEFAULT '',
  email VARCHAR(190) NOT NULL DEFAULT '',
  estado VARCHAR(20) NOT NULL,
  progreso TINYINT UNSIGNED NOT NULL DEFAULT 0,
  tecnologias TEXT NOT NULL,
  repositorio VARCHAR(255) NOT NULL DEFAULT '',
  colaboradores TEXT NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  hash_contrasena VARCHAR(255) NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intentos_login (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(120) NOT NULL,
  momento INT UNSIGNED NOT NULL,
  INDEX idx_intentos_clave_momento (clave, momento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== Actividades (charlas, talleres...) =====

CREATE TABLE IF NOT EXISTS actividades (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  descripcion TEXT NOT NULL,
  informacion_extra TEXT NOT NULL,
  lugar VARCHAR(150) NOT NULL,
  inicio DATETIME NOT NULL,
  fin DATETIME NOT NULL,
  ponente VARCHAR(120) NOT NULL DEFAULT '',
  plazas INT UNSIGNED NULL,
  publicada TINYINT(1) NOT NULL DEFAULT 0,
  inscripciones_abiertas TINYINT(1) NOT NULL DEFAULT 1,
  en_calendario TINYINT(1) NOT NULL DEFAULT 0,
  evento_calendario_id VARCHAR(255) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actividades_inicio (inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inscripciones_actividad (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actividad_id INT UNSIGNED NOT NULL,
  email VARCHAR(190) NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  grado VARCHAR(150) NOT NULL,
  curso VARCHAR(30) NOT NULL,
  codigo CHAR(12) NOT NULL,
  inscrito_en DATETIME NOT NULL,
  asistio_en DATETIME NULL,
  certificado_enviado_en DATETIME NULL,
  UNIQUE KEY uq_inscripcion_actividad_email (actividad_id, email),
  UNIQUE KEY uq_inscripcion_codigo (codigo),
  CONSTRAINT fk_inscripcion_actividad FOREIGN KEY (actividad_id) REFERENCES actividades (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ajustes (
  clave VARCHAR(60) NOT NULL PRIMARY KEY,
  valor TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;