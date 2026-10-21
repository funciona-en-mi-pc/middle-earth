import { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { Link, NavLink, Outlet } from 'react-router-dom'

import Sello from '../components/Sello.jsx'
import { useAuth, useSalir } from '../context/useAuth.js'
import { useArribaAlNavegar } from '../utils/useArribaAlNavegar.js'
import { useTituloDeRuta } from '../utils/useTituloDeRuta.js'

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

/* Iconos de linea en una rejilla de 24, dibujados a mano. El
   trazo toma el color del texto (currentColor), asi que el
   activo se tine solo con el acento. */
const ICONOS = {
  tablero: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  productos: 'M12 3 20 12 12 21 4 12Z',
  movimientos: 'M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4',
  auditoria: 'M6 3h9l3 3v15H6zM9 10h6M9 14h6M9 18h4',
  jugadores: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  mercaderes: 'M5 7c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5',
  pedidos: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  tienda: 'M15 6l-6 6 6 6',
  salir: 'M10 4H5v16h5M14 8l4 4-4 4M18 12H9',
}

function Icono({ nombre }) {
  return (
    <svg className="navitem-icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={ICONOS[nombre]} />
    </svg>
  )
}

/* "Movimientos" a secas: con "de stock" se partia en dos lineas.
   El titulo de la pagina sigue diciendo "Movimientos de stock". */
const ENLACES = [
  {
    grupo: 'Catalogo',
    items: [
      { to: '/admin/productos', texto: 'Productos', icono: 'productos' },
      { to: '/admin/movimientos', texto: 'Movimientos', icono: 'movimientos' },
      { to: '/admin/auditoria', texto: 'Auditoria', icono: 'auditoria' },
    ],
  },
  {
    grupo: 'Personas',
    items: [
      { to: '/admin/jugadores', texto: 'Jugadores', icono: 'jugadores' },
      { to: '/admin/mercaderes', texto: 'Mercaderes', icono: 'mercaderes' },
    ],
  },
  {
    grupo: 'Ventas',
    items: [{ to: '/admin/pedidos', texto: 'Pedidos', icono: 'pedidos' }],
  },
]

/* El menu. `onNavegar` sirve para que, en el celular, el cajon
   se cierre al tocar un enlace. */
function Menu({ onNavegar }) {
  const { usuario } = useAuth()
  const salir = useSalir()

  return (
    <>
      <NavLink className="navitem" to="/admin" end onClick={onNavegar}>
        <Icono nombre="tablero" />Tablero
      </NavLink>

      {ENLACES.map(({ grupo, items }) => (
        <div key={grupo}>
          <p className="rail-group">{grupo}</p>
          {items.map(({ to, texto, icono }) => (
            <NavLink key={to} className="navitem" to={to} onClick={onNavegar}>
              <Icono nombre={icono} />{texto}
            </NavLink>
          ))}
        </div>
      ))}

      {/* Quien esta en el panel, y la salida. Antes solo habia
          "Volver a la tienda": para cerrar sesion habia que salir
          del panel primero. */}
      <div className="rail-foot">
        {usuario && (
          <div className="rail-usuario">
            <span className="rail-usuario-nombre">{usuario.nombre}</span>
            <span className="rail-usuario-rol">{usuario.cargo}</span>
          </div>
        )}
        <Link className="navitem" to="/" onClick={onNavegar}>
          <Icono nombre="tienda" />Volver a la tienda
        </Link>
        <button type="button" className="navitem" onClick={salir}>
          <Icono nombre="salir" />Cerrar sesion
        </button>
      </div>
    </>
  )
}

function AdminLayout() {
  useTituloDeRuta()
  useArribaAlNavegar()

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
      <Sello className="rail-logo" tamano={34} />
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
