# Documento de cobertura del testing

**Middle-earth: The Lost Age** — Tienda de equipamiento RPG
Asignatura DSY1104 · Evaluación Parcial 2 (30%) · Etapa 2, frontend en React
Equipo: Javier Vega y José Fierro · Duoc UC

---

## 1. Propuesta de testing

### 1.1 Qué se decidió probar

El proyecto no tiene servidor en esta etapa: las nueve tablas del script Oracle
`tienda_tierra_media.sql` viven en `localStorage` y se acceden siempre a través de
`src/services/`. Eso define la estrategia:

| Capa | Qué se prueba | Por qué |
|---|---|---|
| `src/services/` | Las diez reglas de negocio del SQL | Es el corazón del sistema. En la etapa 3 estas funciones pasarán a llamar a la API de Spring Boot, y estas pruebas serán el contrato que el backend deberá cumplir. |
| `src/utils/` | Funciones puras: validaciones, formatos, rareza, oferta | Son baratas de probar y se usan en todas partes. Un error aquí se propaga a toda la aplicación. |
| `src/pages/` y `src/components/` | Renderizado, props, estado y eventos | Es lo que pide explícitamente el Anexo 1. |
| `src/context/` | El proveedor de sesión | Decide qué ve cada tipo de usuario. |

### 1.2 Qué se decidió NO probar, y por qué

Decidir qué no probar también es parte de la propuesta:

- **`main.jsx` y `App.jsx`**: son cableado. `main.jsx` solo monta la aplicación y
  `App.jsx` solo declara rutas. Probarlos sería probar a React Router.
- **CSS y maquetación visual**: no se prueba con Jasmine. El desborde horizontal en
  móvil se verifica con un script aparte, `scripts/responsive.mjs`, que recorre todas
  las páginas y mide el ancho real del documento.
- **`data/datosIniciales.js`**: es un archivo de datos literales, copiado del SQL. No
  tiene lógica que pueda fallar.

### 1.3 Herramientas

| Herramienta | Versión | Para qué |
|---|---|---|
| Jasmine | 7.0.2 | El lenguaje de las pruebas: `describe`, `it`, `expect` |
| Karma | 6.4.4 | El corredor: levanta Chrome Headless y ejecuta todo |
| karma-esbuild | 2.3.0 | Compila JSX y módulos ES antes de correr |
| @testing-library/react | 16.3.3 | Dibuja componentes y los consulta como lo haría una persona |
| karma-coverage + babel-plugin-istanbul | 2.2.1 / 8.0.0 | Mide qué líneas y ramas se ejecutaron |

**Decisión de diseño:** se usa `@testing-library/react` en vez de buscar elementos por
clase CSS o por id. Las consultas son por rol, etiqueta y texto visible
(`getByRole('button', { name: 'Pagar' })`). Esto hace que las pruebas sigan pasando si
cambia el CSS, y que fallen si se rompe la accesibilidad.

### 1.4 Cómo se ejecuta

```bash
npm test        # las 448 pruebas, una vez
npm run test:watch   # se queda corriendo y repite al guardar
npm run coverage     # las pruebas + el informe en coverage/index.html
```

---

## 2. Las cuatro familias de prueba del Anexo

El Anexo 1 define cuatro tipos de prueba. Todas están cubiertas, con ejemplos reales
del repositorio.

### 2.1 Pruebas de renderizado

**Renderizado correcto** — que los componentes de lista rendericen todos los elementos
del conjunto de datos:

```js
// src/pages/Catalogo.spec.js
it('muestra los ocho productos', () => {
  dibujar()
  expect(fichas()).toBe(8)
})
```

```js
// src/pages/Categorias.spec.js
it('cuenta los objetos de cada gremio', () => {
  dibujar()
  expect(tarjeta('Armas').textContent).toContain('3 objetos')
})
```

**Renderizado condicional** — que se muestren u oculten elementos según las condiciones:

```js
// src/pages/CompraFallida.spec.js — el mensaje de error solo cuando hay error
it('sin motivo usa uno generico', () => {
  dibujar()
  expect(screen.getByText('No se pudo completar el pago.')).toBeTruthy()
})
```

