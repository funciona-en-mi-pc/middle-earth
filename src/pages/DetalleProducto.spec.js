import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import DetalleProducto from './DetalleProducto.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { stockDisponible } from '../services/inventarioService.js'
import { reiniciarDatos } from '../services/storage.js'
import { cantidadItemsCarrito, totalVenta, ventaAbiertaDe } from '../services/ventaService.js'

/* =========================================================
   Pruebas de DetalleProducto.jsx — Jose, tarea #23
   ---------------------------------------------------------
   La pagina lee el :id de la ruta, asi que hace falta montar
   una ruta de verdad con <Routes> para que useParams funcione.

   PRODUCTOS QUE SE USAN
     1 Espada Dardo ..... 1500 oro, stock 5,  nivel 5
     4 Cota de Mithril .. 5000 oro, stock 3,  nivel 15
     8 Baston de Mago ... 3500 oro, stock 4,  nivel 40
   ========================================================= */

function dibujar(id) {
  return render(
    <MemoryRouter initialEntries={[`/productos/${id}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/productos/:id" element={<DetalleProducto />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const boton = () => screen.getByRole('button', { name: 'Agregar al carrito' })

/* Lee el valor que acompana a una etiqueta de la ficha de
   datos. Hace falta porque el nivel y el stock pueden ser el
   mismo numero, y buscar "5" a secas encontraria los dos. */
const dato = (etiqueta) =>
  screen.getByText(etiqueta).parentElement.querySelector('dd').textContent

describe('DetalleProducto', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('lo que muestra', () => {
    it('muestra los datos del producto', () => {
      dibujar(1)
      expect(screen.getByRole('heading', { name: 'Espada Dardo' })).toBeTruthy()
      expect(screen.getByText('1.500 oro')).toBeTruthy()
    })

    it('muestra el nivel requerido y las unidades', () => {
      dibujar(1)
      expect(dato('Nivel requerido')).toBe('5')
      expect(dato('Unidades disponibles')).toBe('5')
      expect(dato('Estado')).toBe('ACTIVO')
    })

    /* El stock que se muestra es el RESTANTE, no el de fabrica */
    it('el stock baja en pantalla tras comprar', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar(1)

      expect(dato('Unidades disponibles')).toBe('5')
      fireEvent.click(boton())
      expect(dato('Unidades disponibles')).toBe('4')
    })

    it('avisa si el objeto no existe', () => {
      dibujar(999)
      expect(screen.getByRole('heading', { name: 'Objeto no encontrado' })).toBeTruthy()
    })
  })

  describe('quien no puede comprar', () => {
    it('sin sesion invita a entrar', () => {
      dibujar(1)
      expect(screen.getByText('inicia sesion').getAttribute('href')).toBe('/login?motivo=compra')
      expect(boton().disabled).toBe(true)
    })

    /* En el SQL, VENTA.jugador_id es NOT NULL: siempre compra
       un jugador, nunca un mercader. */
    it('un mercader no compra', () => {
      iniciarSesion('elrond@rivendel.me', 'elrond123')
      dibujar(1)

      expect(screen.getByText(/Los mercaderes no compran/)).toBeTruthy()
      expect(boton().disabled).toBe(true)
    })

    /* REGLA 3: Frodo es nivel 5 y el Baston pide 40 */
    it('avisa a Frodo que le falta nivel para el Baston', () => {
      iniciarSesion('frodo@comarca.me', 'frodo123')
      dibujar(8)

      expect(screen.getByText(/Nivel insuficiente. Tu nivel es 5/)).toBeTruthy()
      expect(boton().disabled).toBe(true)
    })

    /* REGLA 2: sin stock no se vende */
    it('avisa cuando no quedan unidades', () => {
      iniciarSesion('gandalf@istari.me', 'gandalf123')
      dibujar(4)

      fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '3' } })
      fireEvent.click(boton())        // se lleva las 3 que quedaban
      cleanup()

      dibujar(4)
      expect(screen.getByText('No quedan unidades de este objeto.')).toBeTruthy()
      expect(boton().disabled).toBe(true)
    })
  })

  describe('comprar', () => {
    it('agrega el objeto al carrito', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar(1)

      fireEvent.click(boton())

      expect(screen.getByText('Espada Dardo agregado al carrito.')).toBeTruthy()
      expect(cantidadItemsCarrito(4)).toBe(1)
    })

    /* REGLA 6: el stock baja de verdad */
    it('descuenta el stock', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar(1)

      fireEvent.click(boton())
      expect(stockDisponible(1)).toBe(4)   // era 5
    })

    it('respeta la cantidad elegida', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar(1)

      fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '3' } })
      fireEvent.click(boton())

      expect(cantidadItemsCarrito(4)).toBe(3)
      expect(stockDisponible(1)).toBe(2)
    })

    /* REGLA 8: se guarda el precio del momento */
    it('guarda el precio en el carrito', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar(1)

      fireEvent.click(boton())
      expect(totalVenta(ventaAbiertaDe(4).ventaId)).toBe(1500)
    })

    /* El carrito ES la venta ABIERTA: dos compras seguidas no
       abren dos ventas. */
    it('reutiliza el mismo carrito', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar(1)

      fireEvent.click(boton())
      const primera = ventaAbiertaDe(4).ventaId

      fireEvent.click(boton())
      expect(ventaAbiertaDe(4).ventaId).toBe(primera)
      expect(cantidadItemsCarrito(4)).toBe(2)
    })
  })
})
