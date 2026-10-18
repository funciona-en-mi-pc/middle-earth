/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   ventaService.js — La venta completa
   ---------------------------------------------------------
   DUENO: Jose · tarea #22

   Es el equivalente de PKG_VENTAS del SQL, y como alla, le
   DELEGA el stock a inventarioService. Aqui se decide si la
   venta puede seguir; alla se mueve el stock y se registra.

   EL CICLO DE UNA VENTA (regla 4)
       crearVenta ....... nace ABIERTA
       agregarProducto .. solo si esta ABIERTA
       confirmarVenta ... pasa a CONFIRMADA
       anularVenta ...... pasa a ANULADA y devuelve el stock

   LA VENTA ABIERTA ES EL CARRITO
   El mockup guardaba el carrito en una clave aparte. Aqui no
   hace falta: una venta ABIERTA ES el carrito, igual que en la
   base de datos. Asi hay una sola verdad y el historial
   cuadra solo.

   NO HAY "COMMIT" NI "ROLLBACK"
   En el SQL la transaccion la controla el bloque que llama.
   Aqui cada funcion guarda lo suyo, pero el orden importa: el
   stock se descuenta ANTES de insertar el detalle, para que no
   quede una linea vendida sin stock descontado.
   ========================================================= */

import { descontarStock, devolverStock } from './inventarioService.js'
import { CLAVES, guardar, leer, siguienteId, siguienteIdVenta } from './storage.js'
import { MERCADER_POR_DEFECTO } from '../data/datosIniciales.js'


/* =========================================================
   CONSULTAS
   ========================================================= */

export function listarVentas({ estado, jugadorId } = {}) {
  let ventas = leer(CLAVES.ventas, [])

  if (estado) ventas = ventas.filter((v) => v.estado === estado)
  if (jugadorId !== undefined && jugadorId !== null && jugadorId !== '') {
    ventas = ventas.filter((v) => v.jugadorId === Number(jugadorId))
  }

  return ventas
}

export function obtenerVenta(ventaId) {
  return leer(CLAVES.ventas, []).find((v) => v.ventaId === Number(ventaId)) ?? null
}

export function detallesDeVenta(ventaId) {
  return leer(CLAVES.detalles, []).filter((d) => d.ventaId === Number(ventaId))
}

/* Las compras de un jugador, sin contar el carrito que aun
   tiene abierto. Lo usa "Mis pedidos". */
export function ventasDeJugador(jugadorId) {
  return listarVentas({ jugadorId }).filter((v) => v.estado !== 'ABIERTA')
}

/* El carrito: la venta ABIERTA del jugador, si tiene una. */
export function ventaAbiertaDe(jugadorId) {
  return listarVentas({ jugadorId, estado: 'ABIERTA' })[0] ?? null
}

/* Como FN_TOTAL_VENTA. El `?? 0` hace lo mismo que el NVL del
   SQL: una venta sin lineas vale 0, no "nada". */
export function totalVenta(ventaId) {
  return detallesDeVenta(ventaId)
    .reduce((suma, d) => suma + d.cantidad * d.precioUnitario, 0)
}

/* Como FN_CANTIDAD_PRODUCTOS: las unidades, no las lineas. */
export function cantidadProductos(ventaId) {
  return detallesDeVenta(ventaId).reduce((suma, d) => suma + d.cantidad, 0)
}

/* El numero del contador del carrito en la navbar. */
export function cantidadItemsCarrito(jugadorId) {
  const abierta = ventaAbiertaDe(jugadorId)
  return abierta ? cantidadProductos(abierta.ventaId) : 0
}

/* Como FN_VENTAS_JUGADOR: solo las confirmadas. */
export function ventasConfirmadasDe(jugadorId) {
  return listarVentas({ jugadorId, estado: 'CONFIRMADA' }).length
}


/* =========================================================
   CREAR — como PKG_VENTAS.REGISTRAR_VENTA
   REGLA 1: el jugador y el mercader tienen que estar ACTIVOS.
   Son los errores -20005 y -20006 del SQL.

   El numero sale de siguienteIdVenta, que empieza en 1001
   igual que SEQ_VENTA.
   ========================================================= */

export function crearVenta(jugadorId, mercaderId = MERCADER_POR_DEFECTO) {
  const jugador = leer(CLAVES.jugadores, []).find((j) => j.jugadorId === Number(jugadorId))
  if (!jugador || jugador.estado !== 'ACTIVO') {
    return { ok: false, error: 'Jugador inexistente o inactivo.' }
  }

  const mercader = leer(CLAVES.mercaderes, []).find((m) => m.mercaderId === Number(mercaderId))
  if (!mercader || mercader.estado !== 'ACTIVO') {
    return { ok: false, error: 'Mercader inexistente o inactivo.' }
  }

  const ventas = leer(CLAVES.ventas, [])

  const venta = {
    ventaId: siguienteIdVenta(ventas),
    jugadorId: Number(jugadorId),
    mercaderId: Number(mercaderId),
    fechaVenta: new Date().toISOString(),
    estado: 'ABIERTA',
  }

  ventas.push(venta)
  guardar(CLAVES.ventas, ventas)

  return { ok: true, venta }
}

