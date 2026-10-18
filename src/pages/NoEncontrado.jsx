import CintaRegion from '../components/CintaRegion.jsx'

/* Pagina no encontrada — DUENO: Javier · tarea #5
   Pagina vacia del Hito 0. El contenido llega en su tarea. */

function NoEncontrado() {
  return (
    <>
      <CintaRegion region="moria" nombre="Moria" subtitulo="Aqui no hay nada" />
      <div className="container-xxl px-3 px-lg-4">
        <header className="page-head">
          <h1>Pagina no encontrada</h1>
          <p className="lede">La ruta que buscas no existe en el reino.</p>
        </header>
      </div>
    </>
  )
}

export default NoEncontrado
