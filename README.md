<!-- README.md -->

# CODE URV — Web estilo Windows 95

Proyecto web con estética retro inspirada en Windows 95 para la asociación **CODE URV** (URV). Incluye escritorio, barra de tareas, sistema de ventanas y aplicaciones internas (p. ej. Proyectos con datos desde Google Sheets).

## Características

- UI retro estilo Windows 95 (ventanas, bordes, botones, taskbar, reloj)
- Sistema de ventanas: abrir/cerrar/minimizar, foco (z-index), arrastrar y (si está activado) redimensionar
- App “Proyectos” alimentada desde **Google Sheets** publicado como **CSV**
- Diseño modular por componentes (React)

## Requisitos

- Node.js 20.19 o superior (recomendado: la LTS actual)
- npm (o pnpm/yarn si lo adaptas)
- PHP 8.5 (solo para probar la API en local)

## Instalación

1. Instala dependencias:
   - `npm install`

2. Arranca en desarrollo:
   - `npm run dev`
   - Las llamadas a `/api` se reenvían a la API desplegada. Para usar otra, pon `VITE_API_PROXY=https://tudominio.com` en `.env.local`.

3. Build de producción:
   - `npm run build`

4. Probar el build con la API PHP real en local:
   - Copia `hostinger/config.example.php` como `config.php` en la raíz del repo y rellénalo.
   - `npm run preview:php` → http://localhost:8000

## API (PHP)

La carpeta `public/api/` se copia tal cual a `dist/api/` en el build:

- `GET /api/get-calendar?timeMin=…&timeMax=…` → eventos de Google Calendar
- `GET /api/get-proyectos` → CSV del Google Sheet de proyectos
- `POST /api/send-inscripcion` → reenvía el formulario a la Google Apps Script

Las claves se leen de `config.php`, que en Hostinger va **fuera** de `public_html`
(ver `hostinger/config.example.php`). Nunca se sube al repositorio.

## Despliegue (Hostinger)

Cada push a `master` compila la web y sube `dist/` por FTPS a `public_html`
(`.github/workflows/deploy.yml`). Hace falta:

- Una cuenta FTP en Hostinger con directorio `/public_html` (hPanel → Archivos → Cuentas FTP).
- En GitHub, los secrets `FTP_SERVER` (solo la IP), `FTP_USERNAME` y `FTP_PASSWORD` de esa cuenta.
- En Hostinger, **PHP 8.5** (hPanel → Avanzado → Configuración de PHP).

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

## Configuración

En `config.php` (servidor):

- `GOOGLE_CALENDAR_API_KEY`, `GOOGLE_CALENDAR_ID`: Google Calendar
- `PROYECTOS_SHEET_URL`: URL del CSV publicado de Google Sheets
- `WEB_APP_URL`: URL de la Google Apps Script de inscripciones

En `.env.local` (solo desarrollo):

- `VITE_API_PROXY`: a dónde reenvía `npm run dev` las llamadas a `/api`

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