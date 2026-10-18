import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import EmblemaCategoria from '../components/EmblemaCategoria.jsx'
import { listarCategorias, listarProductos } from '../services/productoService.js'
import { formatearOro } from '../utils/formatos.js'

/* Categorias — Anexo 1, vista "CATEGORIAS"
   ---------------------------------------------------------
   LA PUERTA DEL MERCADO
   El diagrama del Anexo pide CATEGORIAS -> CATEGORIA #1. La
   segunda pantalla ya existe: es el catalogo filtrado,
   /catalogo?categoria=1. Por eso esta pagina NO tiene ruta
   propia para cada gremio ni repite la rejilla de fichas:
   solo muestra los cuatro gremios y enlaza al catalogo.

   Es la misma idea que el filtro de la Navbar, pero con
   cara: el filtro ya vivia en la URL (ver Catalogo.jsx), asi
   que enlazar aqui no necesito ni un estado ni un service
   nuevo.

   REGLA 2: se cuentan solo los ACTIVOS, porque es lo que el
   visitante va a encontrar al entrar. */

function Categorias() {
  const categorias = listarCategorias()

  return (
    <>
      <CintaRegion region="bree" nombre="Bree" subtitulo="El cruce de los cuatro caminos" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <header className="page-head">
          <p className="eyebrow">Los gremios</p>
          <h1>Categorias</h1>
          <p className="lede">
            Cuatro gremios abastecen a los heroes de la Tierra Media. Elige el tuyo.
          </p>
        </header>

        <Row xs={1} sm={2} lg={4} className="g-4 pb-5">
          {categorias.map((categoria) => {
            const productos = listarProductos({
              categoriaId: categoria.categoriaId,
              soloActivos: true,
            })

            /* El precio mas bajo del gremio. Math.min sobre un
               arreglo vacio da Infinity, de ahi el guardia. */
            const desde = productos.length > 0
              ? Math.min(...productos.map((p) => p.precio))
              : null

            return (
              <Col key={categoria.categoriaId}>
                <Link
                  className="categoria-card"
                  to={`/catalogo?categoria=${categoria.categoriaId}`}
                >
                  <span className="categoria-sello">
                    <EmblemaCategoria
                      categoriaId={categoria.categoriaId}
                      titulo={categoria.nombre}
                    />
                  </span>

                  <h2 className="categoria-nombre">{categoria.nombre}</h2>

                  <p className="categoria-cuenta">
                    {productos.length === 0
                      ? 'Sin existencias'
                      : `${productos.length} objeto${productos.length === 1 ? '' : 's'}`}
                  </p>

                  {desde !== null && (
                    <p className="categoria-desde">Desde {formatearOro(desde)}</p>
                  )}

                  <span className="btn btn-linea btn-sm">Ver el gremio</span>
                </Link>
              </Col>
            )
          })}
        </Row>
      </Container>
    </>
  )
}

export default Categorias
