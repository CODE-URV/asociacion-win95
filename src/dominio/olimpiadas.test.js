import { describe, expect, it } from 'vitest';
import {
  articuloDesdeEnlace, formatearTiempo, leerNota, medalla, miembrosDesdeTexto, pruebaVacia, validarEquipo, validarPrueba,
} from './olimpiadas';

describe('CodeOlimpiadas', () => {
  it('formatea el tiempo de la Wiki Race', () => {
    expect(formatearTiempo(0)).toBe('0:00');
    expect(formatearTiempo(75_300)).toBe('1:15');
    expect(formatearTiempo(75_300, { decimas: true })).toBe('1:15,3');
    expect(formatearTiempo(3_723_000)).toBe('1:02:03');
    expect(formatearTiempo(null)).toBe('—');
  });

  it('saca el artículo de un enlace de Wikipedia y descarta lo que no es un artículo', () => {
    expect(articuloDesdeEnlace('/wiki/Imperio_romano')).toBe('Imperio romano');
    expect(articuloDesdeEnlace('/wiki/Catalu%C3%B1a#Historia')).toBe('Cataluña');
    expect(articuloDesdeEnlace('./Mar_Mediterr%C3%A1neo')).toBe('Mar Mediterráneo');
    expect(articuloDesdeEnlace('https://es.wikipedia.org/wiki/Roma')).toBe('Roma');
    expect(articuloDesdeEnlace('/wiki/Star_Wars:_Episodio_IV')).toBe('Star Wars: Episodio IV');
    expect(articuloDesdeEnlace('/wiki/iPhone')).toBe('IPhone');

    expect(articuloDesdeEnlace('/wiki/Archivo:Tarragona.jpg')).toBeNull();
    expect(articuloDesdeEnlace('/wiki/Categor%C3%ADa:Ciudades')).toBeNull();
    expect(articuloDesdeEnlace('/wiki/Anexo:Municipios')).toBeNull();
    expect(articuloDesdeEnlace('/w/index.php?title=Algo&action=edit&redlink=1')).toBeNull();
    expect(articuloDesdeEnlace('https://en.wikipedia.org/wiki/Rome')).toBeNull();
    expect(articuloDesdeEnlace('#cite_note-1')).toBeNull();
    expect(articuloDesdeEnlace('')).toBeNull();
  });

  it('medallas para el podio y posición para el resto', () => {
    expect([1, 2, 3, 4].map(medalla)).toEqual(['🥇', '🥈', '🥉', '4º']);
  });

  it('valida equipos y pruebas como el servidor', () => {
    expect(miembrosDesdeTexto('Ana, Pol\n\n Marta ')).toEqual(['Ana', 'Pol', 'Marta']);
    expect(validarEquipo({ nombre: ' ', miembros: '' }).nombre).toBeDefined();
    expect(validarEquipo({ nombre: 'Rojo', miembros: Array(11).fill('x').join(',') }).miembros).toBeDefined();

    expect(validarPrueba({ ...pruebaVacia(), nombre: 'Imagen' })).toEqual({});
    const wiki = validarPrueba({ ...pruebaVacia(), nombre: 'WR', tipo: 'wikirace', origen: 'Roma', destino: 'roma' });
    expect(wiki.destino).toBeDefined();
  });

  it('lee notas de 0 a 10; vacío es sin puntuar', () => {
    expect(leerNota('')).toEqual({ nota: null });
    expect(leerNota('7')).toEqual({ nota: 7 });
    expect(leerNota('11').error).toBeDefined();
    expect(leerNota('7.5').error).toBeDefined();
  });
});
