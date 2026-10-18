import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import AuthProvider from './AuthProvider.jsx'
import { useAuth } from './useAuth.js'
import { cerrarSesion, usuarioActivo } from '../services/authService.js'
import { reiniciarDatos } from '../services/storage.js'

/* =========================================================
   Pruebas del contexto de sesion — Javier, tarea #36
   ---------------------------------------------------------
   Completan lo que faltaba por probar del contexto: el aviso
   de useAuth fuera del proveedor, y el logout.

   Hace falta un componente de mentira porque useAuth es un
   hook: solo se puede llamar dentro de un componente.
   ========================================================= */

/* Muestra el estado de la sesion y deja operarla */
function Espia() {
  const { usuario, login, logout } = useAuth()

  return (
    <div>
      <p>{usuario ? `Dentro: ${usuario.nombre}` : 'Nadie ha entrado'}</p>
      <button type="button" onClick={() => login('aragorn@gondor.me', 'aragorn123')}>
        Entrar bien
      </button>
      <button type="button" onClick={() => login('aragorn@gondor.me', 'mala')}>
        Entrar mal
      </button>
      <button type="button" onClick={logout}>Salir</button>
    </div>
  )
}

const pulsar = (texto) => fireEvent.click(screen.getByRole('button', { name: texto }))
const dentro = () => screen.queryByText(/^Dentro:/)?.textContent ?? null

describe('contexto de sesion', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  /* El error tipico y dificil de encontrar: usar useAuth sin
     haber envuelto la app con AuthProvider. El hook avisa a
     proposito, en vez de devolver undefined y romperse mas
     adelante con un mensaje que no dice nada. */
  describe('useAuth fuera del proveedor', () => {
    it('avisa con un mensaje claro', () => {
      /* React escribe el error en la consola aunque la prueba
         lo capture; se silencia para no ensuciar la salida. */
      spyOn(console, 'error')

      expect(() => render(<Espia />))
        .toThrowError(/useAuth se uso fuera de <AuthProvider>/)
    })
  })

  describe('dentro del proveedor', () => {
    const dibujar = () => render(
      <AuthProvider>
        <Espia />
      </AuthProvider>,
    )

    it('empieza sin nadie dentro', () => {
      dibujar()
      expect(screen.getByText('Nadie ha entrado')).toBeTruthy()
    })

    it('login deja al usuario en el contexto', () => {
      dibujar()
      pulsar('Entrar bien')
      expect(dentro()).toBe('Dentro: Aragorn')
    })

    it('un login fallido no cambia nada', () => {
      dibujar()
      pulsar('Entrar mal')
      expect(screen.getByText('Nadie ha entrado')).toBeTruthy()
    })

    it('logout saca al usuario del contexto', () => {
      dibujar()
      pulsar('Entrar bien')
      expect(dentro()).toBe('Dentro: Aragorn')

      pulsar('Salir')
      expect(screen.getByText('Nadie ha entrado')).toBeTruthy()
    })

    /* El contexto y el localStorage tienen que ir a la par */
    it('logout tambien borra la sesion guardada', () => {
      dibujar()
      pulsar('Entrar bien')
      expect(usuarioActivo()).not.toBeNull()

      pulsar('Salir')
      expect(usuarioActivo()).toBeNull()
    })

    /* Al arrancar, el estado nace de lo que habia guardado:
       por eso recargar la pagina no cierra la sesion. */
    it('si ya habia sesion guardada, arranca dentro', () => {
      localStorage.setItem('me_sesion', JSON.stringify({ tipo: 'JUGADOR', id: 4 }))
      dibujar()

      expect(dentro()).toBe('Dentro: Aragorn')
    })
  })
})
