import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import { useAuth } from '../context/useAuth.js'
import { nombreRaza } from '../services/jugadorService.js'
import { ventasConfirmadasDe, ventasDeJugador } from '../services/ventaService.js'

/* Mi perfil — DUENO: Javier · tarea #25
   ---------------------------------------------------------
   Muestra los datos de quien tiene la sesion abierta. Como el
   SQL tiene DOS tablas de personas, la pagina ensena cosas
   distintas segun el tipo:

     JUGADOR ... raza, nivel y cuanto ha comprado
     MERCADER .. cargo y que puede hacer en el panel

   No hace falta comprobar si hay sesion: de eso se encarga
   RutaProtegida en App.jsx. Aqui `usuario` siempre existe.

   La raza se pide por su id a jugadorService y no se guarda
   en la sesion, porque RAZA es un catalogo aparte: si manana
   cambia un nombre, la pagina lo muestra solo. */

function Perfil() {
  const { usuario } = useAuth()
  const esJugador = usuario.tipo === 'JUGADOR'

  return (
    <>
      <CintaRegion region="minas-tirith" nombre="Minas Tirith" subtitulo="La ciudadela blanca" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <header className="page-head">
          <p className="eyebrow">{esJugador ? 'Heroe del reino' : 'Personal de la tienda'}</p>
          <h1>{usuario.nombre}</h1>
          <p className="lede">{usuario.email}</p>
        </header>

        <Row xs={1} sm={2} lg={4} className="g-4 pb-4">
          {esJugador ? (
            <>
              <Col>
                <div className="kpi">
                  <span className="n">{usuario.nivel}</span>
                  <span className="l">Nivel</span>
                </div>
              </Col>
              <Col>
                <div className="kpi">
                  <span className="n">{nombreRaza(usuario.razaId)}</span>
                  <span className="l">Linaje</span>
                </div>
              </Col>
              <Col>
                <div className="kpi">
                  {/* Como FN_VENTAS_JUGADOR: solo las CONFIRMADAS */}
                  <span className="n">{ventasConfirmadasDe(usuario.id)}</span>
                  <span className="l">Compras confirmadas</span>
                </div>
              </Col>
              <Col>
                <div className="kpi">
                  <span className="n">{ventasDeJugador(usuario.id).length}</span>
                  <span className="l">Pedidos en total</span>
                </div>
              </Col>
            </>
          ) : (
            <>
              <Col>
                <div className="kpi">
                  <span className="n">{usuario.cargo}</span>
                  <span className="l">Cargo</span>
                </div>
              </Col>
              <Col>
                <div className="kpi">
                  {/* Solo el ADMINISTRADOR puede crear, editar y borrar */}
                  <span className="n">{usuario.cargo === 'ADMINISTRADOR' ? 'Si' : 'No'}</span>
                  <span className="l">Puede administrar</span>
                </div>
              </Col>
            </>
          )}
        </Row>

        <div className="btn-row pb-5">
          {esJugador ? (
            <>
              <Link className="btn btn-oro" to="/mis-pedidos">Ver mis pedidos</Link>
              <Link className="btn btn-linea" to="/catalogo">Ir al mercado</Link>
            </>
          ) : (
            <Link className="btn btn-oro" to="/admin">Ir al panel</Link>
          )}
        </div>
      </Container>
    </>
  )
}

export default Perfil
