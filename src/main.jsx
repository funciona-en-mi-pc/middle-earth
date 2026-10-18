import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

/* El orden de los estilos importa: Bootstrap primero, los
   nuestros despues, para poder pisar sus valores. Es el mismo
   orden que tenian los <link> en el mockup. */
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/fuentes.css'
import './styles/styles.css'

import App from './App.jsx'
import { sembrarDatos } from './services/storage.js'

/* Siembra las nueve tablas en localStorage si todavia no
   existen. Va antes de dibujar, para que la primera pagina ya
   encuentre los datos. */
sembrarDatos()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter habilita las rutas. Tiene que envolver a
        App, porque dentro se usan <Routes> y <NavLink>. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
