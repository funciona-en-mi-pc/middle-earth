import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Dashboard from './Dashboard.jsx'
import AuthProvider from '../../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../../services/authService.js'
import { reponerStock } from '../../services/inventarioService.js'
import { reiniciarDatos } from '../../services/storage.js'
import {
  agregarProducto,
  anularVenta,
  confirmarVenta,
  crearVenta,
} from '../../services/ventaService.js'

/* =========================================================
   Pruebas de Dashboard.jsx — Jose, tarea #33
   ---------------------------------------------------------
   El resumen del reino. Las cifras tienen que coincidir con
   lo que diria el script SQL.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* Lee la cifra que acompana a un rotulo */
const cifra = (rotulo) =>
  screen.getByText(rotulo).parentElement.querySelector('.n').textContent

/* Acota la busqueda a una seccion de la pagina. Hace falta
   porque el nombre de un objeto puede salir a la vez en la
   tabla de stock critico y en la de movimientos. */
const seccion = (titulo) =>
  within(screen.getByRole('heading', { name: titulo }).closest('section'))

function ventaConfirmada(jugadorId, productoId, cantidad) {
  const { venta } = crearVenta(jugadorId)
  agregarProducto(venta.ventaId, productoId, cantidad)
  confirmarVenta(venta.ventaId)
  return venta
}

describe('Dashboard', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('elrond@rivendel.me', 'elrond123')
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  it('saluda al mercader por su nombre', () => {
    dibujar()
    expect(screen.getByText(/Hola, Elrond/)).toBeTruthy()
  })

  describe('las cifras', () => {
    it('cuenta los ocho objetos del catalogo', () => {
      dibujar()
      expect(cifra('Objetos en el catalogo')).toBe('8')
    })

    it('empieza sin ventas', () => {
      dibujar()
      expect(cifra('Ventas confirmadas')).toBe('0')
      expect(cifra('Oro facturado')).toBe('0')
    })

    it('cuenta las ventas confirmadas y su oro', () => {
      ventaConfirmada(4, 6, 3)      // 3 Lembas = 150 oro
      dibujar()

      expect(cifra('Ventas confirmadas')).toBe('1')
      expect(cifra('Oro facturado')).toBe('150')
    })

    /* Una venta anulada devolvio su oro: no factura */
    it('una venta anulada no factura', () => {
      const venta = ventaConfirmada(4, 6, 3)
      anularVenta(venta.ventaId)

      dibujar()
      expect(cifra('Ventas confirmadas')).toBe('0')
      expect(cifra('Ventas anuladas')).toBe('1')
      expect(cifra('Oro facturado')).toBe('0')
    })
  })

  /* El cursor c_stock_bajo de la seccion 9 del script SQL:
     con los datos iniciales salen tres objetos. */
  describe('stock critico', () => {
    it('lista los objetos con 5 unidades o menos', () => {
      dibujar()
      const critico = seccion('Stock critico')

      expect(critico.getByText('Cota de Mithril')).toBeTruthy()   // 3
      expect(critico.getByText('Baston de Mago')).toBeTruthy()    // 4
      expect(critico.getByText('Espada Dardo')).toBeTruthy()      // 5
    })

    it('no lista los que tienen de sobra', () => {
      dibujar()
      expect(seccion('Stock critico').queryByText('Lembas')).toBeNull()   // 40
    })

    it('al reponer, el objeto sale de la lista', () => {
      reponerStock(4, 20)                                        // Cota: 3 -> 23
      dibujar()

      expect(seccion('Stock critico').queryByText('Cota de Mithril')).toBeNull()
    })

    it('marca como Agotado el que llego a cero', () => {
      ventaConfirmada(5, 4, 3)        // Gandalf se lleva las 3 Cotas
      dibujar()

      expect(seccion('Stock critico').getByText('Agotado')).toBeTruthy()
    })
  })

  describe('ultimos movimientos', () => {
    it('avisa cuando el almacen no se ha movido', () => {
      dibujar()
      expect(screen.getByText('Todavia no se ha movido nada del almacen.')).toBeTruthy()
    })

    it('muestra la salida de una venta', () => {
      ventaConfirmada(4, 6, 3)
      dibujar()

      expect(screen.getByText('Salida por venta')).toBeTruthy()
      expect(screen.getByText('SALIDA')).toBeTruthy()
    })

    it('muestra la entrada de una reposicion', () => {
      reponerStock(4, 10)
      dibujar()

      expect(screen.getByText('Reposicion de stock')).toBeTruthy()
      expect(screen.getByText('ENTRADA')).toBeTruthy()
    })
  })
})
