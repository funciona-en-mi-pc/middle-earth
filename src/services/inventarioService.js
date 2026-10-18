/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   inventarioService.js — El unico sitio donde cambia el stock
   ---------------------------------------------------------
   DUENO: Jose · tareas #22 y #42

   Es el equivalente de PKG_INVENTARIO del SQL, y respeta su
   regla de diseno mas importante:

     EL STOCK SOLO CAMBIA AQUI, Y CADA CAMBIO DEJA UNA FILA EN
     MOVIMIENTO_STOCK.

   Por eso productoService.actualizarProducto NO toca el stock:
   si lo hiciera, ese cambio no quedaria en el historial y el
   stock dejaria de cuadrar con los movimientos.

   POR QUE NO SE HIZO CON UN "TRIGGER"
   En el SQL se podria haber descontado el stock con un
   trigger sobre DETALLE_VENTA, pero se decidio que fuera
   explicito: al leer el codigo de la venta se VE cuando baja
   el stock, se puede validar antes y es facil de depurar. Aqui
   pasa lo mismo: ventaService llama a descontarStock a la
   vista de todos.

   LOS TRES MOVIMIENTOS
     SALIDA  .. al vender            (descontarStock)
     ENTRADA .. al anular una venta  (devolverStock)
     ENTRADA .. al reponer mercaderia (reponerStock, ventaId null)
   ========================================================= */

import { CLAVES, guardar, leer, siguienteId } from './storage.js'


export function listarMovimientos({ productoId, tipo } = {}) {
  let movimientos = leer(CLAVES.movimientos, [])

  if (productoId !== undefined && productoId !== null && productoId !== '') {
    movimientos = movimientos.filter((m) => m.productoId === Number(productoId))
  }
  if (tipo) {
    movimientos = movimientos.filter((m) => m.tipoMovimiento === tipo)
  }

  return movimientos
}

/* Equivale a FN_STOCK_DISPONIBLE. Devuelve null si el
   producto no existe, que en el SQL es el error -20001. */
export function stockDisponible(productoId) {
  const producto = leer(CLAVES.productos, []).find((p) => p.productoId === Number(productoId))
  return producto ? producto.stock : null
}


/* Escribe una fila en MOVIMIENTO_STOCK. Privada: solo la usan
   las tres operaciones de abajo, para que no exista forma de
   mover stock sin dejar rastro. */
function registrarMovimiento(productoId, tipo, cantidad, ventaId, observacion) {
  const movimientos = leer(CLAVES.movimientos, [])

  movimientos.push({
    movimientoId: siguienteId(movimientos, 'movimientoId'),
    productoId: Number(productoId),
    fechaMovimiento: new Date().toISOString(),
    tipoMovimiento: tipo,
    cantidad: Number(cantidad),
    ventaId: ventaId ?? null,
    observacion,
  })

  guardar(CLAVES.movimientos, movimientos)
}

/* Suma o resta unidades y guarda. Devuelve el producto ya
   actualizado, o null si no existe. */
function moverStock(productoId, diferencia) {
  const productos = leer(CLAVES.productos, [])
  const indice = productos.findIndex((p) => p.productoId === Number(productoId))
  if (indice === -1) return null

  productos[indice] = { ...productos[indice], stock: productos[indice].stock + diferencia }
  guardar(CLAVES.productos, productos)

  return productos[indice]
}


/* =========================================================
   DESCONTAR — como PKG_INVENTARIO.DESCONTAR_STOCK
   Los mismos pasos y los mismos errores que el SQL:
     cantidad <= 0 ............ -20002
     producto inexistente ..... -20001
     producto INACTIVO ........ -20003
     stock insuficiente ....... -20004
   ========================================================= */

export function descontarStock(productoId, cantidad, ventaId = null) {
  const unidades = Number(cantidad)

  if (!Number.isInteger(unidades) || unidades <= 0) {
    return { ok: false, error: 'La cantidad debe ser mayor que cero.' }
  }

  const producto = leer(CLAVES.productos, []).find((p) => p.productoId === Number(productoId))
  if (!producto) return { ok: false, error: 'Producto inexistente.' }

  /* REGLA 2: un producto dado de baja no se vende. */
  if (producto.estado !== 'ACTIVO') {
    return { ok: false, error: 'El producto se encuentra inactivo.' }
  }

  /* REGLA 2: y tampoco si no alcanza el stock. El mensaje dice
     cuanto queda, igual que el -20004 del SQL. */
  if (producto.stock < unidades) {
    return { ok: false, error: `Stock insuficiente. Disponible: ${producto.stock}` }
  }

  /* REGLA 6: baja el stock y queda la SALIDA en el historial. */
  const actualizado = moverStock(productoId, -unidades)
  registrarMovimiento(productoId, 'SALIDA', unidades, ventaId, 'Salida por venta')

  return { ok: true, producto: actualizado }
}


/* =========================================================
   DEVOLVER — como PKG_INVENTARIO.DEVOLVER_STOCK
   REGLA 7: al anular una venta, el stock vuelve y queda una
   ENTRADA. Aqui no se mira el estado del producto: lo que se
   devuelve entra igual, aunque entretanto lo hayan dado de
   baja.
   ========================================================= */

export function devolverStock(productoId, cantidad, ventaId = null) {
  const unidades = Number(cantidad)

  if (!Number.isInteger(unidades) || unidades <= 0) {
    return { ok: false, error: 'La cantidad debe ser mayor que cero.' }
  }

  const actualizado = moverStock(productoId, unidades)
  if (!actualizado) return { ok: false, error: 'Producto inexistente.' }

  registrarMovimiento(productoId, 'ENTRADA', unidades, ventaId, 'Devolucion por anulacion de venta')

  return { ok: true, producto: actualizado }
}


/* =========================================================
   REPONER — como PKG_INVENTARIO.REPONER_STOCK
   Mercaderia nueva que trae el herrero. El movimiento va sin
   venta asociada (ventaId null), porque no viene de ninguna.

   Es tambien la forma de darle stock a un producto recien
   creado, que nace en 0 justamente para que su primera
   existencia quede registrada aqui.
   ========================================================= */

export function reponerStock(productoId, cantidad) {
  const unidades = Number(cantidad)

  if (!Number.isInteger(unidades) || unidades <= 0) {
    return { ok: false, error: 'La cantidad debe ser mayor que cero.' }
  }

  const actualizado = moverStock(productoId, unidades)
  if (!actualizado) return { ok: false, error: 'Producto inexistente.' }

  registrarMovimiento(productoId, 'ENTRADA', unidades, null, 'Reposicion de stock')

  return { ok: true, producto: actualizado }
}
