/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   karma.conf.cjs — Pruebas unitarias con Jasmine y Karma
   ---------------------------------------------------------
   DUENO: Jose · tareas #12 y #13

   QUIEN HACE QUE
     Jasmine ... el lenguaje de las pruebas: describe, it,
                 expect, beforeEach.
     Karma ..... el que abre un navegador de verdad (Chrome
                 sin ventana), le mete las pruebas, recoge los
                 resultados y lo cierra.
     esbuild ... traduce el JSX y junta los import en un solo
                 archivo, porque el navegador no entiende ni
                 JSX ni rutas tipo 'react'.
     istanbul .. marca cada linea del codigo para saber cual
                 se ejecuto. De ahi sale el informe de
                 cobertura.

   POR QUE .cjs Y NO .js
   package.json tiene "type": "module", asi que todo .js es un
   modulo ES. Karma necesita CommonJS (module.exports), y la
   extension .cjs es la forma de pedirlo.

   COMO SE USA
     npm test        una pasada, dice cuantas pruebas pasan
     npm run test:watch  se queda mirando y repite al guardar
     npm run coverage    ademas genera coverage/index.html

   DONDE VAN LAS PRUEBAS
   Al lado del archivo que prueban, con el mismo nombre y
   .spec: validaciones.js -> validaciones.spec.js. Asi se ve
   de un vistazo que esta probado y que no.
   ========================================================= */

const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')

/* El informe de cobertura es mas lento, asi que solo se
   prepara cuando se pide. Lo enciende karma.coverage.cjs. */
const CON_COBERTURA = process.env.COVERAGE === 'true'


/* ---------------------------------------------------------
   Donde esta Chrome
   En Windows y en Mac, karma-chrome-launcher lo encuentra
   solo. En Linux a veces no, asi que probamos las rutas
   habituales. Si tu Chrome esta en otro sitio, define la
   variable de entorno CHROME_BIN.
   --------------------------------------------------------- */
if (!process.env.CHROME_BIN) {
  const candidatos = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ]
  const encontrado = candidatos.find((ruta) => fs.existsSync(ruta))
  if (encontrado) process.env.CHROME_BIN = encontrado
}


/* ---------------------------------------------------------
   Complemento de esbuild que instrumenta el codigo
   Antes de juntar los archivos, pasa cada uno por Babel con
   babel-plugin-istanbul, que le inyecta los contadores.

   Se salta tres cosas:
     node_modules ... no es codigo nuestro
     los .spec ...... medir la cobertura de las pruebas no
                      tiene sentido
     los datos ...... datosIniciales.js es una lista, no logica
   --------------------------------------------------------- */
const complementoCobertura = {
  name: 'istanbul',
  setup(build) {
    build.onLoad({ filter: /\.jsx?$/ }, async (args) => {
      const ruta = args.path.split(path.sep).join('/')

      if (ruta.includes('/node_modules/')) return null
      if (/\.spec\.jsx?$/.test(ruta)) return null
      if (ruta.includes('/src/data/')) return null

      const codigo = await fs.promises.readFile(args.path, 'utf8')

      const resultado = await babel.transformAsync(codigo, {
        filename: args.path,
        configFile: false,
        babelrc: false,
        sourceMaps: 'inline',
        parserOpts: { sourceType: 'module', plugins: ['jsx'] },
        plugins: ['babel-plugin-istanbul'],
      })

      return {
        contents: resultado.code,
        loader: ruta.endsWith('.jsx') ? 'jsx' : 'js',
      }
    })
  },
}


module.exports = function (config) {
  config.set({

    basePath: '',
    frameworks: ['jasmine'],

    /* Los archivos que Karma carga. Solo los .spec: todo lo
       demas entra por sus import, gracias a esbuild.

       TODAS LAS PRUEBAS SE LLAMAN .spec.js, AUNQUE LLEVEN JSX
       karma-esbuild cambia siempre la extension del spec a .js
       antes de juntarlo, asi que un archivo .spec.jsx no lo
       encuentra despues. Por eso abajo el loader hace que los
       .js se lean como JSX.

       Tampoco se usa un patron con llaves ('*.spec.{js,jsx}'):
       con llaves, la libreria glob de Karma 6 no devuelve la
       fecha de todos los archivos y la ejecucion se cae con
       "Cannot read properties of undefined (reading 'mtime')". */
    files: [
      { pattern: 'src/**/*.spec.js', watched: false },
      /* Las imagenes de public/ se sirven, pero no se incluyen
         como scripts. Sin esto, cada ficha dibujada en una
         prueba deja un 404 en la consola. */
      { pattern: 'public/img/**/*', watched: false, included: false, served: true, nocache: true },
    ],

    /* En la pagina las imagenes son /img/..., pero Karma sirve
       todo bajo /base/. Este proxy une las dos cosas. */
    proxies: { '/img/': '/base/public/img/' },

    preprocessors: { 'src/**/*.spec.js': ['esbuild'] },

    esbuild: {
      /* 'automatic' permite escribir JSX sin importar React en
         cada archivo, igual que hace Vite. */
      jsx: 'automatic',
      target: 'es2022',
      sourcemap: true,
      plugins: CON_COBERTURA ? [complementoCobertura] : [],
      loader: {
        /* Los .js se leen como JSX, para poder escribir
           componentes dentro de un archivo .spec.js. */
        '.js': 'jsx',
        /* Las imagenes no se prueban: basta con que su import
           no rompa la compilacion. */
        '.png': 'dataurl',
        '.jpg': 'dataurl',
        '.svg': 'dataurl',
      },
    },

    reporters: CON_COBERTURA ? ['progress', 'coverage'] : ['progress'],

    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'html', subdir: '.' },   // coverage/index.html, para mirar
        { type: 'text-summary' },        // el resumen en la consola
        { type: 'lcovonly', subdir: '.' },
      ],
    },

    browsers: ['ChromeHeadlessSinSandbox'],
    customLaunchers: {
      ChromeHeadlessSinSandbox: {
        base: 'ChromeHeadless',
        /* --no-sandbox hace falta dentro de contenedores y en
           algunos Linux. En Windows no estorba. */
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,
    concurrency: 1,
    restartOnFileChange: true,

    /* Si Chrome tarda en arrancar en un equipo lento, estos
       margenes evitan el error "browser did not capture". */
    captureTimeout: 60000,
    browserNoActivityTimeout: 60000,

    client: {
      /* Deja la consola del navegador visible en la terminal:
         sin esto, un console.log dentro de una prueba se
         pierde. */
      captureConsole: true,
      jasmine: { random: false },
    },

  })
}
