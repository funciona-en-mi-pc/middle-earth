import {
  agregarProducto,
  anularVenta,
  cantidadItemsCarrito,
  cantidadProductos,
  confirmarVenta,
  crearVenta,
  detallesDeVenta,
  listarVentas,
  obtenerVenta,
  totalVenta,
  ventaAbiertaDe,
  ventasConfirmadasDe,
  ventasDeJugador,
} from './ventaService.js'
import { listarMovimientos, stockDisponible } from './inventarioService.js'
import { reiniciarDatos } from './storage.js'

/* =========================================================
   Pruebas de ventaService.js — Jose, tarea #23
   ---------------------------------------------------------
   Reproducen las pruebas del propio script SQL. Si estas
   pasan, el frontend se comporta igual que la base de datos.

   LOS JUGADORES Y SUS NIVELES
     1 Frodo .... 5    4 Aragorn .. 25
     2 Legolas .. 20   5 Gandalf .. 50
     3 Gimli .... 18   6 Boromir .. 22 (INACTIVO)

   LOS PRODUCTOS QUE MAS SE USAN
     4 Cota de Mithril .. 5000 oro, stock 3,  nivel 15
     5 Capa Elfica ......  900 oro, stock 12, nivel 10
     6 Lembas ...........   50 oro, stock 40, nivel 1
     8 Baston de Mago ... 3500 oro, stock 4,  nivel 40
   ========================================================= */

