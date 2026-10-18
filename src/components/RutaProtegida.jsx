import Alert from 'react-bootstrap/Alert'
import Container from 'react-bootstrap/Container'
import { Link, Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../context/useAuth.js'
import CintaRegion from './CintaRegion.jsx'

/* =========================================================
   RutaProtegida — el portero de las rutas
   ---------------------------------------------------------
   DUENO: Javier · tarea #27

   Es el equivalente de exigirAdministrador(), la funcion del
   mockup de la etapa 1 que se llamaba en el <head> de cada
   pagina del panel para rebotar al intruso ANTES de pintar
   nada.

   USO, en App.jsx: envuelve a las rutas que protege.

     <Route element={<RutaProtegida />}>            cualquiera con sesion
     <Route element={<RutaProtegida tipo="JUGADOR" />}>
     <Route element={<RutaProtegida tipo="MERCADER" />}>

   Como no recibe `children` sino que dibuja un <Outlet />,
   una sola linea protege un grupo entero de rutas.

   DOS CASOS DISTINTOS, DOS RESPUESTAS DISTINTAS

   1. NO HAY SESION -> al login.
      El motivo viaja en la URL para que el login explique por
      que se llego ahi, en vez de aparecer sin mas.
      `replace` evita que la pagina bloqueada quede en el
      historial: si el intruso pulsa "atras", no vuelve a ella.

   2. HAY SESION PERO EL TIPO NO CALZA -> se EXPLICA aqui.
      Antes tambien se mandaba al login, pero el mensaje no se
      llegaba a ver nunca: el login, al detectar que ya hay
      sesion, redirige de inmediato. Lo descubrio una revision
      del codigo. Ahora la pagina dice que paso y ofrece la
      salida que si le corresponde a ese usuario.
   ========================================================= */

/* A donde pertenece cada quien */
const INICIO = { JUGADOR: '/', MERCADER: '/admin' }
const NOMBRE_ZONA = { JUGADOR: 'la tienda', MERCADER: 'el panel' }

function RutaProtegida({ tipo }) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login?motivo=entra-primero" replace />
  }

  /* Sin `tipo`, basta con tener sesion. Con `tipo`, ademas
     hay que ser de esa clase. */
  if (tipo && usuario.tipo !== tipo) {
    return (
      <>
        <CintaRegion region="orthanc" nombre="Orthanc" subtitulo="Aqui no se te espera" />
        <Container fluid="xxl" className="px-3 px-lg-4">
          <header className="page-head">
            <p className="eyebrow">Sin permiso</p>
            <h1>Esta puerta no es para ti</h1>
          </header>

          <Alert variant="danger">
            Esta zona es solo para {tipo === 'JUGADOR' ? 'jugadores' : 'mercaderes'}, y tu
            cuenta es de {usuario.tipo === 'JUGADOR' ? 'jugador' : 'mercader'}.
          </Alert>

          <div className="btn-row pb-5">
            <Link className="btn btn-oro" to={INICIO[usuario.tipo]}>
              Volver a {NOMBRE_ZONA[usuario.tipo]}
            </Link>
            <Link className="btn btn-linea" to="/perfil">Ver mi perfil</Link>
          </div>
        </Container>
      </>
    )
  }

  return <Outlet />
}

export default RutaProtegida
