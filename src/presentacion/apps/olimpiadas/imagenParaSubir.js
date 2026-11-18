// Prepara una imagen del ordenador para subirla: si es pequeña va tal cual; si no,
// se reduce a 1600 px de lado y se pasa a JPEG para que la subida sea rápida.

const LADO_MAXIMO = 1600;
const TAMANO_DIRECTO = 1.5 * 1024 * 1024;
const TIPOS_DIRECTOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const leerComoDataUrl = (archivo) =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result);
    lector.onerror = () => rechazar(new Error('No se ha podido leer el archivo.'));
    lector.readAsDataURL(archivo);
  });

const cargarImagen = (url) =>
  new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error('El archivo no es una imagen que el navegador sepa abrir.'));
    img.src = url;
  });

/** Devuelve un data URL listo para enviar a la API. */
export async function imagenParaSubir(archivo) {
  if (!archivo.type.startsWith('image/')) throw new Error('Elige un archivo de imagen.');
  const dataUrl = await leerComoDataUrl(archivo);
  if (TIPOS_DIRECTOS.includes(archivo.type) && archivo.size <= TAMANO_DIRECTO) return dataUrl;

  const img = await cargarImagen(dataUrl);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(img.naturalWidth * escala);
  lienzo.height = Math.round(img.naturalHeight * escala);
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = '#fff'; // las PNG transparentes no se quedan en negro
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
  return lienzo.toDataURL('image/jpeg', 0.9);
}
