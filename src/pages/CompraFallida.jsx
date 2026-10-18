import Alert from 'react-bootstrap/Alert'
import Container from 'react-bootstrap/Container'
import { Link, useLocation } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'

/* Compra fallida — Anexo 1, vista "PAGO CON ERROR"
   ---------------------------------------------------------
   EL CARRITO NO SE PIERDE
   Cuando el pago se rechaza, la venta sigue ABIERTA y el
   stock sigue descontado a nombre del jugador. Por eso aqui
   no se toca nada: solo se explica y se ofrece reintentar.
   Volver a /checkout encuentra el carrito tal cual estaba.

   EL MENSAJE VIENE DEL QUE FALLO
   Si lo rechazo el pagare, lo dice Checkout. Si lo rechazo
   una regla del SQL (venta sin productos, venta ya cerrada),
   el texto es el que devolvio ventaService, el mismo que
   defiende el script de Oracle. Aqui no se inventa ninguno,
   solo hay uno de respaldo por si se entra sin pasar por el
   checkout. */

function CompraFallida() {
  const { state } = useLocation()
  const error = state?.error ?? 'No se pudo completar el pago.'

  return (
    <>
      <CintaRegion region="orthanc" nombre="Orthanc" subtitulo="La torre no responde" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <header className="page-head">
          <p className="eyebrow">Pago rechazado</p>
          <h1>No se pudo pagar</h1>
          <p className="lede">El trato no se cerro. Tu carrito sigue intacto.</p>
        </header>

        <Alert variant="danger">{error}</Alert>

        <div className="empty-state">
          <p>Nada se cobro y ningun objeto se perdio. Puedes intentarlo otra vez.</p>
          <div className="btn-row">
            <Link className="btn btn-oro" to="/checkout">Reintentar el pago</Link>
            <Link className="btn btn-linea" to="/carrito">Volver al carrito</Link>
          </div>
        </div>
      </Container>
    </>
  )
}

export default CompraFallida
