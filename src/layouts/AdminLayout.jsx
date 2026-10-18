import { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { Link, NavLink, Outlet } from 'react-router-dom'

import logo from '../assets/img/logo.png'

/* =========================================================
   AdminLayout — el marco del panel de administracion
   ---------------------------------------------------------
   DUENO: Javier (archivo compartido).

   El menu lateral ("rail") esta escrito una sola vez, en
   ENLACES, y se pinta dos veces: fijo a la izquierda en el
   computador, y dentro de un cajon Offcanvas en el celular.
   Asi no hay dos listas que mantener.

   Cada grupo de ENLACES refleja un area del SQL:
     Catalogo ..... PRODUCTO, MOVIMIENTO_STOCK, AUDITORIA_PRODUCTO
     Personas ..... JUGADOR, MERCADER
     Ventas ....... VENTA

   PENDIENTE (tarea #27): solo los mercaderes deben poder
   entrar aqui. Hoy entra cualquiera que escriba /admin.
   ========================================================= */

const ENLACES = [
  {
    grupo: 'Catalogo',
    items: [
      { to: '/admin/productos', texto: 'Productos' },
      { to: '/admin/movimientos', texto: 'Movimientos de stock' },
      { to: '/admin/auditoria', texto: 'Auditoria' },
    ],
  },
  {
    grupo: 'Personas',
    items: [
      { to: '/admin/jugadores', texto: 'Jugadores' },
      { to: '/admin/mercaderes', texto: 'Mercaderes' },
    ],
  },
  {
    grupo: 'Ventas',
    items: [{ to: '/admin/pedidos', texto: 'Pedidos' }],
  },
]

/* El menu. `onNavegar` sirve para que, en el celular, el cajon
   se cierre al tocar un enlace. */
function Menu({ onNavegar }) {
  return (
    <>
      <NavLink className="navitem" to="/admin" end onClick={onNavegar}>
        Tablero
      </NavLink>

      {ENLACES.map(({ grupo, items }) => (
        <div key={grupo}>
          <p className="rail-group">{grupo}</p>
          {items.map(({ to, texto }) => (
            <NavLink key={to} className="navitem" to={to} onClick={onNavegar}>
              {texto}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="rail-foot">
        <Link className="navitem" to="/" onClick={onNavegar}>
          Volver a la tienda
        </Link>
      </div>
    </>
  )
}

function AdminLayout() {
  const [cajonAbierto, setCajonAbierto] = useState(false)
  const cerrarCajon = () => setCajonAbierto(false)

  /* El panel es la region de Orthanc: acento rojo. Aqui no hay
     CintaRegion, asi que la clase se pone desde el layout. */
  useEffect(() => {
    document.body.classList.add('region-orthanc')
    return () => document.body.classList.remove('region-orthanc')
  }, [])

  const marca = (
    <div className="rail-brand">
      <img className="rail-logo" src={logo} alt="" width="30" height="30" />
      <p className="rail-mark">Middle Earth</p>
      <h1>Administracion</h1>
      <p className="sub">El consejo del reino</p>
    </div>
  )

  return (
    <div className="admin-layout">

      {/* Menu fijo: visible desde 992 px (styles.css, seccion 12) */}
      <aside className="rail">
        {marca}
        <Menu />
      </aside>

      {/* La otra columna de la rejilla. La clase admin-col le
          pone min-width:0: sin eso, una tabla ancha estira la
          columna y desborda la pagina en el celular. */}
      <div className="admin-col">
        <div className="admin-bar">
          <Button variant="linea" size="sm" onClick={() => setCajonAbierto(true)}>
            Menu
          </Button>
          <span className="rail-mark">Administracion</span>
        </div>

        <Offcanvas show={cajonAbierto} onHide={cerrarCajon}>
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title className="rail-mark">Administracion</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="rail">
            <Menu onNavegar={cerrarCajon} />
          </Offcanvas.Body>
        </Offcanvas>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>

    </div>
  )
}

export default AdminLayout
