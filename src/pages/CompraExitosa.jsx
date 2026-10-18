import Alert from 'react-bootstrap/Alert'
import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import { Link, useLocation, useParams } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import { obtenerProducto } from '../services/productoService.js'
import { detallesDeVenta, obtenerVenta, totalVenta } from '../services/ventaService.js'
import { formatearFecha, formatearOro } from '../utils/formatos.js'

/* Compra exitosa — Anexo 1, vista "PAGO CORRECTO"
   ---------------------------------------------------------
   LA BOLETA
   El Anexo pide un resumen de la compra. Ese resumen se lee
   de la base: la venta y su DETALLE_VENTA, por el ventaId
   que viene en la URL. Por eso aguanta que recarguen la
   pagina o que guarden el enlace.

   LA DIRECCION VIENE DEL ROUTER, NO DE LA BASE
   VENTA no tiene columna de direccion (ver Checkout.jsx), asi
   que los datos de envio llegan en el state del navigate y se
   muestran solo si estan. Si recargan, la boleta sigue ahi y
   lo unico que falta es el domicilio. Es la parte prescindible.

   NO VUELVE A TOCAR EL STOCK
   El stock se descuenta al agregar al carrito y la venta ya
   quedo CONFIRMADA en el checkout. Esta pagina solo lee. */

function CompraExitosa() {
  const { ventaId } = useParams()
  const { state } = useLocation()

  const venta = obtenerVenta(ventaId)
  const envio = state?.envio

  if (!venta) {
    return (
      <>
        <CintaRegion region="minas-tirith" nombre="Minas Tirith" subtitulo="La casa del tesoro" />
        <Container fluid="xxl" className="px-3 px-lg-4">
          <header className="page-head"><h1>Compra</h1></header>
          <Alert variant="danger">Esa boleta no existe.</Alert>
          <Link className="btn btn-oro" to="/catalogo">Ir al mercado</Link>
        </Container>
      </>
    )
  }

  const lineas = detallesDeVenta(venta.ventaId)

  return (
    <>
      <CintaRegion region="minas-tirith" nombre="Minas Tirith" subtitulo="El trato esta cerrado" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <header className="page-head">
          <p className="eyebrow">Pago aceptado</p>
          <h1>Compra realizada</h1>
          <p className="lede">
            Tu encargo quedo registrado como <strong>ME-{venta.ventaId}</strong>.
          </p>
        </header>

        <Alert variant="success">
          El oro cambio de manos. Ya puedes seguir tu camino.
        </Alert>

        {envio && (
          <div className="table-card p-3 mb-4">
            <h2>Entrega</h2>
            <p className="mb-1">{envio.direccion}, {envio.reino}</p>
            <p className="mb-0"><small>{envio.entrega}</small></p>
          </div>
        )}

        <div className="table-card">
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
        </div>

        <div className="carrito-resumen">
          <div>
            <span className="carrito-items">{formatearFecha(venta.fechaVenta)}</span>
            <span className="carrito-total">
              <span className="coin" aria-hidden="true"></span>
              {formatearOro(totalVenta(venta.ventaId))}
            </span>
          </div>

          <div className="btn-row">
            <Link className="btn btn-oro" to="/mis-pedidos">Ver mis pedidos</Link>
            <Link className="btn btn-linea" to="/catalogo">Seguir comprando</Link>
          </div>
        </div>
      </Container>
    </>
  )
}

export default CompraExitosa