/* Atajo para la tienda: usa el carrito que ya tenia abierto o
   abre uno nuevo. Asi las paginas no repiten ese if. */
export function obtenerOCrearVentaAbierta(jugadorId) {
  const abierta = ventaAbiertaDe(jugadorId)
  if (abierta) return { ok: true, venta: abierta }

  return crearVenta(jugadorId)
}


/* =========================================================
   AGREGAR — como PKG_VENTAS.AGREGAR_PRODUCTO
   El paso con mas reglas de todo el proyecto:

     venta existe ................ -20013
     venta ABIERTA ............... -20008  (regla 4)
     producto existe ............. -20013
     nivel del jugador suficiente  -20007  (regla 3)
     stock y estado del producto .. los valida el inventario
     se copia el precio al detalle          (regla 8)
   ========================================================= */

export function agregarProducto(ventaId, productoId, cantidad = 1) {
  const venta = obtenerVenta(ventaId)
  if (!venta) return { ok: false, error: 'Venta inexistente.' }

  /* REGLA 4: a una venta ya cerrada no se le agrega nada. */
  if (venta.estado !== 'ABIERTA') {
    return { ok: false, error: 'La venta no esta ABIERTA.' }
  }

  const producto = leer(CLAVES.productos, []).find((p) => p.productoId === Number(productoId))
  if (!producto) return { ok: false, error: 'Producto inexistente.' }

  /* REGLA 3: el jugador solo compra lo que su nivel permite.
     Frodo es nivel 5 y el Baston de Mago pide 40. */
  const jugador = leer(CLAVES.jugadores, []).find((j) => j.jugadorId === venta.jugadorId)
  if (jugador && jugador.nivel < producto.nivelRequerido) {
    return {
      ok: false,
      error: `Nivel insuficiente. Nivel del jugador: ${jugador.nivel}, nivel requerido: ${producto.nivelRequerido}`,
    }
  }

  /* El stock se descuenta ANTES de anotar la linea: si no
     alcanza, no se escribe nada y la venta queda intacta. */
  const descuento = descontarStock(productoId, cantidad, venta.ventaId)
  if (!descuento.ok) return descuento

  /* REGLA 8: se copia el precio DE HOY. Si manana sube, esta
     venta sigue valiendo lo que se pago. */
  const detalles = leer(CLAVES.detalles, [])
  const linea = {
    detalleId: siguienteId(detalles, 'detalleId'),
    ventaId: venta.ventaId,
    productoId: Number(productoId),
    cantidad: Number(cantidad),
    precioUnitario: producto.precio,
  }

  detalles.push(linea)
  guardar(CLAVES.detalles, detalles)

  return { ok: true, detalle: linea }
}


/* =========================================================
   CONFIRMAR — como PKG_VENTAS.CONFIRMAR_VENTA
     venta ABIERTA ...... -20008  (regla 4)
     con productos ...... -20009  (regla 5)
   El stock ya se descontó al agregar, asi que aqui solo
   cambia el estado.
   ========================================================= */

export function confirmarVenta(ventaId) {
  const venta = obtenerVenta(ventaId)
  if (!venta) return { ok: false, error: 'Venta inexistente.' }

  if (venta.estado !== 'ABIERTA') {
    return { ok: false, error: 'La venta no esta ABIERTA.' }
  }

  /* REGLA 5: no se confirma una venta sin productos. */
  if (detallesDeVenta(ventaId).length === 0) {
    return { ok: false, error: 'La venta no tiene productos.' }
  }

  return cambiarEstado(ventaId, 'CONFIRMADA')
}


/* =========================================================
   ANULAR — como PKG_VENTAS.ANULAR_VENTA
   REGLA 7: devuelve el stock producto por producto y deja una
   ENTRADA por cada uno. En el SQL eso se hace recorriendo el
   cursor c_detalle; aqui, con un forEach sobre el detalle.

   No se puede anular dos veces: error -20014.
   ========================================================= */

export function anularVenta(ventaId) {
  const venta = obtenerVenta(ventaId)
  if (!venta) return { ok: false, error: 'Venta inexistente.' }

  if (venta.estado === 'ANULADA') {
    return { ok: false, error: 'La venta ya se encuentra anulada.' }
  }

  detallesDeVenta(ventaId).forEach((linea) => {
    devolverStock(linea.productoId, linea.cantidad, venta.ventaId)
  })

  return cambiarEstado(ventaId, 'ANULADA')
}


function cambiarEstado(ventaId, estado) {
  const ventas = leer(CLAVES.ventas, [])
  const indice = ventas.findIndex((v) => v.ventaId === Number(ventaId))
  if (indice === -1) return { ok: false, error: 'Venta inexistente.' }

  ventas[indice] = { ...ventas[indice], estado }
  guardar(CLAVES.ventas, ventas)

  return { ok: true, venta: ventas[indice] }
}
