// Wikipedia en español desde el navegador (la API de MediaWiki admite CORS con origin=*).

const API = 'https://es.wikipedia.org/w/api.php';

async function consultar(parametros) {
  const url = new URL(API);
  Object.entries({ format: 'json', formatversion: '2', origin: '*', ...parametros }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );
  let respuesta;
  try {
    respuesta = await fetch(url);
  } catch {
    throw new Error('No se puede conectar con Wikipedia.');
  }
  if (!respuesta.ok) throw new Error(`Wikipedia ha respondido ${respuesta.status}.`);
  const datos = await respuesta.json();
  if (datos.error) throw new Error(datos.error.info || 'Error de Wikipedia.');
  return datos;
}

/** HTML del artículo (siguiendo redirecciones): { titulo, html } */
export async function cargarArticulo(titulo) {
  const { parse } = await consultar({
    action: 'parse',
    page: titulo,
    prop: 'text',
    redirects: '1',
    disableeditsection: '1',
    disablelimitreport: '1',
  });
  return { titulo: parse.title, html: parse.text };
}

/** Un artículo al azar (para elegir salida y llegada desde el Panel de control). */
export async function articuloAleatorio() {
  const { query } = await consultar({ action: 'query', list: 'random', rnnamespace: '0', rnlimit: '1' });
  return query.random[0].title;
}
