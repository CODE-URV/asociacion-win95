// Copia la API PHP dentro de dist/api para que se suba junto con la web.
// Solo se copia lo que debe estar en el servidor: index.php, .htaccess y src/.
// (tests/, sql/, herramientas/ y config.example.php se quedan en el repo.)

import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const origen = 'api';
const destino = join('dist', 'api');

if (!existsSync('dist')) {
  console.error('No existe dist/: ejecuta primero vite build');
  process.exit(1);
}

rmSync(destino, { recursive: true, force: true });
for (const elemento of ['index.php', '.htaccess', 'src']) {
  cpSync(join(origen, elemento), join(destino, elemento), { recursive: true });
}

console.log('API copiada en dist/api');
