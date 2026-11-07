import { peticion } from './apiClient';

export function enviarInscripcion(solicitud) {
  return peticion('/inscripciones', { metodo: 'POST', cuerpo: solicitud });
}
