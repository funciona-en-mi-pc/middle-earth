import { useContext } from 'react'

import { AuthContext } from './AuthContext.js'

/* =========================================================
   useAuth — el atajo para leer la sesion
   ---------------------------------------------------------
   USO, desde cualquier componente:

     const { usuario, login, logout } = useAuth()

     usuario ... el que entro, o null si no hay nadie
     login ..... (email, password) => { ok, usuario } | { ok, error }
     logout .... cierra la sesion

   Un "hook" es una funcion que empieza por use y que da
   acceso a las capacidades de React. Este envuelve a
   useContext para no tener que importar el contexto en cada
   pagina, y de paso avisa si alguien lo usa fuera del
   proveedor, que es el error tipico y dificil de encontrar.
   ========================================================= */

export function useAuth() {
  const valor = useContext(AuthContext)

  if (valor === null) {
    throw new Error('useAuth se uso fuera de <AuthProvider>. Revisa main.jsx.')
  }

  return valor
}
