import { useState } from 'react';
import * as inscripcion from '../dominio/inscripcion';
import { enviarInscripcion } from '../infraestructura/inscripcionesApi';

/** Estado del formulario de inscripción y caso de uso "enviar inscripción". */
export default function useInscripcion() {
  const [formulario, setFormulario] = useState(inscripcion.formularioInicial);
  const [estado, setEstado] = useState('idle'); // idle | sending | sent | error

  const cambiar = (campo, valor) => setFormulario((previo) => ({ ...previo, [campo]: valor }));

  const elegirSocioAnterior = (opcion) =>
    setFormulario((previo) => inscripcion.elegirSocioAnterior(previo, opcion));

  const enviar = async () => {
    const error = inscripcion.validar(formulario);
    if (error) {
      setEstado('error');
      return { ok: false, error };
    }

    setEstado('sending');
    try {
      await enviarInscripcion(inscripcion.aSolicitud(formulario));
      setEstado('sent');
      return { ok: true };
    } catch (e) {
      setEstado('error');
      // 422: el servidor indica qué campo falla
      const detalle = e.detalles ? Object.values(e.detalles)[0] : null;
      return { ok: false, error: detalle ?? `No se ha podido enviar: ${e.message}` };
    }
  };

  const reiniciar = () => {
    setFormulario(inscripcion.formularioInicial());
    setEstado('idle');
  };

  return {
    formulario,
    estado,
    cuota: inscripcion.cuota(formulario),
    necesitaTalla: inscripcion.necesitaTalla(formulario),
    cambiar,
    elegirSocioAnterior,
    enviar,
    reiniciar,
  };
}