describe('ventaService', () => {
  beforeEach(() => reiniciarDatos())

  /* --- Prueba 10.1 del script SQL ---------------------- */
  describe('la venta 1001 de Aragorn, como en el SQL', () => {
    it('da 1050 oro y 4 items: 3 Lembas mas 1 Capa Elfica', () => {
      const { venta } = crearVenta(4)

      expect(venta.ventaId).toBe(1001)   // SEQ_VENTA empieza en 1001
      expect(venta.estado).toBe('ABIERTA')

      expect(agregarProducto(venta.ventaId, 6, 3).ok).toBe(true)   // Lembas
      expect(agregarProducto(venta.ventaId, 5, 1).ok).toBe(true)   // Capa

      /* 3 x 50 + 1 x 900 = 1050 */
      expect(totalVenta(venta.ventaId)).toBe(1050)
      expect(cantidadProductos(venta.ventaId)).toBe(4)

      expect(confirmarVenta(venta.ventaId).ok).toBe(true)
      expect(obtenerVenta(venta.ventaId).estado).toBe('CONFIRMADA')
    })

    /* REGLA 6: el stock baja y queda una SALIDA */
    it('descuenta el stock y deja las salidas en el historial', () => {
      const { venta } = crearVenta(4)
      agregarProducto(venta.ventaId, 6, 3)
      agregarProducto(venta.ventaId, 5, 1)

      expect(stockDisponible(6)).toBe(37)   // 40 - 3
      expect(stockDisponible(5)).toBe(11)   // 12 - 1

      const salidas = listarMovimientos({ tipo: 'SALIDA' })
      expect(salidas.length).toBe(2)
      expect(salidas[0].ventaId).toBe(1001)
      expect(salidas[0].observacion).toBe('Salida por venta')
    })

    /* REGLA 8: el precio se copia al detalle */
    it('guarda el precio del momento en el detalle', () => {
      const { venta } = crearVenta(4)
      agregarProducto(venta.ventaId, 6, 3)

      expect(detallesDeVenta(venta.ventaId)[0].precioUnitario).toBe(50)
    })

    it('la segunda venta es la 1002', () => {
      crearVenta(4)
      expect(crearVenta(2).venta.ventaId).toBe(1002)
    })
  })

  /* --- Reglas que impiden vender ------------------------ */
  describe('cuando la venta no debe dejarse hacer', () => {
    /* REGLA 1 — error -20005 del SQL */
    it('no crea una venta para un jugador INACTIVO (Boromir)', () => {
      const intento = crearVenta(6)

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Jugador inexistente o inactivo.')
    })

    /* REGLA 1 — error -20006 del SQL. Grima es el mercader 4 */
    it('no crea una venta con un mercader INACTIVO (Grima)', () => {
      const intento = crearVenta(4, 4)

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Mercader inexistente o inactivo.')
    })

    /* REGLA 3 — prueba 15.2 del SQL: Frodo y el Baston */
    it('no deja a Frodo comprar el Baston de Mago', () => {
      const { venta } = crearVenta(1)
      const intento = agregarProducto(venta.ventaId, 8, 1)

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Nivel insuficiente. Nivel del jugador: 5, nivel requerido: 40')
      expect(stockDisponible(8)).toBe(4)   // no se toco el stock
    })

    /* REGLA 2 — prueba 15.1 del SQL: 999 Cotas de Mithril */
    it('no deja comprar mas unidades de las que hay', () => {
      const { venta } = crearVenta(5)   // Gandalf, nivel 50
      const intento = agregarProducto(venta.ventaId, 4, 999)

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Stock insuficiente. Disponible: 3')
    })

    /* REGLA 4 — prueba 15.7 del SQL */
    it('no agrega nada a una venta ya CONFIRMADA', () => {
      const { venta } = crearVenta(4)
      agregarProducto(venta.ventaId, 6, 1)
      confirmarVenta(venta.ventaId)

      const intento = agregarProducto(venta.ventaId, 6, 1)
      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('La venta no esta ABIERTA.')
    })

    /* REGLA 5 — prueba 15.6 del SQL */
    it('no confirma una venta sin productos', () => {
      const { venta } = crearVenta(4)
      const intento = confirmarVenta(venta.ventaId)

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('La venta no tiene productos.')
      expect(obtenerVenta(venta.ventaId).estado).toBe('ABIERTA')
    })

    it('avisa cuando la venta o el producto no existen', () => {
      expect(agregarProducto(9999, 6, 1).error).toBe('Venta inexistente.')

      const { venta } = crearVenta(4)
      expect(agregarProducto(venta.ventaId, 999, 1).error).toBe('Producto inexistente.')
    })
  })

  /* --- Prueba 16 del script SQL ------------------------- */
  describe('anular una venta', () => {
    /* REGLA 7: el stock vuelve y queda una ENTRADA */
    it('devuelve el stock y deja las entradas en el historial', () => {
      const { venta } = crearVenta(2)                 // Legolas, nivel 20
      agregarProducto(venta.ventaId, 2, 1)            // Arco:    8 -> 7
      agregarProducto(venta.ventaId, 7, 2)            // Miruvor: 25 -> 23
      confirmarVenta(venta.ventaId)

      expect(stockDisponible(2)).toBe(7)
      expect(stockDisponible(7)).toBe(23)

      expect(anularVenta(venta.ventaId).ok).toBe(true)

      expect(stockDisponible(2)).toBe(8)              // vuelve a 8
      expect(stockDisponible(7)).toBe(25)             // vuelve a 25
      expect(obtenerVenta(venta.ventaId).estado).toBe('ANULADA')

      const entradas = listarMovimientos({ tipo: 'ENTRADA' })
      expect(entradas.length).toBe(2)
      expect(entradas[0].observacion).toBe('Devolucion por anulacion de venta')
    })

    /* Prueba 16.1 del SQL — error -20014 */
    it('no se puede anular dos veces', () => {
      const { venta } = crearVenta(2)
      agregarProducto(venta.ventaId, 7, 1)
      anularVenta(venta.ventaId)

      const intento = anularVenta(venta.ventaId)
      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('La venta ya se encuentra anulada.')
    })

    it('una venta anulada ya no cuenta como compra del jugador', () => {
      const { venta } = crearVenta(2)
      agregarProducto(venta.ventaId, 7, 1)
      confirmarVenta(venta.ventaId)
      expect(ventasConfirmadasDe(2)).toBe(1)

      anularVenta(venta.ventaId)
      expect(ventasConfirmadasDe(2)).toBe(0)
    })

    /* Prueba 17 del SQL: trazabilidad completa del Miruvor */
    it('deja el rastro completo: una SALIDA y una ENTRADA', () => {
      const { venta } = crearVenta(2)
      agregarProducto(venta.ventaId, 7, 2)
      anularVenta(venta.ventaId)

      const movimientos = listarMovimientos({ productoId: 7 })
      expect(movimientos.length).toBe(2)
      expect(movimientos[0].tipoMovimiento).toBe('SALIDA')
      expect(movimientos[1].tipoMovimiento).toBe('ENTRADA')
      expect(movimientos[0].cantidad).toBe(2)
      expect(movimientos[1].cantidad).toBe(2)
    })
  })

  /* --- El carrito es la venta ABIERTA ------------------- */
  describe('el carrito', () => {
    it('no hay carrito hasta que se crea una venta', () => {
      expect(ventaAbiertaDe(4)).toBeNull()
      expect(cantidadItemsCarrito(4)).toBe(0)
    })

    it('cuenta las unidades del carrito', () => {
      const { venta } = crearVenta(4)
      agregarProducto(venta.ventaId, 6, 3)

      expect(ventaAbiertaDe(4).ventaId).toBe(venta.ventaId)
      expect(cantidadItemsCarrito(4)).toBe(3)
    })

    it('al confirmar, el carrito queda vacio', () => {
      const { venta } = crearVenta(4)
      agregarProducto(venta.ventaId, 6, 1)
      confirmarVenta(venta.ventaId)

      expect(ventaAbiertaDe(4)).toBeNull()
      expect(cantidadItemsCarrito(4)).toBe(0)
    })

    it('cada jugador tiene su propio carrito', () => {
      const deAragorn = crearVenta(4).venta
      agregarProducto(deAragorn.ventaId, 6, 2)

      expect(cantidadItemsCarrito(4)).toBe(2)
      expect(cantidadItemsCarrito(2)).toBe(0)
    })
  })

  describe('consultas', () => {
    it('una venta vacia vale 0, no NaN', () => {
      const { venta } = crearVenta(4)
      expect(totalVenta(venta.ventaId)).toBe(0)
      expect(cantidadProductos(venta.ventaId)).toBe(0)
    })

    it('mis pedidos no muestra el carrito todavia abierto', () => {
      const confirmada = crearVenta(4).venta
      agregarProducto(confirmada.ventaId, 6, 1)
      confirmarVenta(confirmada.ventaId)

      crearVenta(4)   // un carrito nuevo, sin confirmar

      expect(listarVentas({ jugadorId: 4 }).length).toBe(2)
      expect(ventasDeJugador(4).length).toBe(1)
    })

    it('filtra las ventas por estado', () => {
      const v = crearVenta(4).venta
      agregarProducto(v.ventaId, 6, 1)
      confirmarVenta(v.ventaId)

      expect(listarVentas({ estado: 'CONFIRMADA' }).length).toBe(1)
      expect(listarVentas({ estado: 'ANULADA' }).length).toBe(0)
    })
  })
})
