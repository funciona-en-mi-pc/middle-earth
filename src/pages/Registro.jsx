import CintaRegion from '../components/CintaRegion.jsx'

/* Crear cuenta — DUENO: Javier · tarea #18
   Pagina vacia del Hito 0. El contenido llega en su tarea. */

function Registro() {
  return (
    <>
      <CintaRegion region="bree" nombre="Bree" subtitulo="El Poney Pisador" />
      <div className="container-xxl px-3 px-lg-4">
        <header className="page-head">
          <h1>Crear cuenta</h1>
          <p className="lede">Alta de un jugador nuevo: nombre, correo, raza y contrasena.</p>
        </header>
      </div>
    </>
  )
}

export default Registro
