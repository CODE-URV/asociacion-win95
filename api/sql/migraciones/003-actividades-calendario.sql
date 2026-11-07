-- Migración 003: actividades en el calendario de Google.
-- Ejecutar UNA vez en phpMyAdmin (pestaña SQL) con u863071096_codeurv seleccionada.

ALTER TABLE actividades
  ADD COLUMN en_calendario TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN evento_calendario_id VARCHAR(255) NULL;