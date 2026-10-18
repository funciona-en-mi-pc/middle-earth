import { useMemo, useState } from 'react'

import { AuthContext } from './AuthContext.js'
import { cerrarSesion, iniciarSesion, usuarioActivo } from '../services/authService.js'

/* =========================================================
   AuthProvider — quien llena la caja de la sesion
   ---------------------------------------------------------
   Envuelve a toda la aplicacion (ver main.jsx) y mantiene en
   el estado de React quien tiene la sesion abierta.

   POR QUE HACE FALTA, SI YA ESTA EN localStorage
   Porque localStorage no avisa cuando cambia. Si la navbar
   lo leyera directamente, al iniciar sesion seguiria
   mostrando "Iniciar sesion" hasta recargar la pagina. Con
   useState, en cambio, React vuelve a dibujar solo todo lo
   que depende del usuario.

   useState(() => usuarioActivo())
   La funcion de dentro se ejecuta UNA sola vez, al arrancar.
   Asi, si cierras la pestana y vuelves, la sesion sigue
   abierta: el estado nace con lo que habia guardado.

   useMemo evita crear un objeto nuevo en cada dibujado. Sin
   el, todos los componentes que usan useAuth se volverian a
   dibujar aunque la sesion no hubiera cambiado.
   ========================================================= */

function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => usuarioActivo())

  const valor = useMemo(() => ({
    usuario,

    /* Devuelve el mismo { ok, error } del service, para que la
       pagina de login decida que mensaje mostrar. */
    login(email, password) {
      const intento = iniciarSesion(email, password)
      if (intento.ok) setUsuario(intento.usuario)
      return intento
    },

    logout() {
      cerrarSesion()
      setUsuario(null)
    },
  }), [usuario])

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