```js
// src/pages/Checkout.spec.js — el formulario solo si hay algo que pagar
it('sin carrito no hay nada que pagar', () => {
  dibujar()
  expect(screen.getByText('No tienes nada que pagar.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Pagar/ })).toBeNull()
})
```

```js
// src/pages/Catalogo.spec.js — el filtro de nivel solo si sabemos el nivel
it('no ofrece el filtro de nivel', () => {
  dibujar()
  expect(screen.queryByRole('button', { name: /Solo lo que puedo usar/ })).toBeNull()
})
```

### 2.2 Pruebas de propiedades (props)

Que los componentes reciban y usen las props adecuadas:

```js
// src/pages/Ofertas.spec.js — ProductoCard recibe nivelJugador y reacciona
it('a Frodo le avisa lo que no puede usar', () => {
  iniciarSesion('frodo@comarca.me', 'frodo123')   // nivel 5
  dibujar()
  expect(screen.getByText('Necesitas nivel 15')).toBeTruthy()   // Hacha Enana
})

it('sin sesion no avisa de niveles', () => {
  dibujar()
  expect(screen.queryByText(/Necesitas nivel/)).toBeNull()
})
```

El archivo `src/components/ProductoCard.spec.js` prueba la ficha en aislamiento, con
ocho casos sobre el mismo producto cambiando solo sus props.

### 2.3 Pruebas de estado (state)

Que la lógica de cambio de estado funcione cuando el usuario escribe:

```js
// src/pages/Checkout.spec.js
it('guarda lo que se escribe', () => {
  llenarCarrito()
  dibujar()
  escribir('Direccion', 'Ciudadela Blanca 7')
  expect(campo('Direccion').value).toBe('Ciudadela Blanca 7')
})

it('quita el error en cuanto se corrige', () => {
  llenarCarrito()
  dibujar()

  pagar()
  expect(screen.getByText('La direccion de entrega es obligatoria.')).toBeTruthy()

  escribir('Direccion', 'Ciudadela Blanca 7')
  expect(screen.queryByText('La direccion de entrega es obligatoria.')).toBeNull()
})
```

### 2.4 Pruebas de eventos

Simulación de eventos de usuario, comprobando que el estado cambie o que se ejecute la
función esperada:

```js
// src/pages/Catalogo.spec.js — un clic cambia el filtro
it('al pulsar Armas deja tres fichas', () => {
  dibujar()
  fireEvent.click(filtro('Armas'))
  expect(fichas()).toBe(3)
})
```

```js
// src/pages/Checkout.spec.js — enviar el formulario confirma la venta
it('confirma la venta y lleva a la boleta', () => {
  const venta = llenarCarrito()
  dibujar()

  escribir('Direccion', 'Ciudadela Blanca 7')
  pagar()

  expect(screen.getByText('Boleta lista')).toBeTruthy()
  expect(obtenerVenta(venta.ventaId).estado).toBe('CONFIRMADA')
  expect(ventaAbiertaDe(4)).toBeNull()
})
```

---

## 3. Las reglas del SQL, y la prueba que defiende cada una

Esta es la tabla que explica por qué el proyecto tiene tantas pruebas de servicio: cada
regla del script Oracle tiene al menos una prueba que la defiende.

