import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import { Link, useNavigate } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import { useAuth } from '../context/useAuth.js'
import { obtenerProducto } from '../services/productoService.js'
import {
  anularVenta,
  cantidadProductos,
  confirmarVenta,
  detallesDeVenta,
  totalVenta,
  ventaAbiertaDe,
} from '../services/ventaService.js'
import { formatearOro } from '../utils/formatos.js'

/* Carrito — DUENO: Jose · tarea #30
   ---------------------------------------------------------
   EL CARRITO ES LA VENTA ABIERTA
   No hay una lista aparte: lo que se ve aqui es la venta en
   estado ABIERTA del jugador, con su DETALLE_VENTA. Igual que
   en la base de datos.

   POR ESO EL STOCK YA ESTA DESCONTADO
   Al agregar un objeto desde el detalle, inventarioService ya
   bajo el stock y registro la SALIDA (regla 6). Confirmar
   aqui no vuelve a tocarlo: solo cambia el estado a
   CONFIRMADA. Y vaciar el carrito es ANULAR la venta, que
   devuelve el stock y deja una ENTRADA (regla 7).

   Asi nunca hay stock "reservado" sin registrar, que es
   justamente lo que el historial debe poder explicar.

   La venta se LEE en cada dibujado, no se guarda en estado:
   es un dato que vive en los services. Al vaciar el carrito,
   el setAlerta del final ya provoca un nuevo dibujado, y
   entonces ventaAbiertaDe devuelve null y se ve el mensaje de
   carrito vacio. */

function Carrito() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [alerta, setAlerta] = useState(null)

  /* RutaProtegida ya exige sesion de jugador, pero la pagina
     se defiende sola por si se usa fuera de esa ruta. */
  if (!usuario || usuario.tipo !== 'JUGADOR') {
    return (
      <>
        <CintaRegion region="comarca" nombre="La Comarca" subtitulo="Donde se cierran los tratos" />
        <Container fluid="xxl" className="px-3 px-lg-4">
          <header className="page-head">
            <h1>Carrito</h1>
          </header>
          <Alert variant="danger">
            Para comprar, <Link to="/login?motivo=compra">inicia sesion</Link> como jugador.
          </Alert>
        </Container>
      </>
    )
  }

  const venta = ventaAbiertaDe(usuario.id)
  const lineas = venta ? detallesDeVenta(venta.ventaId) : []

  const pagar = () => {
    const intento = confirmarVenta(venta.ventaId)
    if (!intento.ok) {
      setAlerta({ tipo: 'danger', texto: intento.error })
      return
    }
    navigate('/mis-pedidos')
  }

  const vaciar = () => {
    const intento = anularVenta(venta.ventaId)
    if (!intento.ok) {
      setAlerta({ tipo: 'danger', texto: intento.error })
      return
    }
    /* Este setAlerta avisa y, de paso, redibuja: la venta ya
       no esta ABIERTA, asi que se vera el carrito vacio. */
    setAlerta({ tipo: 'success', texto: 'Carrito vaciado. El stock volvio al mercado.' })
  }

  return (
    <>
      <CintaRegion region="comarca" nombre="La Comarca" subtitulo="Donde se cierran los tratos" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <header className="page-head">
          <p className="eyebrow">Tu zurron</p>
          <h1>Carrito</h1>
          <p className="lede">Revisa lo que llevas antes de cerrar el trato.</p>
        </header>

        {alerta && <Alert variant={alerta.tipo}>{alerta.texto}</Alert>}

        {lineas.length === 0 ? (
          <div className="empty-state">
            <p>Tu carrito esta vacio.</p>
            <Link className="btn btn-oro" to="/catalogo">Ir al mercado</Link>
          </div>
        ) : (
          <div className="pb-5">
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
                        <td>
                          {producto
                            ? <Link to={`/productos/${producto.productoId}`}>{producto.nombre}</Link>
                            : 'Objeto retirado'}
                        </td>
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
                <span className="carrito-items">{cantidadProductos(venta.ventaId)} objeto(s)</span>
                <span className="carrito-total">
                  <span className="coin" aria-hidden="true"></span>
                  {formatearOro(totalVenta(venta.ventaId))}
                </span>
              </div>

              <div className="btn-row">
                <Button className="btn-oro" onClick={pagar}>Confirmar compra</Button>
                <Button className="btn-linea" onClick={vaciar}>Vaciar carrito</Button>
                <Link className="btn btn-linea" to="/catalogo">Seguir comprando</Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </>
  )
}

export default Carrito
