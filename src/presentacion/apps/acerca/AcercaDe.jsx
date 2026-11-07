import './AcercaDe.css';

export default function AcercaDe({ cerrarVentana }) {
  return (
    <div className="acerca">
      <div className="acerca-icono">🎓</div>
      <h2 className="acerca-titulo">CODE URV - Asociación de Estudiantes</h2>

      <div className="acerca-separador" />

      <div className="acerca-info">
        <p><strong>Versión:</strong> 1.0 (Build 2026)</p>
        <p><strong>Sistema:</strong> Windows 95 Style</p>
      </div>

      <div className="acerca-separador" />

      <div className="acerca-creditos">
        <p>© 2026 CODE URV</p>
        <p>Todos los derechos reservados</p>
        <p className="acerca-creditos-titulo">Desarrollado por:</p>
        <p>Gaizka Alonso Martínez</p>
        <p className="acerca-creditos-nota">Hecho con ❤️ para la comunidad estudiantil</p>
      </div>

      <button className="acerca-boton" onClick={cerrarVentana}>
        Aceptar
      </button>
    </div>
  );
}
