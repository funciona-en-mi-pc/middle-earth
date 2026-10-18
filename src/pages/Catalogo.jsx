import { useState } from 'react'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import { useSearchParams } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import ProductoCard from '../components/ProductoCard.jsx'
import { useAuth } from '../context/useAuth.js'
import { listarCategorias, listarProductos } from '../services/productoService.js'

/* Mercado — DUENO: Jose · tarea #20
   ---------------------------------------------------------
   El catalogo con sus dos filtros, que se combinan con Y:
   "armas que ademas puedo usar".

   EL FILTRO DE CATEGORIA VIVE EN LA URL
   Se guarda con useSearchParams y no con useState. Asi
   /catalogo?categoria=1 se puede compartir, se puede volver
   con el boton "atras" del navegador, y la portada puede
   enlazar directamente a una categoria ya filtrada.

   EL FILTRO DE NIVEL SI ES useState
   Es una preferencia del momento, no vale la pena ponerla en
   la direccion.

   REGLA 2: los productos INACTIVOS no se muestran en la
   tienda. En el panel si se ven, porque alla hay que poder
   reactivarlos. */

function Catalogo() {
  const { usuario } = useAuth()
  const [parametros, setParametros] = useSearchParams()
  const [soloMiNivel, setSoloMiNivel] = useState(false)

  const categorias = listarCategorias()
  const categoriaId = parametros.get('categoria') ?? ''

  /* REGLA 3: el nivel solo se conoce si quien mira es un
     jugador con la sesion abierta. */
  const nivelJugador = usuario?.tipo === 'JUGADOR' ? usuario.nivel : undefined

  const productos = listarProductos({
    categoriaId: categoriaId === '' ? undefined : categoriaId,
    soloActivos: true,
    nivelMaximo: soloMiNivel ? nivelJugador : undefined,
  })

  /* Cambiar de categoria reescribe la URL. Sin valor, se
     quita el parametro y se ven todas. */
  const filtrarPor = (valor) => {
    setParametros(valor === '' ? {} : { categoria: valor })
  }

  return (
    <>
      <CintaRegion region="erebor" nombre="Erebor" subtitulo="El mercado bajo la montana" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <header className="page-head">
          <p className="eyebrow">El mercado</p>
          <h1>Mercado</h1>
          <p className="lede">
            Todo lo que un heroe necesita antes de partir. El precio esta en monedas de oro.
          </p>
        </header>

        <div className="filtros">
          <div className="filtros-grupo">
            <span className="filtros-titulo">Tipo</span>

            <button
              type="button"
              className={`filter-btn${categoriaId === '' ? ' active' : ''}`}
              onClick={() => filtrarPor('')}
            >
              Todas
            </button>

            {categorias.map((categoria) => (
              <button
                key={categoria.categoriaId}
                type="button"
                className={`filter-btn${categoriaId === String(categoria.categoriaId) ? ' active' : ''}`}
                onClick={() => filtrarPor(String(categoria.categoriaId))}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>

          {/* Este filtro solo tiene sentido si sabemos el nivel */}
          {nivelJugador !== undefined && (
            <div className="filtros-grupo">
              <span className="filtros-titulo">Nivel</span>
              <button
                type="button"
                className={`filter-btn${soloMiNivel ? ' active' : ''}`}
                onClick={() => setSoloMiNivel((previo) => !previo)}
              >
                Solo lo que puedo usar (nivel {nivelJugador})
              </button>
            </div>
          )}
        </div>

        {productos.length === 0 ? (
          <p className="empty-state">No hay objetos que cumplan ese filtro.</p>
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

export default Catalogo