| # | Regla de negocio | Dónde se cumple | Prueba |
|---|---|---|---|
| 1 | Solo compran jugadores ACTIVOS | `ventaService.crearVenta` | `ventaService.spec.js` — "Boromir esta INACTIVO" |
| 2 | El producto debe estar ACTIVO y con stock | `inventarioService.descontarStock` | `inventarioService.spec.js`, `Catalogo.spec.js`, `Ofertas.spec.js` |
| 3 | El jugador solo compra de su nivel o menor | `ventaService.agregarProducto` | `ventaService.spec.js`, `Catalogo.spec.js`, `Ofertas.spec.js` |
| 4 | La venta nace ABIERTA, luego CONFIRMADA o ANULADA | `ventaService` | `ventaService.spec.js`, `Checkout.spec.js` |
| 5 | No se confirma una venta sin productos | `ventaService.confirmarVenta` | `ventaService.spec.js` |
| 6 | Al vender baja el stock y queda una SALIDA | `inventarioService.descontarStock` | `inventarioService.spec.js`, `Checkout.spec.js` |
| 7 | Al anular vuelve el stock y queda una ENTRADA | `inventarioService.devolverStock` | `inventarioService.spec.js`, `Carrito.spec.js` |
| 8 | El precio se copia al detalle al vender | `ventaService.agregarProducto` | `ventaService.spec.js`, `oferta.spec.js` |
| 9 | No se elimina lo que tiene ventas: queda INACTIVO | `jugadorService`, `productoService`, `mercaderService` | los tres `.spec.js` |
| 10 | Todo cambio de precio o estado queda auditado | `auditoriaService.registrarCambio` | `auditoriaService.spec.js`, `AdminProductos.spec.js` |

---

## 4. Resultados de la cobertura

### 4.1 Totales

Informe generado con `npm run coverage` (karma-coverage + Istanbul):

| Métrica | Cubierto | Total | Porcentaje |
|---|---|---|---|
| **Sentencias** | 1.003 | 1.045 | **95,98 %** |
| **Ramas** | 701 | 765 | **91,63 %** |
| **Funciones** | 306 | 317 | **96,52 %** |
| **Líneas** | 870 | 896 | **97,09 %** |

**448 pruebas** repartidas en **34 archivos** `.spec.js`, todas pasando.

### 4.2 Por capa

| Capa | Líneas | Ramas | Lectura |
|---|---|---|---|
| `services/` | **98,5 %** | 90,4 % | Es lo más probado, y es lo correcto: aquí viven las reglas del negocio |
| `utils/` | **100 %** | 87,2 % | Funciones puras, cobertura total de líneas |
| `components/` | **100 %** | 95,8 % | |
| `context/` | **100 %** | 100 % | |
| `pages/` | **95,3 %** | 93,3 % | Lo más bajo, por el motivo que se explica abajo |

### 4.3 Análisis: qué quedó sin cubrir y por qué

Las 26 líneas sin cubrir no están repartidas al azar. Casi todas son **el mismo patrón**:

```js
const intento = algunService(...)
if (!intento.ok) {                               // <- esta rama
  setAlerta({ tipo: 'danger', texto: intento.error })
  return
}
```

Son ramas de error que el propio formulario ya impide alcanzar: la página valida antes
de llamar al service, de modo que el service casi nunca devuelve `{ ok: false }` desde
esa pantalla. Es **código defensivo**, y se deja a propósito: en la etapa 3 el service
hablará con una API por red, y entonces esos errores sí van a ocurrir.

Los archivos con menor cobertura y su motivo concreto:

| Archivo | Líneas | Qué falta |
|---|---|---|
| `pages/DetalleProducto.jsx` | 84,0 % | Las dos ramas de error de `agregarProducto` y de `obtenerOCrearVentaAbierta` |
| `pages/Carrito.jsx` | 86,7 % | La rama de error de `anularVenta`, que solo ocurre si la venta ya estaba anulada |
| `pages/admin/AdminMovimientos.jsx` | 91,4 % | La rama de error de `reponerStock` |
| `pages/admin/AdminProductos.jsx` | 92,0 % | Dos ramas de error del CRUD y el cierre del modal |

Donde sí se podía alcanzar la rama de error de forma realista, se hizo. El ejemplo está
en `Checkout.spec.js`:

```js
/* Si el service dice que no, su mensaje es el que se
   muestra. Pasa de verdad: un mercader puede anular la
   venta desde el panel mientras el jugador paga. */
it('repite el motivo que devuelve ventaService', () => {
  const venta = llenarCarrito()
  dibujar()

  escribir('Direccion', 'Ciudadela Blanca 7')
  anularVenta(venta.ventaId)          // se la anularon por detras
  pagar()

  expect(screen.getByText('Pago rechazado')).toBeTruthy()
  expect(obtenerVenta(venta.ventaId).estado).toBe('ANULADA')
})
```

