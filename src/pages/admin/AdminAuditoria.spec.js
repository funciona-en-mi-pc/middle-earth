import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AdminAuditoria from './AdminAuditoria.jsx'
import AuthProvider from '../../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../../services/authService.js'
import { reponerStock } from '../../services/inventarioService.js'
import { actualizarProducto } from '../../services/productoService.js'
import { reiniciarDatos } from '../../services/storage.js'

/* =========================================================
   Pruebas de AdminAuditoria.jsx — Javier, tarea #29
   ---------------------------------------------------------
   La pagina solo MIRA: las filas las escribe el service de
   Jose, al que llama productoService.actualizarProducto. Es
   lo mismo que en Oracle, donde la auditoria la llena el
   trigger y nadie escribe en esa tabla a mano.

   Por eso estas pruebas provocan los cambios con
   actualizarProducto y comprueban que la pagina los muestra.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminAuditoria />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* Las busquedas van acotadas al cuerpo de la tabla: el
   nombre de un objeto sale tambien en el desplegable del
   filtro, y getByText encontraria los dos. */
const cuerpo = () => document.querySelector('tbody')
const fila = (texto) => within(cuerpo()).getByText(texto).closest('tr')
const filas = () => (cuerpo() ? cuerpo().querySelectorAll('tr').length : 0)

describe('AdminAuditoria', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('elrond@rivendel.me', 'elrond123')
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  it('avisa cuando no se ha cambiado nada', () => {
    dibujar()
    expect(screen.getByText(/Todavia no se ha cambiado ningun precio/)).toBeTruthy()
  })

  /* Prueba 14.1 del script SQL */
  describe('un cambio de precio', () => {
    it('muestra el valor anterior y el nuevo, en oro', () => {
      actualizarProducto(1, { precio: 1700 })   // Espada Dardo: 1500 -> 1700
      dibujar()

      const suya = within(fila('Espada Dardo'))
      expect(suya.getByText('PRECIO')).toBeTruthy()
      expect(suya.getByText('1.500 oro')).toBeTruthy()
      expect(suya.getByText('1.700 oro')).toBeTruthy()
    })

    it('anota quien lo hizo', () => {
      actualizarProducto(1, { precio: 1700 })
      dibujar()

      expect(screen.getByText('elrond@rivendel.me')).toBeTruthy()
    })
  })

  describe('un cambio de estado', () => {
    it('muestra ACTIVO y INACTIVO tal cual, sin formato de oro', () => {
      actualizarProducto(3, { estado: 'INACTIVO' })   // Hacha Enana
      dibujar()

      const suya = within(fila('Hacha Enana'))
      expect(suya.getByText('ESTADO')).toBeTruthy()
      expect(suya.getByText('ACTIVO')).toBeTruthy()
      expect(suya.getByText('INACTIVO')).toBeTruthy()
    })
  })

  /* Prueba 14.1: los dos cambios juntos dan dos filas */
  it('cuenta los cambios registrados', () => {
    actualizarProducto(1, { precio: 1700 })
    actualizarProducto(3, { estado: 'INACTIVO' })

    dibujar()
    expect(filas()).toBe(2)
    expect(screen.getByText('Cambios registrados').parentElement.querySelector('.n').textContent)
      .toBe('2')
  })

  /* Prueba 14.2: un precio invalido no llega a cambiar nada */
  it('un precio invalido no deja rastro', () => {
    actualizarProducto(1, { precio: -11000 })
    dibujar()

    expect(screen.getByText(/Todavia no se ha cambiado ningun precio/)).toBeTruthy()
  })

  it('guardar sin cambiar nada no agrega filas', () => {
    actualizarProducto(1, { precio: 1500, estado: 'ACTIVO' })
    dibujar()

    expect(screen.getByText(/Todavia no se ha cambiado ningun precio/)).toBeTruthy()
  })

  /* El stock tiene su propio historial: MOVIMIENTO_STOCK */
  it('los cambios de stock no salen aqui', () => {
    reponerStock(1, 10)
    dibujar()

    expect(screen.getByText(/Todavia no se ha cambiado ningun precio/)).toBeTruthy()
  })

  describe('filtros', () => {
    beforeEach(() => {
      actualizarProducto(1, { precio: 1700 })
      actualizarProducto(1, { estado: 'INACTIVO' })
      actualizarProducto(3, { precio: 2000 })
    })

    it('sin filtros muestra los tres cambios', () => {
      dibujar()
      expect(filas()).toBe(3)
    })

    it('filtra por campo', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'PRECIO' }))
      expect(filas()).toBe(2)
    })

    it('filtra por objeto', () => {
      dibujar()
      fireEvent.change(screen.getByLabelText('Filtrar por objeto'), { target: { value: '1' } })
      expect(filas()).toBe(2)
    })

    it('los dos filtros se combinan', () => {
      dibujar()
      fireEvent.change(screen.getByLabelText('Filtrar por objeto'), { target: { value: '1' } })
      fireEvent.click(screen.getByRole('button', { name: 'ESTADO' }))
      expect(filas()).toBe(1)
    })
  })

  /* La pagina no cambia nada, asi que cualquier mercader
     puede consultarla. */
  it('un VENDEDOR tambien puede consultarla', () => {
    actualizarProducto(1, { precio: 1700 })
    cerrarSesion()
    iniciarSesion('cebadilla@pony.me', 'cebadilla1')

    dibujar()
    expect(filas()).toBe(1)
  })
})
