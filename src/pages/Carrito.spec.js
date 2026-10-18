import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import Carrito from './Carrito.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { stockDisponible } from '../services/inventarioService.js'
import { reiniciarDatos } from '../services/storage.js'
import {
  agregarProducto,
  crearVenta,
  listarVentas,
  obtenerVenta,
  ventaAbiertaDe,
} from '../services/ventaService.js'

/* =========================================================
   Pruebas de Carrito.jsx — Jose, tarea #33
   ---------------------------------------------------------
   El carrito ES la venta ABIERTA del jugador, asi que estas
   pruebas comprueban tambien que confirmar y vaciar hacen lo
   que manda el SQL.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter initialEntries={['/carrito']}>
      <AuthProvider>
        <Routes>
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/mis-pedidos" element={<p>Estoy en mis pedidos</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* La compra 10.1 del SQL: 3 Lembas y 1 Capa = 1050 oro */
function llenarCarrito() {
  const { venta } = crearVenta(4)
  agregarProducto(venta.ventaId, 6, 3)
  agregarProducto(venta.ventaId, 5, 1)
  return venta
}

const pulsar = (texto) => fireEvent.click(screen.getByRole('button', { name: texto }))

describe('Carrito', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('aragorn@gondor.me', 'aragorn123')
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  it('avisa cuando esta vacio', () => {
    dibujar()
    expect(screen.getByText('Tu carrito esta vacio.')).toBeTruthy()
    expect(screen.getByText('Ir al mercado').getAttribute('href')).toBe('/catalogo')
  })

  describe('con objetos dentro', () => {
    it('lista los objetos con su precio', () => {
      llenarCarrito()
      dibujar()

      expect(screen.getByText('Lembas')).toBeTruthy()
      expect(screen.getByText('Capa Elfica')).toBeTruthy()
    })

    /* Prueba 10.1 del SQL: 3 x 50 + 1 x 900 = 1050 */
    it('muestra el total y los objetos', () => {
      llenarCarrito()
      dibujar()

      expect(screen.getByText('1.050 oro')).toBeTruthy()
      expect(screen.getByText('4 objeto(s)')).toBeTruthy()
    })
  })

  describe('confirmar la compra', () => {
    it('deja la venta CONFIRMADA y lleva a mis pedidos', () => {
      const venta = llenarCarrito()
      dibujar()

      pulsar('Confirmar compra')

      expect(obtenerVenta(venta.ventaId).estado).toBe('CONFIRMADA')
      expect(screen.getByText('Estoy en mis pedidos')).toBeTruthy()
    })

    /* El stock ya se descontó al agregar (regla 6): confirmar
       no lo vuelve a tocar. */
    it('no vuelve a descontar el stock', () => {
      llenarCarrito()
      expect(stockDisponible(6)).toBe(37)   // 40 - 3

      dibujar()
      pulsar('Confirmar compra')

      expect(stockDisponible(6)).toBe(37)   // sigue igual
    })

    it('despues ya no hay carrito abierto', () => {
      llenarCarrito()
      dibujar()
      pulsar('Confirmar compra')

      expect(ventaAbiertaDe(4)).toBeNull()
    })
  })

  describe('vaciar el carrito', () => {
    /* REGLA 7: anular devuelve el stock y deja una ENTRADA */
    it('devuelve el stock al mercado', () => {
      llenarCarrito()
      expect(stockDisponible(6)).toBe(37)

      dibujar()
      pulsar('Vaciar carrito')

      expect(stockDisponible(6)).toBe(40)   // vuelve a 40
      expect(stockDisponible(5)).toBe(12)
    })

    it('deja la venta ANULADA y muestra el carrito vacio', () => {
      const venta = llenarCarrito()
      dibujar()

      pulsar('Vaciar carrito')

      expect(obtenerVenta(venta.ventaId).estado).toBe('ANULADA')
      expect(screen.getByText('Tu carrito esta vacio.')).toBeTruthy()
    })
  })

  /* REGLA 5: no se confirma una venta sin productos */
  it('no deja confirmar una venta vacia', () => {
    crearVenta(4)          // venta ABIERTA, pero sin lineas
    dibujar()

    expect(screen.getByText('Tu carrito esta vacio.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Confirmar compra' })).toBeNull()
  })

  /* En el SQL, VENTA.jugador_id es NOT NULL: los mercaderes
     no compran. */
  it('a un mercader le pide iniciar sesion como jugador', () => {
    cerrarSesion()
    iniciarSesion('elrond@rivendel.me', 'elrond123')
    dibujar()

    expect(screen.getByText('inicia sesion').getAttribute('href')).toBe('/login?motivo=compra')
  })

  it('cada jugador ve solo su carrito', () => {
    llenarCarrito()                       // de Aragorn

    const deLegolas = crearVenta(2).venta
    agregarProducto(deLegolas.ventaId, 2, 1)

    dibujar()                             // la sesion es de Aragorn
    expect(screen.getByText('1.050 oro')).toBeTruthy()
    expect(screen.queryByText('Arco de los Galadhrim')).toBeNull()
    expect(listarVentas({ estado: 'ABIERTA' }).length).toBe(2)
  })
})
