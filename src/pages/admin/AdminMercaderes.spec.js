import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AdminMercaderes from './AdminMercaderes.jsx'
import AuthProvider from '../../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../../services/authService.js'
import { listarMercaderes, obtenerMercader } from '../../services/mercaderService.js'
/* `guardar` de storage se renombra: abajo hay un atajo que
   tambien se llama guardar y pulsa el boton del formulario. */
import { CLAVES, guardar as guardarEnBD, reiniciarDatos } from '../../services/storage.js'

/* =========================================================
   Pruebas de AdminMercaderes.jsx — Javier, tarea #29
   ---------------------------------------------------------
   El CRUD de MERCADER. Lo mas interesante de probar es la
   proteccion del ultimo administrador, que el SQL no tiene.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminMercaderes />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const fila = (nombre) => screen.getByText(nombre).closest('tr')
const pulsarEn = (nombre, boton) =>
  fireEvent.click(within(fila(nombre)).getByRole('button', { name: boton }))
const escribir = (etiqueta, valor) =>
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
const guardar = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

function rellenarNuevo(cargo = 'VENDEDOR') {
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo mercader' }))
  escribir(/^Nombre/, 'Barliman')
  escribir(/^Correo/, 'barliman@bree.me')
  escribir(/^Cargo/, cargo)
  escribir(/^Contrasena/, 'barli123')
  guardar()
}

describe('AdminMercaderes', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('elrond@rivendel.me', 'elrond123')
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('la tabla', () => {
    it('lista los cuatro mercaderes del SQL', () => {
      dibujar()
      expect(screen.getByText('Elrond')).toBeTruthy()
      expect(screen.getByText('Cebadilla Mantecona')).toBeTruthy()
      expect(screen.getByText('Grimbold Martillo')).toBeTruthy()
    })

    it('muestra el cargo de cada uno', () => {
      dibujar()
      expect(within(fila('Elrond')).getByText('ADMINISTRADOR')).toBeTruthy()
      expect(within(fila('Grimbold Martillo')).getByText('HERRERO')).toBeTruthy()
    })

    it('muestra a Grima, que esta INACTIVO', () => {
      dibujar()
      expect(within(fila('Grima Lengua de Serpiente')).getByText('INACTIVO')).toBeTruthy()
    })
  })

  describe('crear', () => {
    it('crea el mercader con su cargo, ACTIVO', () => {
      dibujar()
      rellenarNuevo('HERRERO')

      const creado = listarMercaderes().find((m) => m.email === 'barliman@bree.me')
      expect(creado.cargo).toBe('HERRERO')
      expect(creado.estado).toBe('ACTIVO')
      expect(screen.getByText(/creado como HERRERO/)).toBeTruthy()
    })

    it('no deja repetir el correo', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo mercader' }))
      escribir(/^Nombre/, 'Impostor')
      escribir(/^Correo/, 'elrond@rivendel.me')
      escribir(/^Cargo/, 'VENDEDOR')
      escribir(/^Contrasena/, 'clave123')
      guardar()

      expect(screen.getByText('Ese correo ya tiene una cuenta en el reino.')).toBeTruthy()
      expect(listarMercaderes().length).toBe(4)
    })

    it('exige elegir un cargo', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo mercader' }))
      guardar()

      expect(screen.getByText('Elige un cargo.')).toBeTruthy()
      expect(listarMercaderes().length).toBe(4)
    })
  })

  describe('editar', () => {
    it('cambia el cargo', () => {
      dibujar()
      pulsarEn('Cebadilla Mantecona', 'Editar')
      escribir(/^Cargo/, 'HERRERO')
      guardar()

      expect(obtenerMercader(1).cargo).toBe('HERRERO')
    })

    it('mantiene la contrasena si se deja vacia', () => {
      dibujar()
      pulsarEn('Cebadilla Mantecona', 'Editar')
      escribir(/^Cargo/, 'HERRERO')
      guardar()

      expect(obtenerMercader(1).password).toBe('cebadilla1')
    })

    it('inactivar a un VENDEDOR si se puede', () => {
      dibujar()
      pulsarEn('Cebadilla Mantecona', 'Inactivar')
      expect(obtenerMercader(1).estado).toBe('INACTIVO')
    })
  })

  /* La proteccion que el SQL no tiene: sin administrador
     activo, nadie podria volver a administrar nada. */
  describe('el ultimo administrador', () => {
    const AVISO = 'No puedes dejar el reino sin ningun ADMINISTRADOR activo.'

    it('no deja inactivar al unico administrador', () => {
      dibujar()
      pulsarEn('Elrond', 'Inactivar')

      expect(screen.getByText(AVISO)).toBeTruthy()
      expect(obtenerMercader(2).estado).toBe('ACTIVO')
    })

    it('no deja quitarle el cargo', () => {
      dibujar()
      pulsarEn('Elrond', 'Editar')
      escribir(/^Cargo/, 'VENDEDOR')
      guardar()

      expect(screen.getByText(AVISO)).toBeTruthy()
      expect(obtenerMercader(2).cargo).toBe('ADMINISTRADOR')
    })

    it('no deja borrarlo', () => {
      dibujar()
      pulsarEn('Elrond', 'Eliminar')

      expect(screen.getByText(AVISO)).toBeTruthy()
      expect(listarMercaderes().length).toBe(4)
    })

    it('pero con un segundo administrador si se puede', () => {
      dibujar()
      rellenarNuevo('ADMINISTRADOR')

      pulsarEn('Elrond', 'Inactivar')
      expect(obtenerMercader(2).estado).toBe('INACTIVO')
    })
  })

  /* REGLA 9 */
  describe('eliminar', () => {
    it('borra a quien no atendio ventas', () => {
      dibujar()
      pulsarEn('Grimbold Martillo', 'Eliminar')

      expect(screen.getByText('Grimbold Martillo eliminado.')).toBeTruthy()
      expect(listarMercaderes().length).toBe(3)
    })

    it('NO borra a quien atendio ventas', () => {
      /* Cebadilla es el mercader 1: atendio la venta 1001 */
      guardarEnBD(CLAVES.ventas, [
        { ventaId: 1001, jugadorId: 4, mercaderId: 1, estado: 'CONFIRMADA' },
      ])

      dibujar()
      pulsarEn('Cebadilla Mantecona', 'Eliminar')

      expect(screen.getByText(/Dejalo INACTIVO/)).toBeTruthy()
      expect(obtenerMercader(1)).not.toBeNull()
    })
  })

  describe('permisos', () => {
    it('un VENDEDOR no ve los botones de accion', () => {
      cerrarSesion()
      iniciarSesion('cebadilla@pony.me', 'cebadilla1')
      dibujar()

      expect(screen.queryByRole('button', { name: 'Nuevo mercader' })).toBeNull()
      expect(screen.getByText(/Solo un ADMINISTRADOR/)).toBeTruthy()
    })
  })
})
