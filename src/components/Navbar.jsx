import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import NavbarBs from 'react-bootstrap/Navbar'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import logo from '../assets/img/logo.png'
import { useAuth } from '../context/useAuth.js'
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
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const enCarrito = usuario?.tipo === 'JUGADOR' ? cantidadItemsCarrito(usuario.id) : 0

  const salir = () => {
    logout()
    navigate('/')
  }

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

            {usuario && (
              <>
                {/* title= deja ver el correo al pasar el raton */}
                <span className="nav-usuario" title={usuario.email}>
                  <span className="nav-usuario-marca">
                    <span>{usuario.nombre.charAt(0).toUpperCase()}</span>
                  </span>
                  {usuario.nombre}
                  <small>
                    {usuario.tipo === 'JUGADOR' ? `Nivel ${usuario.nivel}` : usuario.cargo}
                  </small>
                </span>

                {usuario.tipo === 'MERCADER'
                  ? <NavLink className="nav-sesion" to="/admin">Panel</NavLink>
                  : <NavLink className="nav-sesion" to="/mis-pedidos">Mis pedidos</NavLink>}

                <NavLink className="nav-sesion" to="/perfil">Perfil</NavLink>

                <button type="button" className="nav-sesion" onClick={salir}>
                  Cerrar sesion
                </button>
              </>
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
