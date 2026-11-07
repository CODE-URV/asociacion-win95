import Window from './Window';
import './WindowManager.css';
import { appPorId } from '../apps/registro';

/** Pinta las ventanas no minimizadas con el contenido de su aplicación. */
function WindowManager({ ventanas, acciones }) {
  return (
    <div className="window-manager">
      {ventanas
        .filter((v) => !v.minimized)
        .map((ventana) => {
          const Contenido = appPorId(ventana.appId)?.componente;
          return (
            <Window
              key={ventana.id}
              ventana={ventana}
              alCerrar={acciones.cerrar}
              alMinimizar={acciones.minimizar}
              alEnfocar={acciones.enfocar}
              alMover={acciones.mover}
              alRedimensionar={acciones.redimensionar}
              alMaximizar={acciones.maximizar}
            >
              {Contenido ? <Contenido {...ventana.parametros} cerrarVentana={() => acciones.cerrar(ventana.id)} /> : null}
            </Window>
          );
        })}
    </div>
  );
}

export default WindowManager;
