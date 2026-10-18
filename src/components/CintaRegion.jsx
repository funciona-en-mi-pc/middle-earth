import { useEffect } from 'react'

/* =========================================================
   CintaRegion — la cinta bajo la navbar
   ---------------------------------------------------------
   Cada pagina pertenece a un lugar del reino, y ese lugar
   decide el color de acento de toda la pagina.

   Hace dos cosas:
     1. Pinta la cinta con el nombre del lugar.
     2. Pone la clase region-* en el <body>, que es donde el
        CSS define --acento (ver styles.css, seccion 2).

   El paso 2 va en un useEffect porque el <body> esta fuera de
   React: hay que tocarlo a mano. La funcion que devuelve el
   useEffect limpia la clase al salir de la pagina, para que no
   se queden dos regiones pegadas.

   USO:
     <CintaRegion region="moria" nombre="Puertas de Durin"
                  subtitulo="Habla, amigo, y entra" />
   ========================================================= */

function CintaRegion({ region, nombre, subtitulo }) {
  useEffect(() => {
    document.body.classList.add(`region-${region}`)
    return () => document.body.classList.remove(`region-${region}`)
  }, [region])

  return (
    <div className="cinta-region">
      <div className="container-xxl px-3 px-lg-4">
        <span className="cinta-nombre">{nombre}</span>
        {subtitulo && <span className="cinta-sub">{subtitulo}</span>}
      </div>
    </div>
  )
}

export default CintaRegion
