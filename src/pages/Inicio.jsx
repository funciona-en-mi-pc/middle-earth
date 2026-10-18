import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'

import portada from '../assets/img/portada.jpg'
import CintaRegion from '../components/CintaRegion.jsx'
import ProductoCard from '../components/ProductoCard.jsx'
import { listarCategorias, productosDestacados } from '../services/productoService.js'
import '../styles/tienda.css'

/* =========================================================
   Inicio — la portada de la tienda
   ---------------------------------------------------------
   DUENO: Jose · tarea #15

   Tres partes: la portada, los objetos destacados y las
   cuatro categorias del SQL.

   DISENO RESPONSIVO
   La rejilla de Bootstrap lo resuelve sin media queries:

     <Row xs={1} sm={2} lg={4}>
       1 columna en el celular
       2 en la tablet (desde 576 px)
       4 en el computador (desde 992 px)

   Los datos se leen UNA vez al dibujar. Como el catalogo no
   cambia mientras se mira la portada, no hace falta useState
   ni useEffect: seria complicarlo sin motivo.

   TODO (tarea #20): la ficha sabe avisar cuando a un jugador
   no le alcanza el nivel; basta pasarle nivelJugador. Se hara
   en el catalogo, cuando la sesion de Javier este en main.
   ========================================================= */

function Inicio() {
  const destacados = productosDestacados(4)
  const categorias = listarCategorias()

  return (
    <>
      <CintaRegion region="rivendel" nombre="Rivendel" subtitulo="El ultimo hogar acogedor" />

      {/* --- Portada --- */}
      <Container fluid="xxl" className="px-3 px-lg-4">
        <Row className="align-items-center g-4 g-lg-5 portada">
          <Col lg={6}>
            <p className="eyebrow">Middle Earth · The Lost Age</p>
            <h1>El mercado de los heroes</h1>
            <p className="lede">
              Armas forjadas bajo la montana, armaduras de mithril, pociones elficas
              y baculos que guardan el fuego de los Istari. Todo lo que un heroe
              necesita antes de partir.
            </p>
            <div className="btn-row">
              <Link className="btn btn-oro" to="/catalogo">Entrar al mercado</Link>
              <Link className="btn btn-linea" to="/registro">Crear mi heroe</Link>
            </div>
          </Col>

          <Col lg={6}>
            <div className="portada-marco">
              <img src={portada} alt="La Comunidad cruzando la cresta de la montana" />
            </div>
          </Col>
        </Row>
      </Container>

      {/* --- Objetos destacados --- */}
      <Container fluid="xxl" className="px-3 px-lg-4">
        <section className="section">
          <p className="eyebrow">Del taller del herrero</p>
          <h2>Objetos destacados</h2>

          <Row xs={1} sm={2} lg={4} className="g-4 mt-1">
            {destacados.map((producto) => (
              <Col key={producto.productoId}>
                <ProductoCard producto={producto} />
              </Col>
            ))}
          </Row>

          <div className="btn-row">
            <Link className="btn btn-linea" to="/catalogo">Ver los ocho objetos</Link>
          </div>
        </section>
      </Container>

      {/* --- Categorias --- */}
      <Container fluid="xxl" className="px-3 px-lg-4">
        <section className="section sin-filete">
          <p className="eyebrow">Que buscas</p>
          <h2>Las cuatro artes</h2>

          <Row xs={1} sm={2} lg={4} className="g-4 mt-1">
            {categorias.map((categoria) => (
              <Col key={categoria.categoriaId}>
                {/* El catalogo lee este parametro de la URL
                    para abrirse ya filtrado. */}
                <Link className="kpi d-block" to={`/catalogo?categoria=${categoria.categoriaId}`}>
                  <span className="n">{categoria.nombre}</span>
                  <span className="l">Ver todo</span>
                </Link>
              </Col>
            ))}
          </Row>
        </section>
      </Container>
    </>
  )
}

export default Inicio
