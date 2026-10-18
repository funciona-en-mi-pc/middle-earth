/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   datosIniciales.js — Los datos de arranque de la tienda
   ---------------------------------------------------------
   Copia fiel de la seccion "3. DATOS DE PRUEBA" de
   tienda_tierra_media.sql. Mismos ID, mismos nombres, mismos
   precios y mismo stock, para que lo que se ve en la pagina
   coincida con lo que devuelve el script de Oracle.

   NOMBRES DE LOS CAMPOS
   En camelCase (jugadorId, nivelRequerido) porque es la forma
   en que los devolvera la API de Spring Boot en la etapa 3.
   Asi, cuando llegue el backend, solo cambian los services:
   las paginas no se tocan.

   DOS CAMPOS QUE EL SQL NO TIENE
     password ... JUGADOR y MERCADER lo necesitan para el login
     email ...... MERCADER no lo tiene en la tabla
     imagen ..... PRODUCTO no tiene columna de imagen
   Quedan anotados como cambio pendiente de la base de datos
   para la etapa 3.
   ========================================================= */


/* RAZA — catalogo de razas. JUGADOR la referencia con FK. */
export const RAZAS = [
  { razaId: 1, nombre: 'Hobbit' },
  { razaId: 2, nombre: 'Elfo' },
  { razaId: 3, nombre: 'Enano' },
  { razaId: 4, nombre: 'Humano' },
  { razaId: 5, nombre: 'Mago' },
]


/* CATEGORIA — los cuatro tipos de equipamiento. */
export const CATEGORIAS = [
  { categoriaId: 1, nombre: 'Armas' },
  { categoriaId: 2, nombre: 'Armaduras' },
  { categoriaId: 3, nombre: 'Pociones' },
  { categoriaId: 4, nombre: 'Accesorios' },
]


/* JUGADOR — quien compra. Equivale a CLIENTE.
   Boromir esta INACTIVO a proposito: sirve para probar el
   error -20005 "Jugador inexistente o inactivo". */
export const JUGADORES = [
  { jugadorId: 1, razaId: 1, nombre: 'Frodo Bolson', nivel: 5,  email: 'frodo@comarca.me',      password: 'frodo123',   estado: 'ACTIVO' },
  { jugadorId: 2, razaId: 2, nombre: 'Legolas',      nivel: 20, email: 'legolas@bosqueverde.me', password: 'legolas123', estado: 'ACTIVO' },
  { jugadorId: 3, razaId: 3, nombre: 'Gimli',        nivel: 18, email: 'gimli@erebor.me',        password: 'gimli123',   estado: 'ACTIVO' },
  { jugadorId: 4, razaId: 4, nombre: 'Aragorn',      nivel: 25, email: 'aragorn@gondor.me',      password: 'aragorn123', estado: 'ACTIVO' },
  { jugadorId: 5, razaId: 5, nombre: 'Gandalf',      nivel: 50, email: 'gandalf@istari.me',      password: 'gandalf123', estado: 'ACTIVO' },
  { jugadorId: 6, razaId: 4, nombre: 'Boromir',      nivel: 22, email: 'boromir@gondor.me',      password: 'boromir123', estado: 'INACTIVO' },
]


/* MERCADER — quien atiende. Equivale a EMPLEADO.
   Grima esta INACTIVO: prueba el error -20006.
   Solo el cargo ADMINISTRADOR podra crear, editar y borrar. */
export const MERCADERES = [
  { mercaderId: 1, nombre: 'Cebadilla Mantecona',       cargo: 'VENDEDOR',      email: 'cebadilla@pony.me',    password: 'cebadilla1', estado: 'ACTIVO' },
  { mercaderId: 2, nombre: 'Elrond',                    cargo: 'ADMINISTRADOR', email: 'elrond@rivendel.me',   password: 'elrond123',  estado: 'ACTIVO' },
  { mercaderId: 3, nombre: 'Grimbold Martillo',         cargo: 'HERRERO',       email: 'grimbold@erebor.me',   password: 'grimbold1',  estado: 'ACTIVO' },
  { mercaderId: 4, nombre: 'Grima Lengua de Serpiente', cargo: 'VENDEDOR',      email: 'grima@isengard.me',    password: 'grima123',   estado: 'INACTIVO' },
]


/* PRODUCTO — el equipamiento a la venta. El precio esta en
   monedas de oro. nivelRequerido es la regla 3: el jugador
   solo compra lo que su nivel le permite. */
export const PRODUCTOS = [
  { productoId: 1, categoriaId: 1, nombre: 'Espada Dardo',          precio: 1500, stock: 5,  nivelRequerido: 5,  estado: 'ACTIVO', imagen: '1.jpg' },
  { productoId: 2, categoriaId: 1, nombre: 'Arco de los Galadhrim', precio: 2200, stock: 8,  nivelRequerido: 20, estado: 'ACTIVO', imagen: '2.jpg' },
  { productoId: 3, categoriaId: 1, nombre: 'Hacha Enana',           precio: 1800, stock: 10, nivelRequerido: 15, estado: 'ACTIVO', imagen: '3.jpg' },
  { productoId: 4, categoriaId: 2, nombre: 'Cota de Mithril',       precio: 5000, stock: 3,  nivelRequerido: 15, estado: 'ACTIVO', imagen: '4.jpg' },
  { productoId: 5, categoriaId: 2, nombre: 'Capa Elfica',           precio: 900,  stock: 12, nivelRequerido: 10, estado: 'ACTIVO', imagen: '5.jpg' },
  { productoId: 6, categoriaId: 3, nombre: 'Lembas',                precio: 50,   stock: 40, nivelRequerido: 1,  estado: 'ACTIVO', imagen: '6.jpg' },
  { productoId: 7, categoriaId: 3, nombre: 'Miruvor',               precio: 120,  stock: 25, nivelRequerido: 1,  estado: 'ACTIVO', imagen: '7.jpg' },
  { productoId: 8, categoriaId: 4, nombre: 'Baston de Mago',        precio: 3500, stock: 4,  nivelRequerido: 40, estado: 'ACTIVO', imagen: '8.jpg' },
]


/* Las cuatro tablas que nacen vacias y se llenan con el uso:
   VENTA, DETALLE_VENTA, MOVIMIENTO_STOCK y AUDITORIA_PRODUCTO. */
export const VENTAS = []
export const DETALLES_VENTA = []
export const MOVIMIENTOS_STOCK = []
export const AUDITORIA = []


/* La primera venta es la 1001, igual que SEQ_VENTA en el SQL
   (CREATE SEQUENCE SEQ_VENTA START WITH 1001). */
export const PRIMERA_VENTA = 1001


/* Mercader que atiende cuando un jugador compra solo desde la
   tienda: Cebadilla Mantecona. VENTA.mercader_id es NOT NULL,
   asi que toda venta necesita uno. */
export const MERCADER_POR_DEFECTO = 1


/* Nivel de stock critico. El SQL lo usa en el cursor
   c_stock_bajo para listar lo que hay que reponer. */
export const STOCK_CRITICO = 5
