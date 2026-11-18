-- Migración para la base de datos de Hostinger que ya existe.
-- Ejecutar UNA vez en phpMyAdmin (pestaña SQL) sobre u863071096_codeurv.

-- ===== CodeOlimpiadas =====

CREATE TABLE IF NOT EXISTS olimpiadas_equipos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  miembros TEXT NOT NULL,
  codigo CHAR(6) NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_olimpiadas_equipo_nombre (nombre),
  UNIQUE KEY uq_olimpiadas_equipo_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS olimpiadas_pruebas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  descripcion TEXT NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'preparacion',
  origen VARCHAR(255) NOT NULL DEFAULT '',
  destino VARCHAR(255) NOT NULL DEFAULT '',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS olimpiadas_puntuaciones (
  prueba_id INT UNSIGNED NOT NULL,
  equipo_id INT UNSIGNED NOT NULL,
  originalidad TINYINT UNSIGNED NULL,
  adecuacion TINYINT UNSIGNED NULL,
  calidad TINYINT UNSIGNED NULL,
  imagen MEDIUMBLOB NULL,
  imagen_tipo VARCHAR(30) NULL,
  PRIMARY KEY (prueba_id, equipo_id),
  CONSTRAINT fk_olimpiadas_puntuacion_prueba FOREIGN KEY (prueba_id) REFERENCES olimpiadas_pruebas (id) ON DELETE CASCADE,
  CONSTRAINT fk_olimpiadas_puntuacion_equipo FOREIGN KEY (equipo_id) REFERENCES olimpiadas_equipos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS olimpiadas_partidas (
  prueba_id INT UNSIGNED NOT NULL,
  equipo_id INT UNSIGNED NOT NULL,
  inicio_ms BIGINT NOT NULL,
  fin_ms BIGINT NULL,
  ruta MEDIUMTEXT NOT NULL,
  PRIMARY KEY (prueba_id, equipo_id),
  CONSTRAINT fk_olimpiadas_partida_prueba FOREIGN KEY (prueba_id) REFERENCES olimpiadas_pruebas (id) ON DELETE CASCADE,
  CONSTRAINT fk_olimpiadas_partida_equipo FOREIGN KEY (equipo_id) REFERENCES olimpiadas_equipos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
