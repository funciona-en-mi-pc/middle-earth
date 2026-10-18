import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Table from 'react-bootstrap/Table'

import { useAuth } from '../../context/useAuth.js'
import { listarJugadores } from '../../services/jugadorService.js'
import {
  anularVenta,
  cantidadProductos,
  listarVentas,
  totalVenta,
} from '../../services/ventaService.js'
import { formatearFecha, formatearNumero, formatearOro } from '../../utils/formatos.js'
import { CLAVES, leer } from '../../services/storage.js'

/* Panel · Pedidos — DUENO: Jose · tarea #41
   ---------------------------------------------------------
   La tabla VENTA completa: todas las ventas del reino, de
   todos los jugadores, con su jugador, su mercader, su total
   y su estado.

   ANULAR DESDE AQUI
   Es PKG_VENTAS.ANULAR_VENTA: devuelve el stock producto por
   producto, deja una ENTRADA por cada uno (regla 7) y marca
   la venta como ANULADA. No se puede anular dos veces.

   EL ORO FACTURADO
   Solo suma las CONFIRMADAS. Una venta anulada devolvio su
   stock, asi que no factura.

   Solo el ADMINISTRADOR puede anular.

   POR QUE NO HAY UN ESTADO CON LA LISTA
   Las filas se LEEN del service en cada dibujado. Despues de
   cada cambio llamamos a setAlerta, que ya provoca un nuevo
   dibujado, asi que la tabla sale con los datos frescos sin
   guardar nada ni forzar recargas. */

const COLOR_ESTADO = {
  CONFIRMADA: 'ok',
  ANULADA: 'alerta',
  ABIERTA: 'aviso',
}

const ESTADOS = ['CONFIRMADA', 'ABIERTA', 'ANULADA']

function AdminPedidos() {
  const { usuario } = useAuth()
  const puedeTocar = usuario.cargo === 'ADMINISTRADOR'

  const [filtro, setFiltro] = useState('')
  const [alerta, setAlerta] = useState(null)

  const ventas = listarVentas({ estado: filtro === '' ? undefined : filtro })
  const jugadores = listarJugadores()
  const mercaderes = leer(CLAVES.mercaderes, [])

  const facturado = listarVentas({ estado: 'CONFIRMADA' })
    .reduce((suma, v) => suma + totalVenta(v.ventaId), 0)

  const nombreDe = (lista, campoId, id) => {
    const fila = lista.find((f) => f[campoId] === id)
    return fila ? fila.nombre : `#${id}`
  }

  const anular = (venta) => {
    const intento = anularVenta(venta.ventaId)
    setAlerta(intento.ok
      ? { tipo: 'success', texto: `Venta ME-${venta.ventaId} anulada. El stock volvio al almacen.` }
      : { tipo: 'danger', texto: intento.error })
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Pedidos</h1>
          <p className="lede">Todas las ventas del reino. Anular devuelve el stock al almacen.</p>
        </div>
        <div className="kpi kpi-suelto">
          <span className="n">{formatearNumero(facturado)}</span>
          <span className="l">Oro facturado</span>
        </div>
      </div>

      {alerta && <Alert variant={alerta.tipo}>{alerta.texto}</Alert>}

      <div className="filtros">
        <div className="filtros-grupo">
          <span className="filtros-titulo">Estado</span>
          <button
            type="button"
            className={`filter-btn${filtro === '' ? ' active' : ''}`}
            onClick={() => setFiltro('')}
          >
            Todas
          </button>
          {ESTADOS.map((estado) => (
            <button
              key={estado}
              type="button"
              className={`filter-btn${filtro === estado ? ' active' : ''}`}
              onClick={() => setFiltro(estado)}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {ventas.length === 0 ? (
        <p className="empty-state">No hay ventas con ese filtro.</p>
      ) : (
        <div className="table-card">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Jugador</th>
                <th>Mercader</th>
                <th className="num">Objetos</th>
                <th className="num">Total</th>
                <th>Estado</th>
                {puedeTocar && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {ventas.slice().reverse().map((venta) => (
                <tr key={venta.ventaId}>
                  <td>ME-{venta.ventaId}</td>
                  <td>{formatearFecha(venta.fechaVenta)}</td>
                  <td>{nombreDe(jugadores, 'jugadorId', venta.jugadorId)}</td>
                  <td>{nombreDe(mercaderes, 'mercaderId', venta.mercaderId)}</td>
                  <td className="num">{cantidadProductos(venta.ventaId)}</td>
                  <td className="num">{formatearOro(totalVenta(venta.ventaId))}</td>
                  <td>
                    <Badge className={COLOR_ESTADO[venta.estado]}>{venta.estado}</Badge>
                  </td>
                  {puedeTocar && (
                    <td className="acciones">
                      {/* Una venta ya anulada no se puede anular de nuevo */}
                      <Button
                        size="sm"
                        className="btn-linea"
                        disabled={venta.estado === 'ANULADA'}
                        onClick={() => anular(venta)}
                      >
                        Anular
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  )
}

export default AdminPedidos
