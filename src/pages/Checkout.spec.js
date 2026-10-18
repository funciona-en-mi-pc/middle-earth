import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import Checkout from './Checkout.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { stockDisponible } from '../services/inventarioService.js'
import { reiniciarDatos } from '../services/storage.js'
import {
  agregarProducto,
  anularVenta,
  crearVenta,
  obtenerVenta,
  ventaAbiertaDe,
} from '../services/ventaService.js'

/* =========================================================
   Pruebas de Checkout.jsx — Javier, Anexo 1
   ---------------------------------------------------------
   Es el paso que decide los dos finales del diagrama: PAGO
   CORRECTO y PAGO CON ERROR. Aqui se comprueban las cuatro
   familias que pide el docente:

     renderizado ... el resumen del encargo
     condicional ... carrito vacio vs. carrito con objetos
     estado ........ el formulario cambia al escribir
     eventos ....... enviar el formulario lleva a un final o
                     al otro

   REGLA IMPORTANTE: si el pago se rechaza, la venta sigue
   ABIERTA y el stock sigue descontado. El carrito no se
   pierde.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter initialEntries={['/checkout']}>
      <AuthProvider>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/compra-exitosa/:ventaId" element={<p>Boleta lista</p>} />
          <Route path="/compra-fallida" element={<p>Pago rechazado</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* La compra 10.1 del SQL: 3 Lembas y 1 Capa = 1050 oro */
function llenarCarrito() {
  const { venta } = crearVenta(4)          // Aragorn
  agregarProducto(venta.ventaId, 6, 3)
  agregarProducto(venta.ventaId, 5, 1)
  return venta
}

const campo = (etiqueta) => screen.getByLabelText(new RegExp(etiqueta))
const escribir = (etiqueta, valor) => fireEvent.change(campo(etiqueta), { target: { value: valor } })
const pagar = () => fireEvent.click(screen.getByRole('button', { name: /Pagar/ }))

describe('Checkout', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('aragorn@gondor.me', 'aragorn123')
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('lo que muestra', () => {
    it('resume el encargo con su total', () => {
      llenarCarrito()
      dibujar()

      expect(screen.getByText('Lembas x3')).toBeTruthy()
      expect(screen.getByText('Capa Elfica x1')).toBeTruthy()
      expect(screen.getByText('4 objeto(s)')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Pagar 1.050 oro' })).toBeTruthy()
    })

    /* Nota del Anexo: con sesion iniciada, los datos se
       rellenan solos. */
    it('rellena solo los datos del jugador', () => {
      llenarCarrito()
      dibujar()

      expect(campo('Nombre').value).toBe('Aragorn')
      expect(campo('Correo').value).toBe('aragorn@gondor.me')
      expect(campo('Direccion').value).toBe('')
    })

    /* Renderizado condicional */
    it('sin carrito no hay nada que pagar', () => {
      dibujar()
      expect(screen.getByText('No tienes nada que pagar.')).toBeTruthy()
      expect(screen.queryByRole('button', { name: /Pagar/ })).toBeNull()
    })
  })

  describe('el formulario', () => {
    /* Estado: lo que se escribe queda en el campo */
    it('guarda lo que se escribe', () => {
      llenarCarrito()
      dibujar()

      escribir('Direccion', 'Ciudadela Blanca 7')
      expect(campo('Direccion').value).toBe('Ciudadela Blanca 7')
    })

    it('no deja pagar sin direccion', () => {
      const venta = llenarCarrito()
      dibujar()

      pagar()

      expect(screen.getByText('La direccion de entrega es obligatoria.')).toBeTruthy()
      expect(screen.getByText('Revisa los campos marcados antes de pagar.')).toBeTruthy()
      expect(obtenerVenta(venta.ventaId).estado).toBe('ABIERTA')
    })

    /* El error aparece al salir del campo, sin enviar nada */
    it('avisa al salir de un campo vacio', () => {
      llenarCarrito()
      dibujar()

      fireEvent.blur(campo('Direccion'))
      expect(screen.getByText('La direccion de entrega es obligatoria.')).toBeTruthy()
    })

    /* Y se borra solo al corregirlo, sin volver a enviar */
    it('quita el error en cuanto se corrige', () => {
      llenarCarrito()
      dibujar()

      pagar()
      expect(screen.getByText('La direccion de entrega es obligatoria.')).toBeTruthy()

      escribir('Direccion', 'Ciudadela Blanca 7')
      expect(screen.queryByText('La direccion de entrega es obligatoria.')).toBeNull()
    })

    it('tampoco con una direccion de dos letras', () => {
      llenarCarrito()
      dibujar()

      escribir('Direccion', 'ab')
      pagar()

      expect(screen.getByText('Escribe una direccion mas completa.')).toBeTruthy()
    })
  })

  describe('pago correcto', () => {
    it('confirma la venta y lleva a la boleta', () => {
      const venta = llenarCarrito()
      dibujar()

      escribir('Direccion', 'Ciudadela Blanca 7')
      pagar()

      expect(screen.getByText('Boleta lista')).toBeTruthy()
      expect(obtenerVenta(venta.ventaId).estado).toBe('CONFIRMADA')
      expect(ventaAbiertaDe(4)).toBeNull()
    })

    /* El stock ya se descontó al agregar (regla 6): pagar no
       lo vuelve a tocar. */
    it('no vuelve a descontar el stock', () => {
      llenarCarrito()
      expect(stockDisponible(6)).toBe(37)   // 40 - 3

      dibujar()
      escribir('Direccion', 'Ciudadela Blanca 7')
      pagar()

      expect(stockDisponible(6)).toBe(37)
    })
  })

  describe('pago con error', () => {
    it('el pagare de Isengard siempre se rechaza', () => {
      const venta = llenarCarrito()
      dibujar()

      escribir('Direccion', 'Ciudadela Blanca 7')
      fireEvent.click(campo('Pagare de Isengard'))
      pagar()

      expect(screen.getByText('Pago rechazado')).toBeTruthy()
      expect(obtenerVenta(venta.ventaId).estado).toBe('ABIERTA')
    })

    /* Si el service dice que no, su mensaje es el que se
       muestra. Pasa de verdad: un mercader puede anular la
       venta desde el panel mientras el jugador paga. */
    it('repite el motivo que devuelve ventaService', () => {
      const venta = llenarCarrito()
      dibujar()

      escribir('Direccion', 'Ciudadela Blanca 7')
      anularVenta(venta.ventaId)          // se la anularon por detras
      pagar()

      expect(screen.getByText('Pago rechazado')).toBeTruthy()
      expect(obtenerVenta(venta.ventaId).estado).toBe('ANULADA')
    })

    /* Lo importante: al fallar no se pierde nada */
    it('deja el carrito y el stock como estaban', () => {
      llenarCarrito()
      dibujar()

      escribir('Direccion', 'Ciudadela Blanca 7')
      fireEvent.click(campo('Pagare de Isengard'))
      pagar()

      expect(ventaAbiertaDe(4)).not.toBeNull()
      expect(stockDisponible(6)).toBe(37)
    })
  })

  /* Un mercader no compra: VENTA.jugador_id es NOT NULL */
  it('a un mercader le pide entrar como jugador', () => {
    cerrarSesion()
    iniciarSesion('elrond@rivendel.me', 'elrond123')
    dibujar()

    expect(screen.getByText(/inicia sesion/)).toBeTruthy()
  })
})
