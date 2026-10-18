import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import RutaProtegida from './RutaProtegida.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { reiniciarDatos } from '../services/storage.js'

/* =========================================================
   Pruebas de RutaProtegida.jsx — Javier, tarea #29
   ---------------------------------------------------------
   Es el portero de las rutas. Lo que hay que comprobar es a
   DONDE manda a cada uno, asi que se monta un mapa de rutas
   de mentira con un texto en cada destino.

   ========================================================= */

function dibujar(ruta, tipo) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Me mandaron al login</p>} />
          <Route element={<RutaProtegida tipo={tipo} />}>
            <Route path="/secreta" element={<p>Entre a la pagina secreta</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const entre = () => screen.queryByText('Entre a la pagina secreta') !== null
const rebotado = () => screen.queryByText('Me mandaron al login') !== null

describe('RutaProtegida', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('sin indicar tipo: basta con tener sesion', () => {
    it('rebota al login a quien no ha entrado', () => {
      dibujar('/secreta')
      expect(entre()).toBe(false)
      expect(rebotado()).toBe(true)
    })

    it('deja pasar a un jugador', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar('/secreta')
      expect(entre()).toBe(true)
    })

    it('deja pasar tambien a un mercader', () => {
      iniciarSesion('elrond@rivendel.me', 'elrond123')
      dibujar('/secreta')
      expect(entre()).toBe(true)
    })
  })

  describe('tipo="JUGADOR"', () => {
    it('deja pasar al jugador', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar('/secreta', 'JUGADOR')
      expect(entre()).toBe(true)
    })

    /* En el SQL, VENTA.jugador_id es NOT NULL: el carrito y
       los pedidos son cosa de jugadores. */
    it('rebota al mercader', () => {
      iniciarSesion('elrond@rivendel.me', 'elrond123')
      dibujar('/secreta', 'JUGADOR')
      expect(entre()).toBe(false)
      expect(rebotado()).toBe(true)
    })
  })

  describe('tipo="MERCADER"', () => {
    it('deja pasar al mercader', () => {
      iniciarSesion('elrond@rivendel.me', 'elrond123')
      dibujar('/secreta', 'MERCADER')
      expect(entre()).toBe(true)
    })

    /* Es lo que hacia exigirAdministrador() en el mockup */
    it('rebota al jugador que escribe /admin en la URL', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar('/secreta', 'MERCADER')
      expect(entre()).toBe(false)
      expect(rebotado()).toBe(true)
    })

    /* VENDEDOR y HERRERO entran al panel; lo que no pueden es
       crear, editar ni borrar. Eso lo decide cada pagina. */
    it('deja pasar a un mercader que no es administrador', () => {
      iniciarSesion('cebadilla@pony.me', 'cebadilla1')
      dibujar('/secreta', 'MERCADER')
      expect(entre()).toBe(true)
    })
  })

  it('al cerrar la sesion deja de dejar pasar', () => {
    iniciarSesion('aragorn@gondor.me', 'aragorn123')
    cerrarSesion()
    dibujar('/secreta')
    expect(entre()).toBe(false)
  })
})
