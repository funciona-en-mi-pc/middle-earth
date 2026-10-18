import CintaRegion from '../components/CintaRegion.jsx'

/* Mi perfil — DUENO: Javier · tarea #25
   Pagina vacia del Hito 0. El contenido llega en su tarea. */

function Perfil() {
  return (
    <>
      <CintaRegion region="minas-tirith" nombre="Minas Tirith" subtitulo="La ciudadela blanca" />
      <div className="container-xxl px-3 px-lg-4">
        <header className="page-head">
          <h1>Mi perfil</h1>
          <p className="lede">Datos de quien tiene la sesion abierta.</p>
        </header>
      </div>
    </>
  )
}

export default Perfil
