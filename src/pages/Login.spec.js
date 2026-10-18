import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import Login from './Login.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { reiniciarDatos } from '../services/storage.js'

/* =========================================================
   Pruebas de Login.jsx — Javier, tarea #19
   ---------------------------------------------------------
   Prueba de COMPONENTE: Karma lo dibuja en un Chrome de
   verdad, asi que se comprueba lo que vera el usuario.

   DOS ENVOLTORIOS OBLIGATORIOS
     MemoryRouter ... la pagina usa <Link>, useNavigate y
                      useSearchParams, que necesitan un router.
                      initialEntries deja fijar la URL de
                      partida, para probar ?motivo=...
     AuthProvider ... la pagina llama a useAuth(), que revienta
                      a proposito si no hay proveedor.

   fireEvent.change simula escribir y fireEvent.blur simula
   salir del campo, que es cuando se valida.

   Las rutas de destino se declaran de mentira, con un texto
   dentro, para poder comprobar A DONDE lleva cada login sin
   dibujar la tienda ni el panel de verdad.

   El archivo se llama .spec.js aunque tenga JSX: karma-esbuild
   cambia siempre la extension a .js, asi que un .spec.jsx no
   lo encontraria.
   ========================================================= */

function dibujar(ruta = '/login') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<p>Estoy en la tienda</p>} />
          <Route path="/admin" element={<p>Estoy en el panel</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* Atajo: escribe en un campo y sale de el. */
function escribir(etiqueta, valor) {
  const campo = screen.getByLabelText(etiqueta)
  fireEvent.change(campo, { target: { value: valor } })
  fireEvent.blur(campo)
  return campo
}

describe('Login', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('lo que se ve al entrar', () => {
    it('dibuja el formulario', () => {
      dibujar()
      expect(screen.getByRole('heading', { name: 'Iniciar sesion' })).toBeTruthy()
      expect(screen.getByLabelText(/Correo/)).toBeTruthy()
      expect(screen.getByLabelText(/Contrasena/)).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Entrar al reino' })).toBeTruthy()
    })

    it('enlaza al registro', () => {
      dibujar()
      expect(screen.getByText('Crea tu heroe').getAttribute('href')).toBe('/registro')
    })

    it('no muestra ninguna alerta si se llega sin motivo', () => {
      dibujar()
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  /* El motivo viaja en la URL cuando otra pagina nos rebota
     aqui: /login?motivo=sin-permiso */
  describe('el motivo de la URL', () => {
    it('explica que hay que iniciar sesion', () => {
      dibujar('/login?motivo=entra-primero')
      expect(screen.getByText('Inicia sesion para continuar.')).toBeTruthy()
    })

    /* "sin-permiso" ya no es un motivo del login: ese caso lo
       explica RutaProtegida en su propia pantalla, porque
       quien lo provoca YA tiene sesion y el redirect de abajo
       lo sacaria de aqui antes de leer nada. */
    it('ignora el motivo sin-permiso, que ahora explica RutaProtegida', () => {
      dibujar('/login?motivo=sin-permiso')
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('explica que hay que entrar para comprar', () => {
      dibujar('/login?motivo=compra')
      expect(screen.getByText('Inicia sesion para terminar tu compra.')).toBeTruthy()
    })

    it('ignora un motivo que no conoce', () => {
      dibujar('/login?motivo=cualquier-cosa')
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  describe('validacion de los campos', () => {
    it('marca los dos campos al enviar el formulario vacio', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Entrar al reino' }))

      expect(screen.getByText('El correo es obligatorio.')).toBeTruthy()
      expect(screen.getByText('La contrasena es obligatoria.')).toBeTruthy()
      expect(screen.getByText('Revisa los campos marcados antes de continuar.')).toBeTruthy()
    })

    it('avisa cuando el correo no tiene forma de correo', () => {
      dibujar()
      escribir(/Correo/, 'aragorn.me')
      expect(screen.getByText(/Escribe un correo valido/)).toBeTruthy()
    })

    it('avisa cuando la contrasena es muy corta', () => {
      dibujar()
      escribir(/Contrasena/, 'abc')
      expect(screen.getByText(/al menos 4 caracteres/)).toBeTruthy()
    })

    /* Mientras escribe solo corregimos lo que ya estaba en
       rojo: asi no se regana por la primera letra, pero el
       error desaparece en cuanto se arregla. */
    it('el error desaparece al corregir el campo', () => {
      dibujar()
      const correo = escribir(/Correo/, 'aragorn.me')
      expect(screen.getByText(/Escribe un correo valido/)).toBeTruthy()

      fireEvent.change(correo, { target: { value: 'aragorn@gondor.me' } })
      expect(screen.queryByText(/Escribe un correo valido/)).toBeNull()
    })
  })

  describe('al intentar entrar', () => {
    it('avisa cuando la contrasena no corresponde', () => {
      dibujar()
      escribir(/Correo/, 'aragorn@gondor.me')
      escribir(/Contrasena/, 'malaclave')
      fireEvent.click(screen.getByRole('button', { name: 'Entrar al reino' }))

      expect(screen.getByText('Correo o contrasena incorrectos.')).toBeTruthy()
    })

    /* REGLA 1 del SQL: solo entran cuentas ACTIVAS */
    it('rechaza a Boromir por estar INACTIVO', () => {
      dibujar()
      escribir(/Correo/, 'boromir@gondor.me')
      escribir(/Contrasena/, 'boromir123')
      fireEvent.click(screen.getByRole('button', { name: 'Entrar al reino' }))

      expect(screen.getByText('Jugador inexistente o inactivo.')).toBeTruthy()
    })

    it('lleva al JUGADOR a la tienda', () => {
      dibujar()
      escribir(/Correo/, 'aragorn@gondor.me')
      escribir(/Contrasena/, 'aragorn123')
      fireEvent.click(screen.getByRole('button', { name: 'Entrar al reino' }))

      expect(screen.getByText('Estoy en la tienda')).toBeTruthy()
    })

    it('lleva al MERCADER al panel', () => {
      dibujar()
      escribir(/Correo/, 'elrond@rivendel.me')
      escribir(/Contrasena/, 'elrond123')
      fireEvent.click(screen.getByRole('button', { name: 'Entrar al reino' }))

      expect(screen.getByText('Estoy en el panel')).toBeTruthy()
    })

    /* Quien ya tenia la sesion abierta no vuelve a ver el
       formulario: el mismo <Navigate> se encarga. */
    it('no muestra el formulario a quien ya entro', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar()

      expect(screen.queryByRole('button', { name: 'Entrar al reino' })).toBeNull()
      expect(screen.getByText('Estoy en la tienda')).toBeTruthy()
    })
  })
})
