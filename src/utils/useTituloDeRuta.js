import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* =========================================================
   useTituloDeRuta — el titulo de la pestana del navegador
   ---------------------------------------------------------
   DUENO: Javier · mejora de UX del Hito 4

   Antes, la pestana decia siempre "Middle-earth: The Lost
   Age", estuvieras donde estuvieras. Con varias pestanas
   abiertas no se sabia cual era cual, y los lectores de
   pantalla anuncian el titulo al cambiar de pagina: si nunca
   cambia, no avisan de nada.

   Se llama UNA vez, desde cada layout, en vez de en las 15
   paginas. Asi ninguna pagina tiene que acordarse, y de paso
   no hay que tocar los archivos de Jose.

   Las rutas con parte variable (/productos/:id) se resuelven
   con el primer tramo, por eso la busqueda va de la ruta mas
   larga a la mas corta.
   ========================================================= */

const TITULOS = {
  '/': 'Inicio',
  '/catalogo': 'Mercado',
  '/categorias': 'Categorias',
  '/ofertas': 'Ofertas',
  '/productos': 'Objeto',
  '/carrito': 'Carrito',
  '/checkout': 'Pagar',
  '/compra-exitosa': 'Compra realizada',
  '/compra-fallida': 'Pago rechazado',
  '/login': 'Iniciar sesion',
  '/registro': 'Crear cuenta',
  '/perfil': 'Mi perfil',
  '/mis-pedidos': 'Mis pedidos',
  '/admin': 'Panel',
  '/admin/productos': 'Panel · Productos',
  '/admin/movimientos': 'Panel · Movimientos de stock',
  '/admin/auditoria': 'Panel · Auditoria',
  '/admin/jugadores': 'Panel · Jugadores',
  '/admin/mercaderes': 'Panel · Mercaderes',
  '/admin/pedidos': 'Panel · Pedidos',
}

const MARCA = 'Middle-earth: The Lost Age'

export function tituloDe(ruta) {
  if (TITULOS[ruta]) return `${TITULOS[ruta]} · ${MARCA}`

  /* /productos/4 -> /productos */
  const raiz = '/' + ruta.split('/').filter(Boolean)[0]
  if (TITULOS[raiz]) return `${TITULOS[raiz]} · ${MARCA}`

  return `Pagina no encontrada · ${MARCA}`
}

export function useTituloDeRuta() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = tituloDe(pathname)
  }, [pathname])
}
