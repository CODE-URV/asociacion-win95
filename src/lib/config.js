// src/lib/config.js
// Decide a qué backend llamar según el entorno.
// Por ahora, tanto en local como en producción usamos la API de
// producción (que ya funciona). Cuando en la Fase 4 usemos `vercel dev`,
// cambiaremos la rama de local a ruta relativa.

export const API_BASE = 'https://asociacion-win95.vercel.app';