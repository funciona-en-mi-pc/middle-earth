import { Link } from 'react-router-dom'

import { nombreCategoria, rutaImagen } from '../services/productoService.js'
import { formatearOro } from '../utils/formatos.js'
import { ofertaDe, precioAntes } from '../utils/oferta.js'
import { claseRareza, nombreRareza } from '../utils/rareza.js'

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

   EL FILO DE ARRIBA LLEVA EL COLOR DE LA RAREZA
   La rareza no esta en el SQL: se deriva del nivel requerido
   (ver utils/rareza.js). Asi se recupera el detalle visual
   del mockup sin inventar una columna.

   LA OFERTA
   El descuento no esta en el SQL: se deriva del stock (ver
   utils/oferta.js). OJO: el precio del producto YA es el
   rebajado, porque es el que ventaService copia a la boleta
   (regla 8). Lo tachado es el precio ANTERIOR, reconstruido.
   Asi la ficha y la boleta nunca se contradicen.

   LA IMAGEN
   Cada objeto tiene su ilustracion en vitral, hecha en
   Leonardo. Antes iba atenuada con el sello de la categoria
   encima, porque las fotos del mockup no calzaban con los
   objetos; con arte propio, el sello sobraba.

   Las clases vienen de styles.css (seccion 7).
   ========================================================= */

function ProductoCard({ producto, nivelJugador }) {
  const agotado = producto.stock <= 0
  const descuento = ofertaDe(producto)
  const antes = precioAntes(producto)
  const sinNivel = nivelJugador !== undefined && nivelJugador < producto.nivelRequerido

  return (
    <article className={`item-card ${claseRareza(producto)}`}>

      <Link to={`/productos/${producto.productoId}`} className="item-thumb">
        {/* loading="lazy" evita descargar las imagenes que
            todavia no se ven al bajar por el catalogo. */}
        <img src={rutaImagen(producto)} alt="" loading="lazy" />
        {descuento > 0 && <span className="item-oferta">-{descuento}%</span>}
      </Link>

      <span className="item-categoria">
        {nombreCategoria(producto.categoriaId)}
        <small>{nombreRareza(producto)}</small>
      </span>

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
        {antes !== null && (
          <s className="item-antes">{formatearOro(antes)}</s>
        )}
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
