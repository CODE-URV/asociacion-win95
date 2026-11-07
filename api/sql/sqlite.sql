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
