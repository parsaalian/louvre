'use strict'

const db = require('./db')
const subscriber = require('./subscriber')
const protos = require('./subscriber/protos')
const { logger } = require('./system/logger')
require('dotenv').config()

Promise.all([
  db.bootsrapDatabase()
    .then(() => {
      db.connect()
      .then(() => {

      })
      .catch((err) => {
        logger.error(`RethinkDB can not connect database since has some errors: ${err.message}`)
      })
    })
    .catch((err) => {
      logger.error(`The polygame database can not bootstrap, the action has some errors: ${err}`)
    }),
  protos.compile()
])
  .then(subscriber.start)
  .catch(err => logger.error(`subscriber can not start since has some errors: ${err.message}`))
  .catch((err) => {
    logger.error('chains have some errors: ' + err)
  })
