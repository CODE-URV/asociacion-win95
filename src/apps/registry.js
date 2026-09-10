// src/apps/registry.js
// Fuente única de verdad de las "apps" de la asociación.
// Cada app se define UNA vez aquí; el escritorio, el menú Inicio y la
// apertura de ventanas leen de este array.

// --- Componentes ---
import SobreNosotros from '../components/SobreNosotros/SobreNosotros';
import Eventos from '../components/Eventos/Eventos';
import Proyectos from '../components/Proyectos/Proyectos';
import Inscripciones from '../components/Inscripciones/Inscripciones';
import Contacto from '../components/Contacto/Contacto';
import Solitario from '../components/Solitario/Solitario';

// --- Iconos (imágenes) ---
import aboutUsIcon from '../assets/desktop_icons/about_us.png';
import eventsIcon from '../assets/desktop_icons/events.png';
import projectsIcon from '../assets/desktop_icons/projects.png';
import sociosIcon from '../assets/desktop_icons/socios.png';
import contactIcon from '../assets/desktop_icons/contact.png';
import gameIcon from '../assets/desktop_icons/game.png';

// Tamaño por defecto de una ventana (el que usaba App.jsx cuando no había caso especial)
const TAMAÑO_DEFECTO = { width: 650, height: 450 };

export const APPS = [
  {
    id: 'about',
    nombre: 'Quiénes somos',
    icono: '💻',
    iconoImg: aboutUsIcon,
    componente: SobreNosotros,
    seccion: 'principal',
    tamaño: { width: 700, height: 550 },
  },
  {
    id: 'events',
    nombre: 'Eventos',
    icono: '📅',
    iconoImg: eventsIcon,
    componente: Eventos,
    seccion: 'principal',
    tamaño: TAMAÑO_DEFECTO,
  },
  {
    id: 'projects',
    nombre: 'Proyectos',
    icono: '🚀',
    iconoImg: projectsIcon,
    componente: Proyectos,
    seccion: 'principal',
    tamaño: TAMAÑO_DEFECTO,
  },
  {
    id: 'inscriptions',
    nombre: 'Hazte socio',
    icono: '📝',
    iconoImg: sociosIcon,
    componente: Inscripciones,
    seccion: 'principal',
    tamaño: TAMAÑO_DEFECTO,
  },
  {
    id: 'contact',
    nombre: 'Contacto',
    icono: '📧',
    iconoImg: contactIcon,
    componente: Contacto,
    seccion: 'principal',
    tamaño: TAMAÑO_DEFECTO,
  },
  {
    id: 'solitario',
    nombre: 'Solitario',
    icono: '🃏',
    iconoImg: gameIcon,
    componente: Solitario,
    seccion: 'juegos',
    tamaño: { width: 800, height: 600 },
  },
  {
    id: 'config',
    nombre: 'Acerca de...',
    icono: '⚙️',
    iconoImg: null,          // el menú lo muestra con emoji, no con imagen
    componente: null,        // OJO: su contenido aún vive dentro de App.jsx (lo tratamos en el paso 4)
    seccion: 'sistema',
    tamaño: { width: 450, height: 550 },
    tituloVentana: 'Acerca de CODE URV', // el título de la ventana difería del nombre del item
  },
];

// --- Ayudantes para que los demás archivos no repitan lógica ---

// Busca una app por su id (lo usará App.jsx para abrir la ventana correcta)
export const getApp = (id) => APPS.find((app) => app.id === id);

// Devuelve las apps de una sección (lo usarán Desktop y StartMenu)
export const getAppsPorSeccion = (seccion) =>
  APPS.filter((app) => app.seccion === seccion);