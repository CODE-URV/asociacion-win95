import SesionProvider from '../aplicacion/SesionProvider';
import Shell from './escritorio/Shell';
import './estilos/App.css';

function App() {
  return (
    <SesionProvider>
      <Shell />
    </SesionProvider>
  );
}

export default App;
