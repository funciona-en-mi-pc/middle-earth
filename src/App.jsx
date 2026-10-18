import { Route, Routes } from 'react-router-dom'

import AdminLayout from './layouts/AdminLayout.jsx'
import TiendaLayout from './layouts/TiendaLayout.jsx'

import Carrito from './pages/Carrito.jsx'
import Catalogo from './pages/Catalogo.jsx'
import DetalleProducto from './pages/DetalleProducto.jsx'
import Inicio from './pages/Inicio.jsx'
import Login from './pages/Login.jsx'
import MisPedidos from './pages/MisPedidos.jsx'
import NoEncontrado from './pages/NoEncontrado.jsx'
import Perfil from './pages/Perfil.jsx'
import Registro from './pages/Registro.jsx'

import AdminAuditoria from './pages/admin/AdminAuditoria.jsx'
import AdminJugadores from './pages/admin/AdminJugadores.jsx'
import AdminMercaderes from './pages/admin/AdminMercaderes.jsx'
import AdminMovimientos from './pages/admin/AdminMovimientos.jsx'
import AdminPedidos from './pages/admin/AdminPedidos.jsx'
import AdminProductos from './pages/admin/AdminProductos.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'

/* =========================================================
   App — el mapa de la aplicacion
   ---------------------------------------------------------
   ARCHIVO COMPARTIDO: solo se toca en las reuniones de hito.
   Todas las rutas y todas las paginas ya estan creadas, asi
   cada uno rellena su archivo sin pasar por aqui.

   COMO SE LEE
     <Routes> ......... la lista de rutas. Solo una gana.
     <Route element>... una ruta sin `path` que solo aporta
                        marco: las de dentro se dibujan en su
                        <Outlet />. Asi todas las paginas de la
                        tienda comparten navbar y footer.
     path="/admin" .... las rutas de dentro son relativas:
                        "productos" es /admin/productos.
     index ............ la pagina de /admin exacto.
     :id .............. parte variable de la URL. La pagina la
                        lee con useParams().
     path="*" ......... comodin: si ninguna ruta calzo, el 404.
                        Va al final, porque gana la primera
                        que coincide.
   ========================================================= */

function App() {
  return (
    <Routes>

      {/* --- Tienda --- */}
      <Route element={<TiendaLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/productos/:id" element={<DetalleProducto />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>

      {/* --- Panel de administracion --- */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<AdminProductos />} />
        <Route path="movimientos" element={<AdminMovimientos />} />
        <Route path="auditoria" element={<AdminAuditoria />} />
        <Route path="jugadores" element={<AdminJugadores />} />
        <Route path="mercaderes" element={<AdminMercaderes />} />
        <Route path="pedidos" element={<AdminPedidos />} />
      </Route>

    </Routes>
  )
}

export default App
