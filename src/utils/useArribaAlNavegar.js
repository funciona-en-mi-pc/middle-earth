import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/* =========================================================
   useArribaAlNavegar — cada pagina nueva empieza arriba
   ---------------------------------------------------------
   DUENO: Javier

   React Router cambia la pagina pero no mueve el scroll: si
   estabas a 700 px en el catalogo y pasabas a Inicio, Inicio
   se abria a 700 px, a mitad de pagina.

   Solo sube en las navegaciones nuevas (PUSH y REPLACE). Con
   el boton Atras (POP) no hace nada: ahi el navegador ya
   devuelve al usuario a donde estaba, que es lo que espera.
   ========================================================= */

export function useArribaAlNavegar() {
  const { pathname } = useLocation()
  const tipo = useNavigationType()

  useEffect(() => {
    if (tipo !== 'POP') window.scrollTo(0, 0)
  }, [pathname, tipo])
}
