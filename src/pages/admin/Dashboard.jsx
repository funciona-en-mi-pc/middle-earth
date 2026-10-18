import Badge from 'react-bootstrap/Badge'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Table from 'react-bootstrap/Table'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/useAuth.js'
import { STOCK_CRITICO } from '../../data/datosIniciales.js'
import { listarMovimientos } from '../../services/inventarioService.js'
import { listarProductos, nombreCategoria } from '../../services/productoService.js'
import { listarVentas, totalVenta } from '../../services/ventaService.js'
import { formatearFechaHora, formatearNumero, formatearOro } from '../../utils/formatos.js'

/* Tablero — DUENO: Jose · tarea #31
   ---------------------------------------------------------
   El resumen del reino. Son las mismas consultas que trae el
   script SQL, pero vistas de un vistazo.

   EL STOCK CRITICO
   Es el cursor c_stock_bajo de la seccion 9 del script:
   productos con 5 unidades o menos. Con los datos iniciales
   salen tres: Cota de Mithril (3), Baston de Mago (4) y
   Espada Dardo (5).

   EL ORO FACTURADO
   Solo cuenta las ventas CONFIRMADAS. Una ANULADA devolvio su
   stock y su oro, asi que no factura. */

function Dashboard() {
  const { usuario } = useAuth()

  const productos = listarProductos()
  const confirmadas = listarVentas({ estado: 'CONFIRMADA' })
  const anuladas = listarVentas({ estado: 'ANULADA' })

  const facturado = confirmadas.reduce((suma, v) => suma + totalVenta(v.ventaId), 0)
  const criticos = productos.filter((p) => p.stock <= STOCK_CRITICO)

  /* Los diez ultimos movimientos, del mas nuevo al mas viejo */
  const ultimos = listarMovimientos().slice(-10).reverse()

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Tablero</h1>
          <p className="lede">Hola, {usuario.nombre}. Esto es lo que pasa en el reino.</p>
        </div>
      </div>

      <Row xs={1} sm={2} lg={4} className="g-4 mb-4">
        <Col>
          <div className="kpi">
            <span className="n">{productos.length}</span>
            <span className="l">Objetos en el catalogo</span>
          </div>
        </Col>
        <Col>
          <div className="kpi">
            <span className="n">{confirmadas.length}</span>
            <span className="l">Ventas confirmadas</span>
          </div>
        </Col>
        <Col>
          <div className="kpi">
            <span className="n">{formatearNumero(facturado)}</span>
            <span className="l">Oro facturado</span>
          </div>
        </Col>
        <Col>
          <div className="kpi">
            <span className="n">{anuladas.length}</span>
            <span className="l">Ventas anuladas</span>
          </div>
        </Col>
      </Row>

      {/* --- Stock critico: el cursor c_stock_bajo del SQL --- */}
      <section className="mb-5">
        <div className="admin-top">
          <div>
            <h2>Stock critico</h2>
            <p className="lede">Objetos con {STOCK_CRITICO} unidades o menos.</p>
          </div>
          <Link className="btn btn-linea btn-sm" to="/admin/movimientos">Reponer stock</Link>
        </div>

        {criticos.length === 0 ? (
          <p className="empty-state">Ningun objeto esta bajo el nivel critico.</p>
        ) : (
          <div className="table-card">
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Objeto</th>
                  <th>Categoria</th>
                  <th className="num">Precio</th>
                  <th className="num">Stock</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {criticos.map((producto) => (
                  <tr key={producto.productoId}>
                    <td>{producto.nombre}</td>
                    <td>{nombreCategoria(producto.categoriaId)}</td>
                    <td className="num">{formatearOro(producto.precio)}</td>
                    <td className="num">{producto.stock}</td>
                    <td>
                      <Badge className={producto.stock === 0 ? 'alerta' : 'aviso'}>
                        {producto.stock === 0 ? 'Agotado' : 'Bajo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </section>

      {/* --- Ultimos movimientos de stock --- */}
      <section>
        <div className="admin-top">
          <div>
            <h2>Ultimos movimientos</h2>
            <p className="lede">Las entradas y salidas mas recientes del almacen.</p>
          </div>
          <Link className="btn btn-linea btn-sm" to="/admin/movimientos">Ver todos</Link>
        </div>

        {ultimos.length === 0 ? (
          <p className="empty-state">Todavia no se ha movido nada del almacen.</p>
        ) : (
          <div className="table-card">
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Objeto</th>
                  <th>Tipo</th>
                  <th className="num">Cantidad</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {ultimos.map((m) => {
                  const producto = productos.find((p) => p.productoId === m.productoId)

                  return (
                    <tr key={m.movimientoId}>
                      <td>{formatearFechaHora(m.fechaMovimiento)}</td>
                      <td>{producto ? producto.nombre : `#${m.productoId}`}</td>
                      <td>
                        <Badge className={m.tipoMovimiento === 'ENTRADA' ? 'ok' : 'alerta'}>
                          {m.tipoMovimiento}
                        </Badge>
                      </td>
                      <td className="num">{m.cantidad}</td>
                      <td>{m.observacion}</td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        )}
      </section>
    </>
  )
}

export default Dashboard
