import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import MisPedidos from './MisPedidos.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { CLAVES, guardar, leer, reiniciarDatos } from '../services/storage.js'
import {
  agregarProducto,
  anularVenta,
  confirmarVenta,
  crearVenta,
} from '../services/ventaService.js'

/* =========================================================
   Pruebas de MisPedidos.jsx — Javier, tarea #29
   ---------------------------------------------------------
   El historial de compras. Usa el ventaService de Jose, asi
   que estas pruebas comprueban de paso que las dos partes
   encajan.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <MisPedidos />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* La venta 10.1 del script SQL: 3 Lembas y 1 Capa Elfica */
function compraDeAragorn() {
  const { venta } = crearVenta(4)
  agregarProducto(venta.ventaId, 6, 3)
  agregarProducto(venta.ventaId, 5, 1)
  confirmarVenta(venta.ventaId)
  return venta
}

describe('MisPedidos', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('aragorn@gondor.me', 'aragorn123')
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  it('avisa cuando todavia no hay pedidos', () => {
    dibujar()
    expect(screen.getByText('Todavia no has cerrado ningun pedido.')).toBeTruthy()
    expect(screen.getByText('Ir al mercado').getAttribute('href')).toBe('/catalogo')
  })

  describe('con un pedido confirmado', () => {
    it('muestra el numero y el estado', () => {
      compraDeAragorn()
      dibujar()

      expect(screen.getByText('Pedido ME-1001')).toBeTruthy()
      expect(screen.getByText('CONFIRMADA')).toBeTruthy()
    })

    /* Prueba 10.1 del SQL: 3 x 50 + 1 x 900 = 1050 */
    it('muestra el total de 1050 oro', () => {
      compraDeAragorn()
      dibujar()
      expect(screen.getByText('1.050 oro')).toBeTruthy()
    })

    it('lista los objetos comprados', () => {
      compraDeAragorn()
      dibujar()

      expect(screen.getByText('Lembas')).toBeTruthy()
      expect(screen.getByText('Capa Elfica')).toBeTruthy()
      expect(screen.getByText('4 objeto(s)')).toBeTruthy()
    })

    /* REGLA 8: el detalle guarda el precio del dia. Si el
       precio del producto sube despues, la boleta NO cambia. */
    it('conserva el precio del dia de la compra', () => {
      compraDeAragorn()

      const productos = leer(CLAVES.productos, [])
      productos[5].precio = 999            // las Lembas suben de 50 a 999
      guardar(CLAVES.productos, productos)

      dibujar()
      expect(screen.getByText('1.050 oro')).toBeTruthy()   // sigue igual
    })
  })

  describe('con un pedido anulado', () => {
    it('lo marca como ANULADA y lo explica', () => {
      const venta = compraDeAragorn()
      anularVenta(venta.ventaId)

      dibujar()
      expect(screen.getByText('ANULADA')).toBeTruthy()
      expect(screen.getByText(/El oro fue devuelto/)).toBeTruthy()
    })
  })

  /* El carrito es una venta ABIERTA, no un pedido */
  it('no muestra el carrito todavia abierto', () => {
    const { venta } = crearVenta(4)
    agregarProducto(venta.ventaId, 6, 1)

    dibujar()
    expect(screen.getByText('Todavia no has cerrado ningun pedido.')).toBeTruthy()
  })

  it('cada jugador ve solo sus pedidos', () => {
    compraDeAragorn()                      // de Aragorn

    const deLegolas = crearVenta(2).venta
    agregarProducto(deLegolas.ventaId, 2, 1)
    confirmarVenta(deLegolas.ventaId)

    dibujar()                              // la sesion es de Aragorn
    expect(screen.getByText('Pedido ME-1001')).toBeTruthy()
    expect(screen.queryByText('Pedido ME-1002')).toBeNull()
  })

  it('muestra los pedidos mas nuevos primero', () => {
    compraDeAragorn()                      // 1001

    const segunda = crearVenta(4).venta    // 1002
    agregarProducto(segunda.ventaId, 7, 1)
    confirmarVenta(segunda.ventaId)

    dibujar()
    const numeros = screen.getAllByText(/^Pedido ME-/).map((e) => e.textContent)
    expect(numeros).toEqual(['Pedido ME-1002', 'Pedido ME-1001'])
  })
})
