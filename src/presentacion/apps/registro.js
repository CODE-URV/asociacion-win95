// Registro de aplicaciones del escritorio. Para añadir una ventana nueva basta con
// crear su carpeta en src/apps/ y añadir aquí una entrada.
//
//   id          identificador único
//   titulo      título de la ventana y del icono
//   icono       emoji para la barra de tareas
//   imagen      icono del escritorio / menú Inicio
//   componente  contenido de la ventana (recibe la prop `cerrarVentana`)
//   tamano      tamaño inicial { ancho, alto } (se ajusta a la pantalla)
//   centrada    abrir en el centro de la pantalla
//   escritorio  mostrar icono en el escritorio
//   menu        sección del menú Inicio: 'principal' | 'juegos' | 'sistema' | null
//   soloAdmin   solo visible con sesión de administrador

import aboutUsIcon from '../assets/desktop_icons/about_us.png';
import eventsIcon from '../assets/desktop_icons/events.png';
import projectsIcon from '../assets/desktop_icons/projects.png';
import sociosIcon from '../assets/desktop_icons/socios.png';
import contactIcon from '../assets/desktop_icons/contact.png';
import gameIcon from '../assets/desktop_icons/game.png';

import SobreNosotros from './sobre-nosotros/SobreNosotros';
import Eventos from './eventos/Eventos';
import Proyectos from './proyectos/Proyectos';
import Inscripciones from './inscripciones/Inscripciones';
import Contacto from './contacto/Contacto';
import Solitario from './solitario/Solitario';
import PanelControl from './panel-control/PanelControl';
import AcercaDe from './acerca/AcercaDe';
import Actividades from './actividades/Actividades';
import Asistencia from './actividades/Asistencia';

export const APPS = [
  { id: 'about', titulo: 'Quién somos', icono: '💻', imagen: aboutUsIcon, componente: SobreNosotros, tamano: { ancho: 700, alto: 550 }, escritorio: true, menu: 'principal' },
  { id: 'events', titulo: 'Eventos', icono: '📅', imagen: eventsIcon, componente: Eventos, escritorio: true, menu: 'principal' },
  { id: 'actividades', titulo: 'Charlas y talleres', icono: '🎤', componente: Actividades, tamano: { ancho: 720, alto: 580 }, escritorio: true, menu: 'principal' },
  { id: 'projects', titulo: 'Proyectos', icono: '🚀', imagen: projectsIcon, componente: Proyectos, escritorio: true, menu: 'principal' },
  { id: 'inscriptions', titulo: 'Hazte socio', icono: '📝', imagen: sociosIcon, componente: Inscripciones, escritorio: true, menu: 'principal' },
  { id: 'contact', titulo: 'Contacto', icono: '📧', imagen: contactIcon, componente: Contacto, escritorio: true, menu: 'principal' },
  { id: 'solitario', titulo: 'Solitario', icono: '🃏', imagen: gameIcon, componente: Solitario, tamano: { ancho: 800, alto: 600 }, escritorio: true, menu: 'juegos' },
  { id: 'panel-control', titulo: 'Panel de control', icono: '🛠️', componente: PanelControl, tamano: { ancho: 720, alto: 520 }, escritorio: true, menu: 'sistema', soloAdmin: true },
  // Se abre al escanear el QR de una actividad (no tiene icono)
  { id: 'asistencia', titulo: 'Registrar asistencia', icono: '✅', componente: Asistencia, tamano: { ancho: 480, alto: 600 }, centrada: true, escritorio: false, menu: null },
  { id: 'config', titulo: 'Acerca de CODE URV', icono: '⚙️', componente: AcercaDe, tamano: { ancho: 450, alto: 550 }, centrada: true, escritorio: false, menu: 'sistema' },
];

export const appPorId = (id) => APPS.find((app) => app.id === id);

export const appsSoloAdmin = APPS.filter((app) => app.soloAdmin).map((app) => app.id);
