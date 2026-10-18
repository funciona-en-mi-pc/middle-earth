import { useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import Form from 'react-bootstrap/Form'
import Table from 'react-bootstrap/Table'

import { CAMPOS_AUDITADOS, listarAuditoria } from '../../services/auditoriaService.js'
import { listarProductos } from '../../services/productoService.js'
import { formatearFechaHora, formatearOro } from '../../utils/formatos.js'

/* Panel · Auditoria — DUENO: Javier · tarea #43
   ---------------------------------------------------------
   La tabla AUDITORIA_PRODUCTO: el rastro de cada cambio de
   precio o de estado de un producto (regla 10).

   ESTA PAGINA SOLO MIRA
   No crea ni borra filas: las escribe auditoriaService, al
   que llama productoService.actualizarProducto. Es lo mismo
   que en Oracle, donde la auditoria la llena el trigger
   TR_AUDITAR_PRODUCTO y nadie escribe en esa tabla a mano.

   Por eso aqui no hay comprobacion de cargo: cualquier
   mercader que entre al panel puede consultarla. Lo que no
   puede es cambiarla, porque no hay forma de hacerlo.

   QUE SE VE Y QUE NO
   El stock no aparece: sus cambios quedan en
   MOVIMIENTO_STOCK, no en la auditoria. Son dos historiales
   distintos a proposito, igual que en la base de datos. */

function AdminAuditoria() {
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroCampo, setFiltroCampo] = useState('')

  const productos = listarProductos()
  const filas = listarAuditoria({
    productoId: filtroProducto === '' ? undefined : filtroProducto,
    campo: filtroCampo === '' ? undefined : filtroCampo,
  })

  const nombreProducto = (id) => {
    const producto = productos.find((p) => p.productoId === id)
    return producto ? producto.nombre : `#${id}`
  }

  /* Un precio se lee mejor en oro; un estado es texto tal cual */
  const mostrarValor = (campo, valor) =>
    campo === 'PRECIO' ? formatearOro(valor) : valor

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Auditoria de productos</h1>
          <p className="lede">
            Cada cambio de precio o de estado queda aqui, con quien lo hizo y cuando.
          </p>
        </div>
        <div className="kpi kpi-suelto">
          <span className="n">{listarAuditoria().length}</span>
          <span className="l">Cambios registrados</span>
        </div>
      </div>

      <div className="filtros">
        <div className="filtros-grupo">
          <span className="filtros-titulo">Objeto</span>
          <Form.Select
            className="filtro-select"
            aria-label="Filtrar por objeto"
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
          >
            <option value="">Todos</option>
            {productos.map((p) => (
              <option key={p.productoId} value={p.productoId}>{p.nombre}</option>
            ))}
          </Form.Select>
        </div>

        <div className="filtros-grupo">
          <span className="filtros-titulo">Campo</span>
          <button
            type="button"
            className={`filter-btn${filtroCampo === '' ? ' active' : ''}`}
            onClick={() => setFiltroCampo('')}
          >
            Todos
          </button>
          {CAMPOS_AUDITADOS.map((campo) => (
            <button
              key={campo}
              type="button"
              className={`filter-btn${filtroCampo === campo ? ' active' : ''}`}
              onClick={() => setFiltroCampo(campo)}
            >
              {campo.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {filas.length === 0 ? (
        <p className="empty-state">
          Todavia no se ha cambiado ningun precio ni ningun estado.
        </p>
      ) : (
        <div className="table-card">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th className="num">ID</th>
                <th>Fecha</th>
                <th>Objeto</th>
                <th>Campo</th>
                <th>Antes</th>
                <th>Despues</th>
                <th>Quien</th>
              </tr>
            </thead>
            <tbody>
              {/* Lo mas nuevo arriba. slice() copia, para no dar
                  vuelta el arreglo original. */}
              {filas.slice().reverse().map((fila) => (
                <tr key={fila.auditoriaId}>
                  <td className="num">{fila.auditoriaId}</td>
                  <td>{formatearFechaHora(fila.fechaCambio)}</td>
                  <td>{nombreProducto(fila.productoId)}</td>
                  <td>
                    <Badge className={fila.campoModificado === 'PRECIO' ? 'aviso' : 'alerta'}>
                      {fila.campoModificado}
                    </Badge>
                  </td>
                  <td>{mostrarValor(fila.campoModificado, fila.valorAnterior)}</td>
                  <td>{mostrarValor(fila.campoModificado, fila.valorNuevo)}</td>
                  <td>{fila.usuarioBd}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  )
}

export default AdminAuditoria
