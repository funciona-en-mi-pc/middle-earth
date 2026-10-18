import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import Registro from './Registro.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion } from '../services/authService.js'
import { buscarPorEmail, listarJugadores } from '../services/jugadorService.js'
import { reiniciarDatos } from '../services/storage.js'

/* =========================================================
   Pruebas de Registro.jsx — Javier, tarea #19
   ---------------------------------------------------------
   Comprueban el formulario completo: que valide, que no deje
   repetir el correo y que el jugador creado quede como manda
   el SQL (nivel 1 y ACTIVO).
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <AuthProvider>
        <Routes>
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<p>Estoy en el login</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function escribir(etiqueta, valor) {
  const campo = screen.getByLabelText(etiqueta)
  fireEvent.change(campo, { target: { value: valor } })
  fireEvent.blur(campo)
  return campo
}

/* Rellena el formulario entero con datos validos. */
function rellenar({ email = 'sam@comarca.me', password2 = 'sam12345' } = {}) {
  escribir(/^Nombre/, 'Samsagaz Gamyi')
  escribir(/^Correo/, email)
  escribir(/^Raza/, '1')
  escribir(/^Contrasena/, 'sam12345')
  escribir(/^Repite la contrasena/, password2)
}

const enviar = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Crear mi heroe' }))

describe('Registro', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('lo que se ve al entrar', () => {
    it('dibuja los cinco campos', () => {
      dibujar()
      expect(screen.getByLabelText(/^Nombre/)).toBeTruthy()
      expect(screen.getByLabelText(/^Correo/)).toBeTruthy()
      expect(screen.getByLabelText(/^Raza/)).toBeTruthy()
      expect(screen.getByLabelText(/^Contrasena/)).toBeTruthy()
      expect(screen.getByLabelText(/^Repite la contrasena/)).toBeTruthy()
    })

    /* Las razas salen de la tabla RAZA, no de una lista escrita
       a mano: si manana se agrega una, aparece sola. */
    it('llena el desplegable con las razas del SQL', () => {
      dibujar()
      expect(screen.getByText('Hobbit')).toBeTruthy()
      expect(screen.getByText('Elfo')).toBeTruthy()
      expect(screen.getByText('Mago')).toBeTruthy()
    })

    it('enlaza al login', () => {
      dibujar()
      expect(screen.getByText('Entra al reino').getAttribute('href')).toBe('/login')
    })
  })

  describe('validacion', () => {
    it('marca todos los campos al enviar el formulario vacio', () => {
      dibujar()
      enviar()

      expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy()
      expect(screen.getByText('El correo es obligatorio.')).toBeTruthy()
      expect(screen.getByText('Elige una raza.')).toBeTruthy()
      expect(screen.getByText('La contrasena es obligatoria.')).toBeTruthy()
      expect(screen.getByText('Confirma la contrasena.')).toBeTruthy()
    })

    it('no crea nada si el formulario esta mal', () => {
      dibujar()
      enviar()
      expect(listarJugadores().length).toBe(6)
    })

    it('avisa cuando las contrasenas no coinciden', () => {
      dibujar()
      rellenar({ password2: 'otraclave' })
      enviar()

      expect(screen.getByText('Las contrasenas no coinciden.')).toBeTruthy()
      expect(listarJugadores().length).toBe(6)
    })

    it('avisa cuando el correo no tiene forma de correo', () => {
      dibujar()
      escribir(/^Correo/, 'sam.comarca')
      expect(screen.getByText(/Escribe un correo valido/)).toBeTruthy()
    })
  })

  describe('al crear la cuenta', () => {
    it('crea al jugador con los datos del formulario', () => {
      dibujar()
      rellenar()
      enviar()

      const creado = buscarPorEmail('sam@comarca.me')
      expect(creado).not.toBeNull()
      expect(creado.nombre).toBe('Samsagaz Gamyi')
      expect(creado.razaId).toBe(1)
    })

    /* El registro publico siempre crea nivel 1 y ACTIVO:
       el nivel y el estado solo se tocan desde el panel. */
    it('lo crea en nivel 1 y ACTIVO', () => {
      dibujar()
      rellenar()
      enviar()

      const creado = buscarPorEmail('sam@comarca.me')
      expect(creado.nivel).toBe(1)
      expect(creado.estado).toBe('ACTIVO')
    })

    it('avisa que la cuenta quedo creada', () => {
      dibujar()
      rellenar()
      enviar()

      expect(screen.getByText('Cuenta creada. Ya puedes entrar al reino.')).toBeTruthy()
    })

    /* UNIQUE de la columna email -> error -20012 del SQL */
    it('no deja usar un correo que ya existe', () => {
      dibujar()
      rellenar({ email: 'aragorn@gondor.me' })
      enviar()

      expect(screen.getByText('Ese correo ya tiene una cuenta en el reino.')).toBeTruthy()
      expect(listarJugadores().length).toBe(6)
    })
  })
})
