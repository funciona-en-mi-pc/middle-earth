import Badge from 'react-bootstrap/Badge'
import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import { Link } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import { useAuth } from '../context/useAuth.js'
import { obtenerProducto } from '../services/productoService.js'
import {
  cantidadProductos,
  detallesDeVenta,
  totalVenta,
  ventasDeJugador,
} from '../services/ventaService.js'
import { formatearFecha, formatearOro } from '../utils/formatos.js'

/* Mis pedidos — DUENO: Javier · tarea #26
   ---------------------------------------------------------
   El historial de compras del jugador: la tabla VENTA con su
   DETALLE_VENTA.

   USA EL ventaService DE JOSE
   ventasDeJugador() ya deja fuera las ventas ABIERTAS, porque
   una venta abierta es el carrito, no un pedido. Por eso aqui
   no hay ningun filtro: el service ya decidio.

   POR QUE SE MUESTRA EL PRECIO DEL DETALLE
   Porque DETALLE_VENTA guarda el precio del dia de la compra
   (regla 8). Si leyeramos el precio actual del producto, al
   subir el precio de la Espada Dardo cambiaria el total de
   las ventas antiguas, y la boleta mentiria. */

/* Cada estado con su color. La clase la define styles.css.
   ABIERTA no aparece: ventasDeJugador() ya deja fuera el
   carrito, asi que aqui solo llegan CONFIRMADA y ANULADA. */
const COLOR_ESTADO = {
  CONFIRMADA: 'ok',
  ANULADA: 'alerta',
}

/* Una fila por cada pedido, con sus lineas debajo. */
function Pedido({ venta }) {
  const lineas = detallesDeVenta(venta.ventaId)

  return (
    <article className="pedido">
      <header className="pedido-cabecera">
        <div>
          <span className="pedido-numero">Pedido ME-{venta.ventaId}</span>
          <span className="pedido-fecha">{formatearFecha(venta.fechaVenta)}</span>
        </div>

        <div className="pedido-derecha">
          <Badge className={COLOR_ESTADO[venta.estado]}>{venta.estado}</Badge>
          <span className="pedido-total">
            <span className="coin" aria-hidden="true"></span>
            {formatearOro(totalVenta(venta.ventaId))}
          </span>
        </div>
      </header>

      {/* responsive hace que la tabla se deslice de lado en el
          celular en vez de desbordar la pagina */}
      <Table responsive className="mb-0">
        <thead>
          <tr>
            <th>Objeto</th>
            <th className="num">Cantidad</th>
            <th className="num">Precio</th>
            <th className="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea) => {
            const producto = obtenerProducto(linea.productoId)

            return (
              <tr key={linea.detalleId}>
                <td>{producto ? producto.nombre : 'Objeto retirado'}</td>
                <td className="num">{linea.cantidad}</td>
                <td className="num">{formatearOro(linea.precioUnitario)}</td>
                <td className="num">{formatearOro(linea.cantidad * linea.precioUnitario)}</td>
              </tr>
            )
          })}
        </tbody>
      </Table>

      <footer className="pedido-pie">
        {cantidadProductos(venta.ventaId)} objeto(s)
        {venta.estado === 'ANULADA' && ' · El oro fue devuelto y el stock repuesto'}
      </footer>
    </article>
  )
}

function MisPedidos() {
  const { usuario } = useAuth()
  const pedidos = ventasDeJugador(usuario.id)

  return (
    <>
      <CintaRegion region="comarca" nombre="La Comarca" subtitulo="El libro de cuentas" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <header className="page-head">
          <p className="eyebrow">Historial</p>
          <h1>Mis pedidos</h1>
          <p className="lede">Todo lo que has comprado en el reino, con el precio del dia.</p>
        </header>

        {pedidos.length === 0 ? (
          <div className="empty-state">
            <p>Todavia no has cerrado ningun pedido.</p>
            <Link className="btn btn-oro" to="/catalogo">Ir al mercado</Link>
          </div>
        ) : (
          <div className="pb-5">
            {/* Los mas nuevos primero: se invierte una copia con
                slice(), para no dar vuelta el arreglo original. */}
            {pedidos.slice().reverse().map((venta) => (
              <Pedido key={venta.ventaId} venta={venta} />
            ))}
          </div>
        )}
      </Container>
    </>
  )
}

export default MisPedidos
