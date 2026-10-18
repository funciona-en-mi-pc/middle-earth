import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Perfil from './Perfil.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { reiniciarDatos } from '../services/storage.js'
import { agregarProducto, confirmarVenta, crearVenta } from '../services/ventaService.js'

/* =========================================================
   Pruebas de Perfil.jsx — Javier, tarea #29
   ---------------------------------------------------------
   La pagina muestra cosas distintas segun el tipo, porque el
   SQL tiene dos tablas de personas.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Perfil />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* Lee la cifra que acompana a un rotulo del panel de datos */
const cifra = (rotulo) =>
  screen.getByText(rotulo).parentElement.querySelector('.n').textContent

describe('Perfil', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('un jugador', () => {
    beforeEach(() => iniciarSesion('aragorn@gondor.me', 'aragorn123'))

    it('muestra su nombre y su correo', () => {
      dibujar()
      expect(screen.getByRole('heading', { name: 'Aragorn' })).toBeTruthy()
      expect(screen.getByText('aragorn@gondor.me')).toBeTruthy()
    })

    it('muestra su nivel y su linaje', () => {
      dibujar()
      expect(cifra('Nivel')).toBe('25')
      expect(cifra('Linaje')).toBe('Humano')
    })

    it('empieza sin compras', () => {
      dibujar()
      expect(cifra('Compras confirmadas')).toBe('0')
    })

    /* Como FN_VENTAS_JUGADOR: solo cuentan las CONFIRMADAS */
    it('cuenta las compras confirmadas', () => {
      const { venta } = crearVenta(4)
      agregarProducto(venta.ventaId, 6, 1)
      confirmarVenta(venta.ventaId)

      dibujar()
      expect(cifra('Compras confirmadas')).toBe('1')
    })

    /* El carrito todavia abierto no es un pedido */
    it('no cuenta el carrito abierto', () => {
      const { venta } = crearVenta(4)
      agregarProducto(venta.ventaId, 6, 1)

      dibujar()
      expect(cifra('Compras confirmadas')).toBe('0')
      expect(cifra('Pedidos en total')).toBe('0')
    })

    it('enlaza a sus pedidos', () => {
      dibujar()
      expect(screen.getByText('Ver mis pedidos').getAttribute('href')).toBe('/mis-pedidos')
    })
  })

  describe('un mercader', () => {
    it('muestra su cargo, no su nivel', () => {
      iniciarSesion('elrond@rivendel.me', 'elrond123')
      dibujar()

      expect(cifra('Cargo')).toBe('ADMINISTRADOR')
      expect(screen.queryByText('Nivel')).toBeNull()
      expect(screen.queryByText('Linaje')).toBeNull()
    })

    /* Solo el ADMINISTRADOR crea, edita y borra en el panel */
    it('dice que Elrond puede administrar', () => {
      iniciarSesion('elrond@rivendel.me', 'elrond123')
      dibujar()
      expect(cifra('Puede administrar')).toBe('Si')
    })

    it('dice que Cebadilla NO puede administrar', () => {
      iniciarSesion('cebadilla@pony.me', 'cebadilla1')
      dibujar()
      expect(cifra('Cargo')).toBe('VENDEDOR')
      expect(cifra('Puede administrar')).toBe('No')
    })

    it('enlaza al panel', () => {
      iniciarSesion('elrond@rivendel.me', 'elrond123')
      dibujar()
      expect(screen.getByText('Ir al panel').getAttribute('href')).toBe('/admin')
    })
  })
})
