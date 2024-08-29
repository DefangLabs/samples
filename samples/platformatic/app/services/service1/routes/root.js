// service1/routes/root.js
'use strict'

module.exports = async function (app, opts) {
  app.get('/', async function (request, reply) {
    return { message: 'Platformatic x Defang' }
  })
}
