import { Outlet } from 'react-router-dom'

import { useArribaAlNavegar } from '../utils/useArribaAlNavegar.js'
import { useTituloDeRuta } from '../utils/useTituloDeRuta.js'

import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'

/* =========================================================
   TiendaLayout — el marco de todas las paginas de la tienda
   ---------------------------------------------------------
   En el mockup, cada archivo .html repetia la navbar y el
   footer completos. Aqui se escriben UNA vez y se comparten.

   <Outlet /> es el hueco donde react-router mete la pagina
   que corresponde a la URL. Si la ruta es /login, ahi aparece
   Login; si es /catalogo, aparece Catalogo.

   La clase "pagina" (styles.css, seccion 3) usa flex para que
   el <main> crezca y el pie quede siempre abajo, aunque la
   pagina tenga poco contenido.
   ========================================================= */

function TiendaLayout() {
  useTituloDeRuta()
  useArribaAlNavegar()

  return (
    <div className="pagina">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default TiendaLayout
