import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AdminMovimientos from './AdminMovimientos.jsx'
import AuthProvider from '../../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../../services/authService.js'
import { listarMovimientos, stockDisponible } from '../../services/inventarioService.js'
import { reiniciarDatos } from '../../services/storage.js'
import { agregarProducto, anularVenta, crearVenta } from '../../services/ventaService.js'

/* =========================================================
   Pruebas de AdminMovimientos.jsx — Jose, tarea #33
   ---------------------------------------------------------
   El historial del almacen y la reposicion de stock
   (PKG_INVENTARIO.REPONER_STOCK).
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminMovimientos />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* Cuenta las filas del cuerpo de la tabla.
   No sirve buscar el texto "ENTRADA" o "SALIDA": los botones
   de filtro dicen lo mismo y saldrian en la cuenta. */
const filas = () => {
  const cuerpo = document.querySelector('tbody')
  return cuerpo ? cuerpo.querySelectorAll('tr').length : 0
}

function reponer(productoId, cantidad) {
  fireEvent.change(screen.getByLabelText('Reponer objeto'), { target: { value: String(productoId) } })
  fireEvent.change(screen.getByLabelText('Unidades'), { target: { value: String(cantidad) } })
  fireEvent.click(screen.getByRole('button', { name: 'Reponer' }))
}

describe('AdminMovimientos', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('elrond@rivendel.me', 'elrond123')
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  it('avisa cuando el almacen no se ha movido', () => {
    dibujar()
    expect(screen.getByText('No hay movimientos con ese filtro.')).toBeTruthy()
  })

  describe('reponer stock', () => {
    it('sube el stock y deja una ENTRADA', () => {
      dibujar()
      reponer(4, 10)                       // Cota de Mithril: 3 + 10

      expect(stockDisponible(4)).toBe(13)
      expect(screen.getByText(/quedo con 13 unidades/)).toBeTruthy()
      expect(filas()).toBe(1)
    })

    /* Una reposicion no viene de ninguna venta */
    it('la ENTRADA no lleva venta asociada', () => {
      dibujar()
      reponer(4, 10)

      const movimiento = listarMovimientos()[0]
      expect(movimiento.ventaId).toBeNull()
      expect(movimiento.observacion).toBe('Reposicion de stock')
      expect(screen.getByText('—')).toBeTruthy()
    })

    /* Error -20002 del SQL */
    it('no acepta cantidades invalidas', () => {
      dibujar()
      reponer(4, 0)
      expect(screen.getByText('La cantidad debe ser mayor que cero.')).toBeTruthy()
      expect(stockDisponible(4)).toBe(3)
    })

    it('exige elegir un objeto', () => {
      dibujar()
      fireEvent.change(screen.getByLabelText('Unidades'), { target: { value: '5' } })
      fireEvent.click(screen.getByRole('button', { name: 'Reponer' }))

      expect(screen.getByText('Elige un objeto.')).toBeTruthy()
    })
  })

  describe('el historial', () => {
    /* Prueba 17 del SQL: trazabilidad completa del Miruvor */
    it('muestra la SALIDA de la venta y la ENTRADA de la anulacion', () => {
      const { venta } = crearVenta(2)
      agregarProducto(venta.ventaId, 7, 2)   // Miruvor
      anularVenta(venta.ventaId)

      dibujar()
      expect(filas()).toBe(2)
      expect(screen.getByText('Salida por venta')).toBeTruthy()
      expect(screen.getByText('Devolucion por anulacion de venta')).toBeTruthy()
      expect(screen.getAllByText('ME-1001').length).toBe(2)
    })

    it('filtra por tipo', () => {
      const { venta } = crearVenta(4)
      agregarProducto(venta.ventaId, 6, 1)   // una SALIDA

      dibujar()
      reponer(4, 5)                          // una ENTRADA
      expect(filas()).toBe(2)

      fireEvent.click(screen.getByRole('button', { name: 'SALIDA' }))
      expect(filas()).toBe(1)
    })

    it('filtra por objeto', () => {
      dibujar()
      reponer(4, 5)
      reponer(6, 5)
      expect(filas()).toBe(2)

      fireEvent.change(screen.getByLabelText('Filtrar por objeto'), { target: { value: '4' } })
      expect(filas()).toBe(1)
    })
  })

  describe('permisos', () => {
    /* El HERRERO es justamente quien trae la mercaderia */
    it('un HERRERO si puede reponer', () => {
      cerrarSesion()
      iniciarSesion('grimbold@erebor.me', 'grimbold1')
      dibujar()

      expect(screen.getByRole('button', { name: 'Reponer' })).toBeTruthy()
    })

    it('un VENDEDOR no puede', () => {
      cerrarSesion()
      iniciarSesion('cebadilla@pony.me', 'cebadilla1')
      dibujar()

      expect(screen.queryByRole('button', { name: 'Reponer' })).toBeNull()
      expect(screen.getByText(/Solo un ADMINISTRADOR o un HERRERO/)).toBeTruthy()
    })
  })
})
