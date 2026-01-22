<!-- README.md -->

# CODE URV — Web estilo Windows 95

Proyecto web con estética retro inspirada en Windows 95 para la asociación **CODE URV** (URV). Incluye escritorio, barra de tareas, sistema de ventanas y aplicaciones internas (p. ej. Proyectos con datos desde Google Sheets).

## Características

- UI retro estilo Windows 95 (ventanas, bordes, botones, taskbar, reloj)
- Sistema de ventanas: abrir/cerrar/minimizar, foco (z-index), arrastrar y (si está activado) redimensionar
- App “Proyectos” alimentada desde **Google Sheets** publicado como **CSV**
- Diseño modular por componentes (React)

## Requisitos

- Node.js (recomendado: versión LTS)
- npm (o pnpm/yarn si lo adaptas)

## Instalación

1. Instala dependencias:
   - `npm install`

2. Crea un archivo `.env` en la raíz del proyecto (junto a `package.json`):

   - `VITE_PROYECTOS_SHEET_URL=TU_URL_CSV_PUBLICA_DE_GOOGLE_SHEETS`

3. Arranca en desarrollo:
   - `npm run dev`

4. Build de producción:
   - `npm run build`

5. Previsualizar el build:
   - `npm run preview`

## Configuración de Google Sheets (Proyectos)

Para evitar descuadres por comas, el frontend usa un parser CSV que respeta comillas. Aun así, es recomendable seguir un formato consistente.

### Estructura esperada (orden de columnas)

1. `id`
2. `nombre`
3. `descripcion`
4. `responsable`
5. `email`
6. `estado`
7. `progreso`
8. `tecnologias` (valores separados por `|`)
9. `repositorio`
10. `colaboradores` (valores separados por `|`) ← opcional, pero soportado

### Ejemplos de formato

- `tecnologias`: `python | react | firebase`
- `colaboradores`: `Pau | Laia | Marc`

### Publicar como CSV

En Google Sheets:
- Archivo → Compartir / Publicar en la web → Formato CSV (o “Valores separados por comas”)
- Asegúrate de que el enlace sea accesible públicamente (solo lectura)

## Variables de entorno

- `VITE_PROYECTOS_SHEET_URL`: URL del CSV publicado de Google Sheets

## Notas de implementación

- El parser de CSV del componente de Proyectos evita que las comas dentro de `descripcion` rompan el mapeo de columnas (si el CSV viene correctamente entrecomillado).
- Para listas (`tecnologias`, `colaboradores`), se utiliza el separador `|` por robustez.

## Licencia y derechos

Este proyecto se distribuye bajo una licencia **propietaria** incluida en `LICENSE.md`.  
En resumen:
- El autor mantiene la titularidad (copyright).
- Se concede derecho de uso **únicamente a CODE URV** (según términos del fichero `LICENSE.md`).

## Autoría

- Autor: **GAIZKA ALONSO MARTíNEZ / Huntterstrike**
- Asociación usuaria: **CODE URV**