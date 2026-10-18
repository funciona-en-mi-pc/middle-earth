import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../context/useAuth.js'

/* =========================================================
   RutaProtegida — el portero de las rutas
   ---------------------------------------------------------
   DUENO: Javier · tarea #27

   Es el equivalente de exigirAdministrador() del SQL, que en
   el mockup se llamaba en el <head> de cada pagina del panel
   para rebotar al intruso ANTES de pintar nada.

   USO, en App.jsx: envuelve a las rutas que protege.

     <Route element={<RutaProtegida />}>            cualquiera con sesion
     <Route element={<RutaProtegida tipo="JUGADOR" />}>
     <Route element={<RutaProtegida tipo="MERCADER" />}>

   Como no recibe `children` sino que dibuja un <Outlet />,
   una sola linea protege un grupo entero de rutas.

   A DONDE REBOTA, Y POR QUE
     sin sesion ..... /login?motivo=entra-primero
     tipo que no es  /login?motivo=sin-permiso
   El motivo viaja en la URL para que el login pueda explicar
   que paso, en vez de aparecer sin mas.

   `replace` evita que la pagina bloqueada quede en el
   historial: si el intruso pulsa "atras", no vuelve a ella.

   `state={{ volverA }}` guarda de donde venia. Todavia no se
   usa, pero deja la puerta abierta a "entra y te devuelvo
   donde estabas".
   ========================================================= */

function RutaProtegida({ tipo }) {
  const { usuario } = useAuth()
  const ubicacion = useLocation()
  const volverA = ubicacion.pathname + ubicacion.search

  if (!usuario) {
    return <Navigate to="/login?motivo=entra-primero" replace state={{ volverA }} />
  }

  /* Sin `tipo`, basta con tener sesion. Con `tipo`, ademas
     hay que ser de esa clase. */
  if (tipo && usuario.tipo !== tipo) {
    return <Navigate to="/login?motivo=sin-permiso" replace state={{ volverA }} />
  }

  return <Outlet />
}

export default RutaProtegida
