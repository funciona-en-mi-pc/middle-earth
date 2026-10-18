import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'

import CintaRegion from '../components/CintaRegion.jsx'
import ProductoCard from '../components/ProductoCard.jsx'
import { useAuth } from '../context/useAuth.js'
import { listarProductos } from '../services/productoService.js'
import { enOferta, ofertaDe } from '../utils/oferta.js'

/* Ofertas — Anexo 1, vista "OFERTAS"
   ---------------------------------------------------------
   LA LIQUIDACION DEL MERCADER
   El SQL no tiene columna de descuento, asi que la oferta se
   DERIVA del stock: lo que sobra, se liquida. Toda esa regla
   vive en utils/oferta.js, igual que la rareza vive en
   utils/rareza.js. Esta pagina solo filtra y ordena.

   NO HAY SERVICE NUEVO
   Pide el catalogo activo con listarProductos y lo filtra
   aqui mismo. Meter la oferta en productoService seria
   ensuciar la capa de datos con una regla que no existe en
   la base de datos.

   REGLA 3: igual que el catalogo, si quien mira es un jugador
   la ficha le avisa cuando no le alcanza el nivel. */

function Ofertas() {
  const { usuario } = useAuth()
  const nivelJugador = usuario?.tipo === 'JUGADOR' ? usuario.nivel : undefined

  /* De mayor descuento a menor: lo mas rebajado primero. */
  const productos = listarProductos({ soloActivos: true })
    .filter(enOferta)
    .sort((a, b) => ofertaDe(b) - ofertaDe(a))

  return (
    <>
      <CintaRegion region="comarca" nombre="La Comarca" subtitulo="Lo que al mercader le sobra" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <header className="page-head">
          <p className="eyebrow">Liquidacion</p>
          <h1>Ofertas</h1>
          <p className="lede">
            Cuando a un mercader se le acumula la mercaderia, baja el precio. Aqui esta lo
            que hoy sale mas barato que ayer.
          </p>
        </header>

        {productos.length === 0 ? (
          <p className="empty-state">Hoy el mercader no rebaja nada. Vuelve manana.</p>
        ) : (
          <Row xs={1} sm={2} lg={4} className="g-4 pb-5">
            {productos.map((producto) => (
              <Col key={producto.productoId}>
                <ProductoCard producto={producto} nivelJugador={nivelJugador} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  )
}

export default Ofertas
