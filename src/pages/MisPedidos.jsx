import CintaRegion from '../components/CintaRegion.jsx'

/* Mis pedidos — DUENO: Javier · tarea #26
   Pagina vacia del Hito 0. El contenido llega en su tarea. */

function MisPedidos() {
  return (
    <>
      <CintaRegion region="comarca" nombre="La Comarca" subtitulo="El libro de cuentas" />
      <div className="container-xxl px-3 px-lg-4">
        <header className="page-head">
          <h1>Mis pedidos</h1>
          <p className="lede">Historial de compras del jugador.</p>
        </header>
      </div>
    </>
  )
}

export default MisPedidos
