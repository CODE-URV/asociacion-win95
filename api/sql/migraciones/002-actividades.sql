-- Migración para la base de datos de Hostinger que ya existe.
-- Ejecutar UNA vez en phpMyAdmin (pestaña SQL) sobre u863071096_codeurv.

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