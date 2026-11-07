<!-- README.md -->

# CODE URV — Web estilo Windows 95

Web de la asociación **CODE URV** (URV) con estética de Windows 95: inicio de sesión, escritorio, barra de tareas, ventanas y aplicaciones (Quién somos, Eventos, Proyectos, Hazte socio, Contacto, Solitario). Los administradores gestionan los proyectos desde el **Panel de control**.

- **Frontend:** React 19 + Vite
- **Backend:** PHP 8.5 sin framework + MySQL (Hostinger)
- **Arquitectura:** 4 capas en los dos lados — **Dominio, Aplicación, Infraestructura y Presentación**

## Arquitectura

Regla de dependencias: cada capa solo usa las de dentro.

```
Presentación  →  Aplicación  →  Dominio
Infraestructura  →  Aplicación / Dominio
```

| Capa | Qué contiene | No puede depender de |
|---|---|---|
| **Dominio** | Entidades y reglas puras (proyecto, inscripción, reglas del solitario, ventanas...) | nada |
| **Aplicación** | Casos de uso y estado (hooks en React, clases en PHP) + puertos (interfaces) | Infraestructura concreta, Presentación |
| **Infraestructura** | Acceso a datos: API HTTP, MySQL, Google Calendar, Apps Script, sesión PHP | Presentación |
| **Presentación** | Componentes React / controladores HTTP | — |

### Frontend (`src/`)

```
src/
├── main.jsx
├── dominio/            ventanas, sesion, calendario, inscripcion, proyecto, solitario (+ *.test.js)
├── aplicacion/         SesionProvider, useGestorVentanas, useEventosDelMes, useInscripcion, useProyectos, useSolitario
├── infraestructura/    apiClient (fetch + CSRF + errores), sesionApi, eventosApi, inscripcionesApi, proyectosApi
└── presentacion/
    ├── App.jsx
    ├── escritorio/     Shell, LoginDialog, Desktop, Taskbar, StartMenu, Window, WindowManager
    ├── apps/           una carpeta por ventana + registro.js (lista de aplicaciones)
    ├── estilos/        CSS global y piezas Win95 comunes
    └── assets/         imágenes
```

Para añadir una ventana nueva: crea su carpeta en `src/presentacion/apps/` y añádela a `src/presentacion/apps/registro.js`.

### Backend (`api/`)

```
api/
├── index.php           punto de entrada único (/api/*)
├── .htaccess           todo /api/* → index.php; src/ nunca se sirve
├── src/
│   ├── Dominio/        Proyecto, EstadoProyecto, Usuario, Evento, SolicitudInscripcion
│   ├── Aplicacion/     CasosDeUso/ + Puertos/ (interfaces) + errores
│   ├── Infraestructura/ BaseDeDatos/ (PDO), Google/, Http/, Sesion/, Config
│   ├── Presentacion/   Http/ (Peticion, Respuesta, Router), Controladores/, Api (rutas y errores)
│   └── Contenedor.php  raíz de composición: conecta las capas
├── sql/                esquema MySQL (producción) y SQLite (desarrollo/tests)
├── tests/              tests de PHP (php api/tests/ejecutar.php)
├── herramientas/       servidor de desarrollo, crear administrador, empaquetado
└── config.example.php  plantilla de config.php
```

### Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/proyectos` | público |
| POST | `/api/proyectos` | admin + CSRF |
| PUT / DELETE | `/api/proyectos/{id}` | admin + CSRF |
| GET | `/api/eventos?desde=ISO&hasta=ISO` | público |
| POST | `/api/inscripciones` | público |
| GET / POST / DELETE | `/api/sesion` | consultar / iniciar / cerrar sesión |

Seguridad: contraseña con `password_hash`, cookie de sesión `httpOnly` + `SameSite=Strict` + `Secure` limitada a `/api`, token CSRF en las peticiones de admin, bloqueo de 15 min tras 5 intentos fallidos (por IP y por usuario) y errores internos solo en el log.

## Desarrollo

Requisitos: Node.js 20.19+ y PHP 8.5 (con `curl`, `mbstring`, `pdo_sqlite`).

```bash
npm install
npm run api        # API PHP en http://localhost:8000 (crea config.dev.php y api/dev.sqlite)
npm run dev        # web en http://localhost:5173 (las llamadas a /api van a la API local)
```

Crear el administrador local:

```bash
php api/herramientas/crear-admin.php admin --dev
```

Para probar eventos e inscripciones reales en local, rellena las claves de Google en `config.dev.php`.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | tests del frontend (Vitest) |
| `npm run test:php` | tests de la API |
| `npm run lint` | ESLint |
| `npm run build` | compila la web y copia la API en `dist/api` |
| `npm run preview:php` | sirve `dist/` + la API en http://localhost:8000 |

## Despliegue (Hostinger)

Cada push a `master` ejecuta lint y tests, y si pasan, compila y sube `dist/` (web + API) por FTPS a `public_html` (`.github/workflows/deploy.yml`).

Configuración única en Hostinger:

1. **PHP 8.5:** hPanel → Avanzado → Configuración de PHP.
2. **Base de datos:** hPanel → Bases de datos → crear una base MySQL y su usuario. En phpMyAdmin, pestaña SQL, ejecuta `api/sql/mysql.sql`.
3. **Administrador:** `php api/herramientas/crear-admin.php <usuario>` imprime el SQL que hay que ejecutar en phpMyAdmin.
4. **`config.php`:** cópialo de `api/config.example.php` en `/home/uXXXX/domains/codeurv.com/` (al lado de `public_html`, **no dentro**) y rellénalo.
5. **FTP:** cuenta FTP con directorio `/public_html` y, en GitHub, los secrets `FTP_SERVER` (solo la IP), `FTP_USERNAME` y `FTP_PASSWORD`.

## Licencia y derechos

Este proyecto se distribuye bajo una licencia **propietaria** incluida en `LICENSE.md`.
En resumen:
- El autor mantiene la titularidad (copyright).
- Se concede derecho de uso **únicamente a CODE URV** (según términos del fichero `LICENSE.md`).

## Autoría

- Autor: **GAIZKA ALONSO MARTíNEZ / Huntterstrike**
- Asociación usuaria: **CODE URV**
