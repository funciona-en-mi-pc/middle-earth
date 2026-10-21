import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import NavbarBs from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { Link, NavLink } from 'react-router-dom'

import Sello from './Sello.jsx'
import { useAuth, useSalir } from '../context/useAuth.js'
import { cantidadItemsCarrito } from '../services/ventaService.js'

/* =========================================================
   Navbar — la navegacion de la tienda
   ---------------------------------------------------------
   DUENO: Javier. Archivo compartido: solo se toca en las
   reuniones de hito o avisando al otro.

   La parte derecha cambia segun quien tenga la sesion:

     nadie ....... Iniciar sesion · Crear cuenta · Carrito
     JUGADOR ..... nombre y nivel · Mis pedidos · Perfil ·
                   Cerrar sesion · Carrito
     MERCADER .... nombre y cargo · Panel · Perfil ·
                   Cerrar sesion

   El mercader NO ve el carrito: en el SQL, VENTA.jugador_id
   es NOT NULL, asi que siempre compra un jugador.

   EL CONTADOR DEL CARRITO
   Sale de ventaService.cantidadItemsCarrito(), de Jose. El
   carrito es la venta ABIERTA del jugador, asi que el numero
   es la suma de las unidades de su detalle.

   Se lee en cada dibujado: al entrar, al salir y al volver de
   comprar, la navbar se redibuja y el numero ya viene bien.

   Lee la sesion con useAuth, nunca de localStorage. Por eso
   la navbar se actualiza sola al entrar o salir, sin recargar.

   expand="lg" es lo que la hace responsiva: sobre 992 px el
   menu va en linea y debajo se colapsa en el boton de las
   tres rayas.
   ========================================================= */

function Navbar() {
  const { usuario } = useAuth()
  const salir = useSalir()

  const enCarrito = usuario?.tipo === 'JUGADOR' ? cantidadItemsCarrito(usuario.id) : 0

  return (
    <NavbarBs expand="xl" className="site-nav sticky-top">
      <Container fluid="xxl" className="px-3 px-lg-4">

        <NavbarBs.Brand as={Link} to="/" className="marca">
          <Sello className="marca-sello" />
          <span className="marca-texto">Middle Earth</span>
        </NavbarBs.Brand>

        <NavbarBs.Toggle aria-controls="menu-principal" aria-label="Abrir menu" />

        <NavbarBs.Collapse id="menu-principal">
          <Nav className="mx-xl-auto">
            <Nav.Link as={NavLink} to="/" end>Inicio</Nav.Link>
            <Nav.Link as={NavLink} to="/catalogo">Mercado</Nav.Link>
            <Nav.Link as={NavLink} to="/categorias">Categorias</Nav.Link>
            <Nav.Link as={NavLink} to="/ofertas">Ofertas</Nav.Link>
          </Nav>

          <div className="nav-acciones">

            {!usuario && (
              <>
                <NavLink className="nav-sesion" to="/login">Iniciar sesion</NavLink>
                <Link className="btn btn-linea btn-sm" to="/registro">Crear cuenta</Link>
              </>
            )}

            {/* Las acciones de la cuenta van en un desplegable bajo el
                nombre: con cinco enlaces sueltos la barra no cabia en
                una linea y el carrito saltaba a la siguiente. */}
            {usuario && (
              <NavDropdown
                id="menu-cuenta"
                className="nav-cuenta"
                align="end"
                title={
                  <span className="nav-usuario">
                    <span className="nav-usuario-marca" aria-hidden="true">
                      <span>{usuario.nombre.charAt(0).toUpperCase()}</span>
                    </span>
                    {usuario.nombre}
                    <small>
                      {usuario.tipo === 'JUGADOR' ? `Nivel ${usuario.nivel}` : usuario.cargo}
                    </small>
                  </span>
                }
              >
                {/* El correo va aqui y no como title del nombre: dentro
                    del boton, el lector de pantalla lo leia en lugar
                    del nombre. */}
                <NavDropdown.Header>{usuario.email}</NavDropdown.Header>
                {usuario.tipo === 'MERCADER'
                  ? <NavDropdown.Item as={NavLink} to="/admin">Panel</NavDropdown.Item>
                  : <NavDropdown.Item as={NavLink} to="/mis-pedidos">Mis pedidos</NavDropdown.Item>}
                <NavDropdown.Item as={NavLink} to="/perfil">Perfil</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as="button" onClick={salir}>Cerrar sesion</NavDropdown.Item>
              </NavDropdown>
            )}

            {/* Solo los jugadores compran */}
            {(!usuario || usuario.tipo === 'JUGADOR') && (
              <Link className="btn-carrito" to="/carrito" aria-label="Ver carrito">
                {/* La `key` cambia con el numero: React vuelve a
                    crear el span y la animacion se dispara sola. */}
                Carrito <span className="cart-count" key={enCarrito}>{enCarrito}</span>
              </Link>
            )}

          </div>
        </NavbarBs.Collapse>

      </Container>
    </NavbarBs>
  )
}

export default Navbar
