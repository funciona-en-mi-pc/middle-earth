import CintaRegion from '../components/CintaRegion.jsx'

/* Mercado — DUENO: Jose · tarea #20
   Pagina vacia del Hito 0. El contenido llega en su tarea. */

function Catalogo() {
  return (
    <>
      <CintaRegion region="erebor" nombre="Erebor" subtitulo="El mercado bajo la montana" />
      <div className="container-xxl px-3 px-lg-4">
        <header className="page-head">
          <h1>Mercado</h1>
          <p className="lede">Los ocho objetos del catalogo, con filtros por categoria y por nivel.</p>
        </header>
      </div>
    </>
  )
}

export default Catalogo
