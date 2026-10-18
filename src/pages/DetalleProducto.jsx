import CintaRegion from '../components/CintaRegion.jsx'

/* Detalle del objeto — DUENO: Jose · tarea #21
   Pagina vacia del Hito 0. El contenido llega en su tarea. */

function DetalleProducto() {
  return (
    <>
      <CintaRegion region="erebor" nombre="Erebor" subtitulo="La forja de los enanos" />
      <div className="container-xxl px-3 px-lg-4">
        <header className="page-head">
          <h1>Detalle del objeto</h1>
          <p className="lede">Precio, stock restante y nivel requerido de un producto.</p>
        </header>
      </div>
    </>
  )
}

export default DetalleProducto
