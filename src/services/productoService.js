/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   productoService.js — El catalogo
   ---------------------------------------------------------
   DUENO: Jose · tarea #14

   Refleja las tablas PRODUCTO y CATEGORIA del SQL. Hoy lee de
   localStorage; en la etapa 3 las mismas funciones haran
   fetch a Spring Boot. Las paginas no se enteran del cambio:
   por eso NINGUNA pagina lee localStorage directamente.

   LO QUE NO ESTA AQUI, Y POR QUE
     El stock no se modifica en este archivo. Es la regla de
     diseno del SQL: el stock solo cambia desde
     PKG_INVENTARIO, para que todo movimiento quede en
     MOVIMIENTO_STOCK. Aqui ese papel lo hace
     inventarioService.js.

     Por eso actualizarProducto cambia precio, nivel y estado,
     pero NUNCA el stock, y un producto nuevo nace con stock 0
     y lo recibe con reponerStock: asi hasta su primera
     existencia queda en el historial.
   ========================================================= */

import { auditarCambios } from './auditoriaService.js'
import { CLAVES, guardar, leer, siguienteId } from './storage.js'


/* =========================================================
   CATEGORIAS
   ========================================================= */

export function listarCategorias() {
  return leer(CLAVES.categorias, [])
}

export function nombreCategoria(categoriaId) {
  const categoria = listarCategorias().find((c) => c.categoriaId === Number(categoriaId))
  return categoria ? categoria.nombre : 'Sin categoria'
}


/* =========================================================
   PRODUCTOS
   ========================================================= */

/* Devuelve el catalogo, con filtros opcionales.

   listarProductos()                      todos
   listarProductos({ categoriaId: 1 })    solo armas
   listarProductos({ soloActivos: true }) sin los dados de baja
   listarProductos({ nivelMaximo: 5 })    lo que puede usar Frodo

   El objeto `= {}` del final permite llamarla sin argumentos
   sin que reviente al leer sus propiedades. */
export function listarProductos({ categoriaId, soloActivos = false, nivelMaximo } = {}) {
  let productos = leer(CLAVES.productos, [])

  if (categoriaId !== undefined && categoriaId !== null && categoriaId !== '') {
    productos = productos.filter((p) => p.categoriaId === Number(categoriaId))
  }

  /* Regla 2 del SQL: un producto INACTIVO no se vende, asi que
     tampoco se muestra en la tienda. En el panel si se ve. */
  if (soloActivos) {
    productos = productos.filter((p) => p.estado === 'ACTIVO')
  }

  /* Regla 3 del SQL: el jugador solo compra productos cuyo
     nivel requerido sea menor o igual al suyo. */
  if (nivelMaximo !== undefined && nivelMaximo !== null && nivelMaximo !== '') {
    productos = productos.filter((p) => p.nivelRequerido <= Number(nivelMaximo))
  }

  return productos
}

/* Devuelve el producto o null. El id llega como texto cuando
   viene de la URL (/productos/4), por eso el Number(). */
export function obtenerProducto(id) {
  const buscado = Number(id)
  if (Number.isNaN(buscado)) return null

  return leer(CLAVES.productos, []).find((p) => p.productoId === buscado) ?? null
}

/* Los primeros n productos activos, para la portada. */
export function productosDestacados(n = 4) {
  return listarProductos({ soloActivos: true }).slice(0, n)
}

/* Un producto esta agotado cuando su stock llega a cero.
   Es la mitad del error -20004 del SQL: la otra mitad la
   comprueba inventarioService al descontar. */
export function estaAgotado(producto) {
  return !producto || producto.stock <= 0
}

/* Las ilustraciones viven en public/img/productos/ y se
   llaman por el id del producto (1.jpg ... 8.jpg). Al estar
   en public/ se referencian por su ruta tal cual, sin
   importarlas: asi se pueden reemplazar por otras mejores sin
   tocar ni una linea de codigo. */
export function rutaImagen(producto) {
  return producto?.imagen ? `/img/productos/${producto.imagen}` : ''
}


/* =========================================================
   ALTA — como SP_INSERTAR_PRODUCTO
   Comprueba que la categoria exista (-20015) y crea el
   producto con stock 0.
   ========================================================= */

