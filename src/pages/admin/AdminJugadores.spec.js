import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AdminJugadores from './AdminJugadores.jsx'
import AuthProvider from '../../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../../services/authService.js'
import { listarJugadores, obtenerJugador } from '../../services/jugadorService.js'
import { reiniciarDatos } from '../../services/storage.js'
import { agregarProducto, crearVenta } from '../../services/ventaService.js'

/* =========================================================
   Pruebas de AdminJugadores.jsx — Javier, tarea #29
   ---------------------------------------------------------
   El CRUD de JUGADOR desde el panel, con las reglas de los
   SP_*_JUGADOR del SQL.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminJugadores />
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

/* Borrar ahora son dos pasos: pulsar Eliminar en la fila y
   confirmar en el dialogo. */
const confirmarBorrado = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Si, eliminar' }))

const borrarDeVerdad = (nombre) => {
  pulsarEn(nombre, 'Eliminar')
  confirmarBorrado()
}


describe('AdminJugadores', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('elrond@rivendel.me', 'elrond123')   // ADMINISTRADOR
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('la tabla', () => {
    it('lista los seis jugadores del SQL', () => {
      dibujar()
      expect(screen.getByText('Aragorn')).toBeTruthy()
      expect(screen.getByText('Frodo Bolson')).toBeTruthy()
    })

    it('muestra la raza y el nivel', () => {
      dibujar()
      const suya = within(fila('Aragorn'))

      expect(suya.getByText('Humano')).toBeTruthy()
      expect(suya.getByText('25')).toBeTruthy()
    })

    /* Aqui si se ven los INACTIVOS, para poder reactivarlos */
    it('muestra tambien a Boromir, que esta INACTIVO', () => {
      dibujar()
      expect(within(fila('Boromir')).getByText('INACTIVO')).toBeTruthy()
    })
  })

  describe('crear', () => {
    /* Igual que el registro publico: nivel 1 y ACTIVO */
    it('crea al jugador en nivel 1 y ACTIVO', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo jugador' }))

      escribir(/^Nombre/, 'Samsagaz Gamyi')
      escribir(/^Correo/, 'sam@comarca.me')
      escribir(/^Raza/, '1')
      escribir(/^Contrasena/, 'sam12345')
      guardar()

      const creado = listarJugadores().find((j) => j.email === 'sam@comarca.me')
      expect(creado.nivel).toBe(1)
      expect(creado.estado).toBe('ACTIVO')
    })

    it('no deja repetir el correo', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo jugador' }))

      escribir(/^Nombre/, 'Impostor')
      escribir(/^Correo/, 'aragorn@gondor.me')
      escribir(/^Raza/, '1')
      escribir(/^Contrasena/, 'clave123')
      guardar()

      expect(screen.getByText('Ese correo ya tiene una cuenta en el reino.')).toBeTruthy()
      expect(listarJugadores().length).toBe(6)
    })

    it('no crea nada con el formulario vacio', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo jugador' }))
      guardar()

      expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy()
      expect(screen.getByText('Elige una raza.')).toBeTruthy()
      expect(listarJugadores().length).toBe(6)
    })
  })

  describe('editar', () => {
    /* Aqui si se puede cambiar el nivel: es la diferencia con
       el registro publico. */
    it('sube de nivel a Frodo', () => {
      dibujar()
      pulsarEn('Frodo Bolson', 'Editar')

      escribir(/^Nivel/, '6')
      guardar()

      expect(obtenerJugador(1).nivel).toBe(6)
    })

    /* CHECK (nivel > 0) de la tabla JUGADOR */
    it('no acepta un nivel cero', () => {
      dibujar()
      pulsarEn('Frodo Bolson', 'Editar')

      escribir(/^Nivel/, '0')
      guardar()

      expect(screen.getByText('El nivel debe ser mayor que cero.')).toBeTruthy()
      expect(obtenerJugador(1).nivel).toBe(5)
    })

    /* Contrasena vacia = no se cambia */
    it('mantiene la contrasena si se deja vacia', () => {
      dibujar()
      pulsarEn('Frodo Bolson', 'Editar')

      escribir(/^Nivel/, '7')
      guardar()

      expect(obtenerJugador(1).password).toBe('frodo123')
    })

    it('inactivar lo saca de las ventas nuevas', () => {
      dibujar()
      pulsarEn('Aragorn', 'Inactivar')

      expect(obtenerJugador(4).estado).toBe('INACTIVO')
      expect(screen.getByText(/ahora esta INACTIVO/)).toBeTruthy()
    })

    it('y se puede volver a activar', () => {
      dibujar()
      pulsarEn('Boromir', 'Activar')
      expect(obtenerJugador(6).estado).toBe('ACTIVO')
    })
  })

  /* REGLA 9 — prueba 15.9 del script SQL */
  describe('eliminar', () => {
    it('borra a quien no tiene ventas, tras confirmar', () => {
      dibujar()
      borrarDeVerdad('Gimli')

      expect(screen.getByText('Gimli eliminado.')).toBeTruthy()
      expect(listarJugadores().length).toBe(5)
    })

    /* El paso que evita el clic de mas */
    it('pregunta antes de borrar', () => {
      dibujar()
      pulsarEn('Gimli', 'Eliminar')

      expect(screen.getByText('Confirmar')).toBeTruthy()
      expect(listarJugadores().length).toBe(6)   // todavia no borro nada
    })

    it('si se cancela, no borra', () => {
      dibujar()
      pulsarEn('Gimli', 'Eliminar')
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

      expect(listarJugadores().length).toBe(6)
    })

    it('el dialogo sugiere inactivar en vez de borrar', () => {
      dibujar()
      pulsarEn('Gimli', 'Eliminar')

      expect(screen.getByText(/conserva su historial/)).toBeTruthy()
    })

    it('NO borra a quien tiene ventas', () => {
      const { venta } = crearVenta(4)        // Aragorn
      agregarProducto(venta.ventaId, 6, 1)

      dibujar()
      borrarDeVerdad('Aragorn')

      expect(screen.getByText(/Dejalo INACTIVO/)).toBeTruthy()
      expect(obtenerJugador(4)).not.toBeNull()
    })
  })

  describe('permisos', () => {
    it('un VENDEDOR no ve los botones de accion', () => {
      cerrarSesion()
      iniciarSesion('cebadilla@pony.me', 'cebadilla1')
      dibujar()

      expect(screen.queryByRole('button', { name: 'Nuevo jugador' })).toBeNull()
      expect(screen.getByText(/Solo un ADMINISTRADOR/)).toBeTruthy()
    })

    it('pero si ve la tabla', () => {
      cerrarSesion()
      iniciarSesion('cebadilla@pony.me', 'cebadilla1')
      dibujar()
      expect(screen.getByText('Aragorn')).toBeTruthy()
    })
  })
})
