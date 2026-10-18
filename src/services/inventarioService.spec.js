import {
  descontarStock,
  devolverStock,
  listarMovimientos,
  reponerStock,
  stockDisponible,
} from './inventarioService.js'
import { CLAVES, guardar, leer, reiniciarDatos } from './storage.js'

/* =========================================================
   Pruebas de inventarioService.js — Jose, tarea #23
   ---------------------------------------------------------
   Es el equivalente de PKG_INVENTARIO: el unico sitio donde
   cambia el stock, y cada cambio deja una fila en
   MOVIMIENTO_STOCK.
   ========================================================= */

describe('inventarioService', () => {
  beforeEach(() => reiniciarDatos())

  describe('stockDisponible', () => {
    it('trae el stock del SQL', () => {
      expect(stockDisponible(4)).toBe(3)    // Cota de Mithril
      expect(stockDisponible(6)).toBe(40)   // Lembas
    })

    it('devuelve null si el producto no existe', () => {
      expect(stockDisponible(999)).toBeNull()
    })
  })

  /* PKG_INVENTARIO.DESCONTAR_STOCK */
  describe('descontarStock', () => {
    it('baja el stock y registra una SALIDA', () => {
      expect(descontarStock(6, 3, 1001).ok).toBe(true)
      expect(stockDisponible(6)).toBe(37)

      const movimientos = listarMovimientos({ productoId: 6 })
      expect(movimientos.length).toBe(1)
      expect(movimientos[0].tipoMovimiento).toBe('SALIDA')
      expect(movimientos[0].cantidad).toBe(3)
      expect(movimientos[0].ventaId).toBe(1001)
      expect(movimientos[0].observacion).toBe('Salida por venta')
    })

    /* Error -20002 del SQL */
    it('no acepta cantidades cero, negativas ni decimales', () => {
      expect(descontarStock(6, 0).error).toBe('La cantidad debe ser mayor que cero.')
      expect(descontarStock(6, -2).ok).toBe(false)
      expect(descontarStock(6, 1.5).ok).toBe(false)
      expect(stockDisponible(6)).toBe(40)   // intacto
    })

    /* Error -20001 */
    it('avisa si el producto no existe', () => {
      expect(descontarStock(999, 1).error).toBe('Producto inexistente.')
    })

    /* Error -20003 — REGLA 2 */
    it('no vende un producto INACTIVO', () => {
      const productos = leer(CLAVES.productos, [])
      productos[5].estado = 'INACTIVO'   // Lembas
      guardar(CLAVES.productos, productos)

      expect(descontarStock(6, 1).error).toBe('El producto se encuentra inactivo.')
      expect(stockDisponible(6)).toBe(40)
    })

    /* Error -20004 — REGLA 2. El mensaje dice cuanto queda */
    it('no vende mas de lo que hay y dice cuanto queda', () => {
      expect(descontarStock(4, 999).error).toBe('Stock insuficiente. Disponible: 3')
      expect(stockDisponible(4)).toBe(3)
    })

    it('si deja el stock justo en cero, lo permite', () => {
      expect(descontarStock(4, 3).ok).toBe(true)
      expect(stockDisponible(4)).toBe(0)
    })

    it('no registra ningun movimiento cuando falla', () => {
      descontarStock(4, 999)
      expect(listarMovimientos().length).toBe(0)
    })
  })

  /* PKG_INVENTARIO.DEVOLVER_STOCK — REGLA 7 */
  describe('devolverStock', () => {
    it('sube el stock y registra una ENTRADA', () => {
      descontarStock(7, 2, 1002)
      expect(stockDisponible(7)).toBe(23)

      expect(devolverStock(7, 2, 1002).ok).toBe(true)
      expect(stockDisponible(7)).toBe(25)

      const entradas = listarMovimientos({ productoId: 7, tipo: 'ENTRADA' })
      expect(entradas[0].observacion).toBe('Devolucion por anulacion de venta')
      expect(entradas[0].ventaId).toBe(1002)
    })

    /* Lo que se devuelve entra igual, aunque entretanto hayan
       dado de baja el producto. */
    it('devuelve aunque el producto este INACTIVO', () => {
      const productos = leer(CLAVES.productos, [])
      productos[6].estado = 'INACTIVO'
      guardar(CLAVES.productos, productos)

      expect(devolverStock(7, 1).ok).toBe(true)
      expect(stockDisponible(7)).toBe(26)
    })
  })

  /* PKG_INVENTARIO.REPONER_STOCK */
  describe('reponerStock', () => {
    it('sube el stock y registra una ENTRADA sin venta', () => {
      expect(reponerStock(4, 10).ok).toBe(true)
      expect(stockDisponible(4)).toBe(13)

      const movimientos = listarMovimientos({ productoId: 4 })
      expect(movimientos[0].tipoMovimiento).toBe('ENTRADA')
      expect(movimientos[0].ventaId).toBeNull()
      expect(movimientos[0].observacion).toBe('Reposicion de stock')
    })

    it('no acepta cantidades invalidas', () => {
      expect(reponerStock(4, 0).ok).toBe(false)
      expect(reponerStock(4, -5).ok).toBe(false)
    })

    it('avisa si el producto no existe', () => {
      expect(reponerStock(999, 5).error).toBe('Producto inexistente.')
    })
  })

  describe('listarMovimientos', () => {
    it('sin filtros los trae todos, en orden', () => {
      descontarStock(6, 1, 1001)
      reponerStock(4, 5)

      const todos = listarMovimientos()
      expect(todos.length).toBe(2)
      expect(todos[0].tipoMovimiento).toBe('SALIDA')
      expect(todos[1].tipoMovimiento).toBe('ENTRADA')
    })

    it('filtra por producto y por tipo', () => {
      descontarStock(6, 1)
      reponerStock(6, 5)
      reponerStock(4, 5)

      expect(listarMovimientos({ productoId: 6 }).length).toBe(2)
      expect(listarMovimientos({ tipo: 'ENTRADA' }).length).toBe(2)
      expect(listarMovimientos({ productoId: 6, tipo: 'ENTRADA' }).length).toBe(1)
    })
  })
})
