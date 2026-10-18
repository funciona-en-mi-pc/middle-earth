import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AdminPedidos from './AdminPedidos.jsx'
import AuthProvider from '../../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../../services/authService.js'
import { stockDisponible } from '../../services/inventarioService.js'
import { reiniciarDatos } from '../../services/storage.js'
import {
  agregarProducto,
  confirmarVenta,
  crearVenta,
  obtenerVenta,
} from '../../services/ventaService.js'

/* =========================================================
   Pruebas de AdminPedidos.jsx — Jose, tarea #33
   ---------------------------------------------------------
   Todas las ventas del reino, y la anulacion desde el panel.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminPedidos />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* La venta 10.1 del SQL: Aragorn, 1050 oro */
function ventaDeAragorn() {
  const { venta } = crearVenta(4)
  agregarProducto(venta.ventaId, 6, 3)
  agregarProducto(venta.ventaId, 5, 1)
  confirmarVenta(venta.ventaId)
  return venta
}

const filaDe = (pedido) => screen.getByText(pedido).closest('tr')

describe('AdminPedidos', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('elrond@rivendel.me', 'elrond123')
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  it('avisa cuando no hay ventas', () => {
    dibujar()
    expect(screen.getByText('No hay ventas con ese filtro.')).toBeTruthy()
  })

  describe('la tabla', () => {
    it('muestra la venta con su jugador y su mercader', () => {
      ventaDeAragorn()
      dibujar()

      const fila = filaDe('ME-1001')
      expect(within(fila).getByText('Aragorn')).toBeTruthy()
      expect(within(fila).getByText('Cebadilla Mantecona')).toBeTruthy()
      expect(within(fila).getByText('1.050 oro')).toBeTruthy()
      expect(within(fila).getByText('CONFIRMADA')).toBeTruthy()
    })

    /* Solo las CONFIRMADAS facturan */
    it('suma el oro facturado', () => {
      ventaDeAragorn()
      dibujar()
      expect(screen.getByText('1.050')).toBeTruthy()
    })

    it('muestra las ventas de todos los jugadores', () => {
      ventaDeAragorn()
      const deLegolas = crearVenta(2).venta
      agregarProducto(deLegolas.ventaId, 2, 1)
      confirmarVenta(deLegolas.ventaId)

      dibujar()
      expect(screen.getByText('ME-1001')).toBeTruthy()
      expect(screen.getByText('ME-1002')).toBeTruthy()
    })

    it('filtra por estado', () => {
      ventaDeAragorn()
      crearVenta(2)                 // una ABIERTA

      dibujar()
      expect(screen.getByText('ME-1002')).toBeTruthy()

      fireEvent.click(screen.getByRole('button', { name: 'CONFIRMADA' }))
      expect(screen.queryByText('ME-1002')).toBeNull()
    })
  })

  describe('anular una venta', () => {
    /* REGLA 7: el stock vuelve y queda una ENTRADA */
    it('devuelve el stock al almacen', () => {
      ventaDeAragorn()
      expect(stockDisponible(6)).toBe(37)

      dibujar()
      fireEvent.click(within(filaDe('ME-1001')).getByRole('button', { name: 'Anular' }))

      expect(stockDisponible(6)).toBe(40)
      expect(stockDisponible(5)).toBe(12)
      expect(obtenerVenta(1001).estado).toBe('ANULADA')
      expect(screen.getByText(/El stock volvio al almacen/)).toBeTruthy()
    })

    /* Error -20014: no se anula dos veces */
    it('deshabilita el boton de una venta ya anulada', () => {
      ventaDeAragorn()
      dibujar()

      const boton = within(filaDe('ME-1001')).getByRole('button', { name: 'Anular' })
      fireEvent.click(boton)

      expect(within(filaDe('ME-1001')).getByRole('button', { name: 'Anular' }).disabled).toBe(true)
    })

    it('al anular deja de facturar', () => {
      ventaDeAragorn()
      dibujar()
      fireEvent.click(within(filaDe('ME-1001')).getByRole('button', { name: 'Anular' }))

      expect(screen.getByText('0')).toBeTruthy()
    })
  })

  it('un VENDEDOR ve las ventas pero no puede anular', () => {
    ventaDeAragorn()
    cerrarSesion()
    iniciarSesion('cebadilla@pony.me', 'cebadilla1')
    dibujar()

    expect(screen.getByText('ME-1001')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Anular' })).toBeNull()
  })
})
