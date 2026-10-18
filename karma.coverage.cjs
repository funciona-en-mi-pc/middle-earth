/* Igual que karma.conf.cjs, pero con la cobertura encendida.
   Existe como archivo aparte porque definir una variable de
   entorno en un script de npm se escribe distinto en Windows
   y en Linux; asi funciona igual en los dos. */

process.env.COVERAGE = 'true'

module.exports = require('./karma.conf.cjs')