export function crearProducto({ nombre, categoriaId, precio, nivelRequerido }) {
  if (!listarCategorias().some((c) => c.categoriaId === Number(categoriaId))) {
    return { ok: false, error: 'Categoria inexistente.' }
  }

  const productos = leer(CLAVES.productos, [])
  const id = siguienteId(productos, 'productoId')

  const producto = {
    productoId: id,
    categoriaId: Number(categoriaId),
    nombre: String(nombre ?? '').trim(),
    precio: Number(precio),
    stock: 0,                       // nace vacio: el stock entra por reposicion
    nivelRequerido: Number(nivelRequerido),
    estado: 'ACTIVO',
    imagen: `${id}.jpg`,
  }

  productos.push(producto)
  guardar(CLAVES.productos, productos)

  return { ok: true, producto }
}


/* =========================================================
   EDICION — como SP_ACTUALIZAR_PRODUCTO
   Cambia precio, nivel requerido y estado. NUNCA el stock.

   Al final llama a auditarCambios, que es lo que en el SQL
   hace solo el trigger TR_AUDITAR_PRODUCTO (regla 10). Va
   aqui y no en el formulario para que nadie pueda saltarselo.
   ========================================================= */

export function actualizarProducto(id, cambios = {}) {
  const productos = leer(CLAVES.productos, [])
  const indice = productos.findIndex((p) => p.productoId === Number(id))
  if (indice === -1) return { ok: false, error: 'Producto inexistente.' }

  const antes = productos[indice]

  if (cambios.precio !== undefined) {
    const precio = Number(cambios.precio)
    /* CHECK (precio > 0) de la tabla PRODUCTO */
    if (Number.isNaN(precio) || precio <= 0) {
      return { ok: false, error: 'El precio debe ser mayor que cero.' }
    }
  }

  if (cambios.nivelRequerido !== undefined) {
    const nivel = Number(cambios.nivelRequerido)
    /* CHECK (nivel_requerido > 0) */
    if (!Number.isInteger(nivel) || nivel <= 0) {
      return { ok: false, error: 'El nivel requerido debe ser un entero mayor que cero.' }
    }
  }

  const despues = {
    ...antes,
    ...cambios,
    /* El stock se protege a proposito: aunque llegue en
       `cambios`, se ignora. Solo inventarioService lo mueve. */
    stock: antes.stock,
  }

  if (cambios.precio !== undefined) despues.precio = Number(cambios.precio)
  if (cambios.nivelRequerido !== undefined) despues.nivelRequerido = Number(cambios.nivelRequerido)
  if (cambios.categoriaId !== undefined) despues.categoriaId = Number(cambios.categoriaId)

  productos[indice] = despues
  guardar(CLAVES.productos, productos)

  /* REGLA 10: queda el rastro de lo que cambio */
  auditarCambios(Number(id), antes, despues)

  return { ok: true, producto: despues }
}


/* =========================================================
   BAJA — como SP_ELIMINAR_PRODUCTO
   REGLA 9: un producto con ventas o con movimientos de stock
   NO se borra, porque se perderia el historial. Se deja
   INACTIVO, que lo saca de la tienda sin borrar su pasado.
   ========================================================= */

export function eliminarProducto(id) {
  const productos = leer(CLAVES.productos, [])
  const producto = productos.find((p) => p.productoId === Number(id))
  if (!producto) return { ok: false, error: 'Producto inexistente.' }

  const vendido = leer(CLAVES.detalles, []).some((d) => d.productoId === Number(id))
  const movido = leer(CLAVES.movimientos, []).some((m) => m.productoId === Number(id))

  if (vendido || movido) {
    return {
      ok: false,
      error: 'No se puede eliminar: el producto tiene ventas o movimientos de stock. Dejalo INACTIVO.',
    }
  }

  guardar(CLAVES.productos, productos.filter((p) => p.productoId !== Number(id)))

  return { ok: true }
}

/* La alternativa a borrar. Pasa por actualizarProducto para
   que el cambio de estado quede auditado. */
export function inactivarProducto(id) {
  return actualizarProducto(id, { estado: 'INACTIVO' })
}
