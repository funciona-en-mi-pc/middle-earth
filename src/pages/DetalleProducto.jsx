import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import { Link, useParams } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import { useAuth } from '../context/useAuth.js'
import {
  nombreCategoria,
  obtenerProducto,
  rutaImagen,
} from '../services/productoService.js'
import { agregarProducto, obtenerOCrearVentaAbierta } from '../services/ventaService.js'
import { formatearOro } from '../utils/formatos.js'

/* Detalle del objeto — DUENO: Jose · tarea #21
   ---------------------------------------------------------
   La ficha completa de un producto y el boton de comprar.

   DE DONDE SALE EL PRODUCTO
   useParams lee el :id de la ruta /productos/:id. Llega como
   TEXTO, y obtenerProducto se encarga de convertirlo.

   LAS TRES RAZONES POR LAS QUE NO SE PUEDE COMPRAR
     no hay sesion ....... se invita a entrar
     falta nivel ......... regla 3 del SQL
     no queda stock ...... regla 2 del SQL
   Las tres se avisan ANTES de pulsar el boton, pero igual se
   vuelven a comprobar en ventaService: la pagina no es quien
   manda, solo adelanta el mensaje.

   POR QUE EL PRODUCTO NO ESTA EN useState
   Se LEE en cada dibujado, porque es un dato derivado del id
   de la URL, no algo que esta pagina edite. Al comprar, el
   setAlerta del final ya provoca un nuevo dibujado, asi que el
   stock de la pantalla baja solo: no hace falta guardar nada
   ni forzar recargas. */

function DetalleProducto() {
  const { id } = useParams()
  const { usuario } = useAuth()

  const [cantidad, setCantidad] = useState(1)
  const [alerta, setAlerta] = useState(null)

  const producto = obtenerProducto(id)

  if (!producto) {
    return (
      <>
        <CintaRegion region="erebor" nombre="Erebor" subtitulo="La forja de los enanos" />
        <Container fluid="xxl" className="px-3 px-lg-4">
          <header className="page-head">
            <h1>Objeto no encontrado</h1>
            <p className="lede">Ese objeto no existe en el mercado del reino.</p>
          </header>
          <Link className="btn btn-linea" to="/catalogo">Volver al mercado</Link>
        </Container>
      </>
    )
  }

  const esJugador = usuario?.tipo === 'JUGADOR'
  const sinNivel = esJugador && usuario.nivel < producto.nivelRequerido
  const agotado = producto.stock <= 0
  const puedeComprar = esJugador && !sinNivel && !agotado

  const comprar = () => {
    /* El carrito es la venta ABIERTA del jugador: si ya tiene
       una se reutiliza, y si no se abre. */
    const carrito = obtenerOCrearVentaAbierta(usuario.id)
    if (!carrito.ok) {
      setAlerta({ tipo: 'danger', texto: carrito.error })
      return
    }

    const intento = agregarProducto(carrito.venta.ventaId, producto.productoId, cantidad)
    if (!intento.ok) {
      setAlerta({ tipo: 'danger', texto: intento.error })
      return
    }

    /* Este setAlerta hace dos cosas: muestra el aviso y, de
       paso, vuelve a dibujar la pagina con el stock ya bajado. */
    setAlerta({ tipo: 'success', texto: `${producto.nombre} agregado al carrito.` })
  }

  return (
    <>
      <CintaRegion region="erebor" nombre="Erebor" subtitulo="La forja de los enanos" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <p className="migas">
          <Link to="/catalogo">Mercado</Link> · {nombreCategoria(producto.categoriaId)}
        </p>

        <Row className="g-4 g-lg-5 detalle">
          <Col lg={6}>
            <div className="detalle-marco">
              <img src={rutaImagen(producto)} alt={producto.nombre} />
            </div>
          </Col>

          <Col lg={6}>
            <p className="eyebrow">{nombreCategoria(producto.categoriaId)}</p>
            <h1>{producto.nombre}</h1>

            <p className="detalle-precio">
              <span className="coin" aria-hidden="true"></span>
              {formatearOro(producto.precio)}
            </p>

            <dl className="detalle-datos">
              <div>
                <dt>Nivel requerido</dt>
                <dd>{producto.nivelRequerido}</dd>
              </div>
              <div>
                <dt>Unidades disponibles</dt>
                {/* El stock que se muestra es el RESTANTE, no el
                    de fabrica: lo que ya se vendio esta descontado. */}
                <dd>{agotado ? 'Agotado' : producto.stock}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{producto.estado}</dd>
              </div>
            </dl>

            {alerta && <Alert variant={alerta.tipo}>{alerta.texto}</Alert>}

            {!usuario && (
              <Alert variant="danger">
                Para comprar, <Link to="/login?motivo=compra">inicia sesion</Link>.
              </Alert>
            )}

            {usuario && !esJugador && (
              <Alert variant="danger">
                Los mercaderes no compran en la tienda, solo atienden.
              </Alert>
            )}

            {sinNivel && (
              <Alert variant="danger">
                Nivel insuficiente. Tu nivel es {usuario.nivel} y este objeto pide{' '}
                {producto.nivelRequerido}.
              </Alert>
            )}

            {agotado && <Alert variant="danger">No quedan unidades de este objeto.</Alert>}

            <div className="btn-row">
              <Form.Select
                className="detalle-cantidad"
                aria-label="Cantidad"
                value={cantidad}
                onChange={(evento) => setCantidad(Number(evento.target.value))}
                disabled={!puedeComprar}
              >
                {/* Como maximo, lo que queda en stock */}
                {Array.from({ length: Math.min(producto.stock, 10) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Form.Select>

              <Button className="btn-oro" onClick={comprar} disabled={!puedeComprar}>
                Agregar al carrito
              </Button>

              <Link className="btn btn-linea" to="/catalogo">Volver al mercado</Link>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default DetalleProducto
