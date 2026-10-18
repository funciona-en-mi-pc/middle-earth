import CintaRegion from '../components/CintaRegion.jsx'

/* Carrito — DUENO: Jose · tarea #30
   Pagina vacia del Hito 0. El contenido llega en su tarea. */

function Carrito() {
  return (
    <>
      <CintaRegion region="comarca" nombre="La Comarca" subtitulo="Donde se cierran los tratos" />
      <div className="container-xxl px-3 px-lg-4">
        <header className="page-head">
          <h1>Carrito</h1>
          <p className="lede">La venta ABIERTA del jugador, lista para confirmar o anular.</p>
        </header>
      </div>
    </>
  )
}

export default Carrito
