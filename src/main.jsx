import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './presentacion/estilos/index.css'
import './presentacion/estilos/win95.css'
import App from './presentacion/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
