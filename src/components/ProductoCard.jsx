import { Link } from 'react-router-dom'

import { nombreCategoria, rutaImagen } from '../services/productoService.js'
import { formatearOro } from '../utils/formatos.js'

/* =========================================================
   ProductoCard — la ficha de un objeto del catalogo
   ---------------------------------------------------------
   DUENO: Jose · tarea #15

   Se usa en la portada, en el mercado y donde haga falta. Por
   eso no sabe nada de filtros ni de paginas: recibe un
   producto por props y lo pinta.

   PROPS
     producto ....... una fila de PRODUCTO
     nivelJugador ... opcional. Si se pasa y no alcanza, la
                      ficha avisa (regla 3 del SQL)

   Las clases vienen de styles.css (seccion 7): item-card,
   item-thumb, item-name, item-meta, item-price y coin.
   ========================================================= */

function ProductoCard({ producto, nivelJugador }) {
  const agotado = producto.stock <= 0
  const sinNivel = nivelJugador !== undefined && nivelJugador < producto.nivelRequerido

  return (
    <article className="item-card">

      <Link to={`/productos/${producto.productoId}`} className="item-thumb">
        {/* loading="lazy" evita descargar las imagenes que
            todavia no se ven al bajar por el catalogo. */}
        <img src={rutaImagen(producto)} alt={producto.nombre} loading="lazy" />
      </Link>

      <span className="item-categoria">{nombreCategoria(producto.categoriaId)}</span>

      <Link to={`/productos/${producto.productoId}`}>
        <h3 className="item-name">{producto.nombre}</h3>
      </Link>

      <div className="item-meta">
        <span>Nivel {producto.nivelRequerido}</span>
        <span>{agotado ? 'Agotado' : `Quedan ${producto.stock}`}</span>
      </div>

      <div className="item-price">
        <span className="coin" aria-hidden="true"></span>
        {formatearOro(producto.precio)}
      </div>

      {sinNivel && (
        <p className="item-aviso">Necesitas nivel {producto.nivelRequerido}</p>
      )}

      <Link
        className="btn btn-linea btn-sm add-btn"
        to={`/productos/${producto.productoId}`}
      >
        Ver objeto
      </Link>

    </article>
  )
}

export default ProductoCard
