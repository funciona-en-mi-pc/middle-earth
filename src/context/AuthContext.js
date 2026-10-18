import { createContext } from 'react'

/* =========================================================
   AuthContext — la caja donde viaja la sesion
   ---------------------------------------------------------
   Un contexto de React es un valor que un componente deja
   disponible para TODOS los que tiene debajo, sin ir pasando
   props de padre a hijo uno por uno.

   Aqui dentro viaja { usuario, login, logout }.
     lo llena .... AuthProvider.jsx
     lo leen ..... los componentes, con el atajo useAuth.js

   Este archivo esta solo y sin JSX a proposito: la regla de
   lint react-refresh/only-export-components pide que un
   archivo con componentes no exporte ademas otras cosas.
   ========================================================= */

export const AuthContext = createContext(null)
