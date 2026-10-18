import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'

/* =========================================================
   Footer — el pie de la tienda
   ---------------------------------------------------------
   DUENO: Javier (archivo compartido).

   La rejilla de Bootstrap en una linea:
     <Row>  .... una fila
     <Col>  .... una columna
     lg={5} .... ocupa 5 de las 12 columnas DESDE 992 px
   Sin lg, cada Col ocupa el ancho completo. Por eso en el
   celular la marca queda arriba y los enlaces abajo, y en el
   computador quedan lado a lado.

   El enlace al panel no se esconde aqui: eso lo hara la
   tarea #27 (rutas protegidas), que es quien decide permisos.
   ========================================================= */

function Footer() {
  return (
    <footer className="site-footer">
      <Container fluid="xxl" className="px-3 px-lg-4">
        <Row className="gy-3 align-items-center">

          <Col lg={5}>
            <span className="foot-marca">Middle Earth</span>
            <span className="foot-nota">The Lost Age · Reino de fantasia epica</span>
          </Col>

          <Col lg={7}>
            <nav className="foot-links">
              <Link to="/">Inicio</Link>
              <Link to="/catalogo">Mercado</Link>
              <Link to="/mis-pedidos">Mis pedidos</Link>
              <Link to="/admin">Administracion</Link>
            </nav>
          </Col>

        </Row>
      </Container>
    </footer>
  )
}

export default Footer
