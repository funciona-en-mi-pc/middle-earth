import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import NavbarBs from 'react-bootstrap/Navbar'
import { Link, NavLink } from 'react-router-dom'

import logo from '../assets/img/logo.png'

/* =========================================================
   Navbar — la navegacion de la tienda
   ---------------------------------------------------------
   DUENO: Javier. Es un archivo compartido, asi que solo se
   toca en las reuniones de hito o avisando al otro.

   DE DONDE SALE CADA COSA
     NavbarBs ... el <Navbar> de react-bootstrap. Se importa
                  con otro nombre para no chocar con el
                  nombre de este componente.
     NavLink .... enlace de react-router que se marca solo con
                  la clase "active" cuando su ruta es la
                  actual. Reemplaza el <a href="x.html"> del
                  mockup: cambia de pagina SIN recargar.
     Link ....... igual, pero sin marcarse como activo.

   expand="lg" es lo que hace el menu responsivo: sobre 992 px
   se ve en linea, y debajo se colapsa en el boton de las tres
   rayas.

   PENDIENTE (tarea #11): mostrar quien tiene la sesion abierta
   y el boton de cerrar sesion. Por ahora siempre se ven los
   enlaces de visitante.
   ========================================================= */

function Navbar() {
  return (
    <NavbarBs expand="lg" className="site-nav sticky-top">
      <Container fluid="xxl" className="px-3 px-lg-4">

        <NavbarBs.Brand as={Link} to="/" className="marca">
          <img className="marca-sello" src={logo} alt="Sello de Middle Earth" width="30" height="30" />
          <span className="marca-texto">Middle Earth</span>
        </NavbarBs.Brand>

        <NavbarBs.Toggle aria-controls="menu-principal" aria-label="Abrir menu" />

        <NavbarBs.Collapse id="menu-principal">
          <Nav className="mx-lg-auto">
            <Nav.Link as={NavLink} to="/" end>Inicio</Nav.Link>
            <Nav.Link as={NavLink} to="/catalogo">Mercado</Nav.Link>
          </Nav>

          <div className="nav-acciones">
            <NavLink className="nav-sesion" to="/login">Iniciar sesion</NavLink>
            <Link className="btn btn-linea btn-sm" to="/registro">Crear cuenta</Link>
            <Link className="btn-carrito" to="/carrito" aria-label="Ver carrito">
              Carrito <span className="cart-count">0</span>
            </Link>
          </div>
        </NavbarBs.Collapse>

      </Container>
    </NavbarBs>
  )
}

export default Navbar
