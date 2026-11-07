import { peticion } from './apiClient';

export async function listarProyectos() {
  const { proyectos } = await peticion('/proyectos');
  return proyectos;
}

export async function crearProyecto(datos) {
  const { proyecto } = await peticion('/proyectos', { metodo: 'POST', cuerpo: datos });
  return proyecto;
}

export async function actualizarProyecto(id, datos) {
  const { proyecto } = await peticion(`/proyectos/${id}`, { metodo: 'PUT', cuerpo: datos });
  return proyecto;
}

export async function eliminarProyecto(id) {
  await peticion(`/proyectos/${id}`, { metodo: 'DELETE' });
}