### 4.4 Distribución de las pruebas

| Archivo de pruebas | Casos |
|---|---|
| `services/jugadorService.spec.js` | 26 |
| `services/mercaderService.spec.js` | 24 |
| `services/productoService.spec.js` | 22 |
| `services/ventaService.spec.js` | 22 |
| `utils/validaciones.spec.js` | 29 |
| `services/authService.spec.js` | 17 |
| `services/inventarioService.spec.js` | 16 |
| `services/auditoriaService.spec.js` | 14 |
| `services/storage.spec.js` | 15 |
| `pages/Login.spec.js` | 16 |
| `pages/admin/AdminJugadores.spec.js` | 18 |
| `pages/admin/AdminMercaderes.spec.js` | 17 |
| `pages/admin/AdminProductos.spec.js` | 15 |
| `pages/admin/AdminAuditoria.spec.js` | 13 |
| `pages/Catalogo.spec.js` | 13 |
| `pages/DetalleProducto.spec.js` | 13 |
| `pages/admin/Dashboard.spec.js` | 12 |
| `components/RutaProtegida.spec.js` | 12 |
| `pages/Checkout.spec.js` | 14 |
| `pages/Registro.spec.js` | 11 |
| `pages/Perfil.spec.js` | 10 |
| `pages/admin/AdminMovimientos.spec.js` | 10 |
| `pages/Carrito.spec.js` | 9 |
| `pages/MisPedidos.spec.js` | 9 |
| `pages/admin/AdminPedidos.spec.js` | 9 |
| `utils/formatos.spec.js` | 9 |
| `utils/oferta.spec.js` | 9 |
| `pages/Ofertas.spec.js` | 8 |
| `components/ProductoCard.spec.js` | 8 |
| `context/useAuth.spec.js` | 7 |
| `pages/Categorias.spec.js` | 6 |
| `utils/rareza.spec.js` | 6 |
| `pages/CompraExitosa.spec.js` | 5 |
| `pages/CompraFallida.spec.js` | 4 |
| **Total** | **448** |

---

## 5. Decisiones de diseño que facilitaron las pruebas

Vale la pena dejarlas por escrito, porque son argumentables en la defensa:

1. **Las validaciones son funciones puras.** `utils/validaciones.js` recibe un valor y
   devuelve `''` o un mensaje. No toca el DOM. Se prueba sin navegador, y por eso llega
   al 100 % de líneas con 29 casos.

2. **Todos los services devuelven la misma forma.** `{ ok: true, ...datos }` o
   `{ ok: false, error }`. Una sola forma de comprobar el resultado en todo el proyecto.

3. **El filtro del catálogo vive en la URL.** Al usar `useSearchParams` en vez de
   `useState`, la prueba puede entrar directo a `/catalogo?categoria=3` y verificar el
   estado inicial sin simular clics.

4. **El carrito ES la venta ABIERTA.** No hay una lista paralela en memoria. Cualquier
   prueba puede preparar el escenario llamando a los services y la página lo refleja.

5. **`reiniciarDatos()` antes de cada prueba.** `beforeEach(reiniciarDatos)` deja
   `localStorage` con los datos exactos del SQL. Ninguna prueba depende de otra.

6. **La boleta se identifica por la URL, no por el estado del router.**
   `/compra-exitosa/:ventaId` se puede probar entrando directo, igual que un usuario que
   recarga la página.

---

## 6. Qué falta y se propone para la etapa 3

Honestamente, lo que este documento no puede afirmar todavía:

- **Pruebas de integración con la API.** Hoy los services leen de `localStorage`. Cuando
  hablen con Spring Boot habrá que probar los fallos de red y los códigos HTTP de error,
  que son justamente las ramas que hoy aparecen sin cubrir.
- **Pruebas end-to-end.** No hay Cypress ni Playwright. El flujo completo
  catálogo → carrito → checkout → boleta se prueba por tramos, no de corrido en un
  navegador real.
- **Pruebas de accesibilidad automatizadas.** Las consultas por rol de Testing Library
  dan una garantía parcial, pero no reemplazan a una herramienta como `axe`.
