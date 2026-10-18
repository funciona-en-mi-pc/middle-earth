import CintaRegion from '../components/CintaRegion.jsx'

/* Inicio — DUENO: Jose · tarea #15
   Pagina vacia del Hito 0. El contenido llega en su tarea. */

function Inicio() {
  return (
    <>
      <CintaRegion region="rivendel" nombre="Rivendel" subtitulo="El ultimo hogar acogedor" />
      <div className="container-xxl px-3 px-lg-4">
        <header className="page-head">
          <h1>Inicio</h1>
          <p className="lede">Portada, productos destacados y entrada al mercado.</p>
        </header>
      </div>
    </>
  )
}

export default Inicio
