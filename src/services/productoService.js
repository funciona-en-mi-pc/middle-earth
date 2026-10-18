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
     MOVIMIENTO_STOCK. Aqui el equivalente sera
     inventarioService.js (tareas #22 y #42).

     Crear, editar y borrar productos llegan en la tarea #32.
   ========================================================= */

import { CLAVES, leer } from './storage.js'


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
