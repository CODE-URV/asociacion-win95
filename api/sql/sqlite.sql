-- El mismo esquema en SQLite, para desarrollo en local y para los tests.

CREATE TABLE IF NOT EXISTS proyectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  responsable TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL,
  progreso INTEGER NOT NULL DEFAULT 0,
  tecnologias TEXT NOT NULL,
  repositorio TEXT NOT NULL DEFAULT '',
  colaboradores TEXT NOT NULL,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  hash_contrasena TEXT NOT NULL,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS intentos_login (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clave TEXT NOT NULL,
  momento INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intentos_clave_momento ON intentos_login (clave, momento);

-- ===== Actividades (charlas, talleres...) =====

CREATE TABLE IF NOT EXISTS actividades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  informacion_extra TEXT NOT NULL,
  lugar TEXT NOT NULL,
  inicio TEXT NOT NULL,
  fin TEXT NOT NULL,
  ponente TEXT NOT NULL DEFAULT '',
  plazas INTEGER NULL,
  publicada INTEGER NOT NULL DEFAULT 0,
  inscripciones_abiertas INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inscripciones_actividad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actividad_id INTEGER NOT NULL REFERENCES actividades (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  grado TEXT NOT NULL,
  curso TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  inscrito_en TEXT NOT NULL,
  asistio_en TEXT NULL,
  certificado_enviado_en TEXT NULL,
  UNIQUE (actividad_id, email)
);

CREATE TABLE IF NOT EXISTS ajustes (
  clave TEXT NOT NULL PRIMARY KEY,
  valor TEXT NOT NULL
);