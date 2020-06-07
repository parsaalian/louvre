const r = require('rethinkdb')
const logger = require('../api/logger')

/// //////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////  Connection Of RethinkDB  ////////////////////////////////////////////
/// //////////////////////////////////////////////////////////////////////////////////////////

const HOST = process.env.RETHINKDB_HOST
const PORT = process.env.RETHINKDB_PORT
const NAME = process.env.RETHINKDB_NAME
const RETRY_WAIT = process.env.RETHINKDB_RETRY_WAIT
const AWAIT_TABLE = process.env.RETHINKDB_AWAIT_TABLE

// Connection to db for query methods, run connect before querying
let connection = null

const promisedTimeout = (fn, wait) => {
  return new Promise(resolve => setTimeout(resolve, wait)).then(fn)
}

const awaitDatabase = () => {
  return r.tableList().run(connection)
    .then(tableNames => {
      if (!tableNames.includes(AWAIT_TABLE)) {
        throw new Error()
      }
      logger.info(`Successfully connected to RethinkDB database: ${NAME}`)
    })
    .catch(() => {
      logger.warn('Database not initialized:', NAME)
      logger.warn(`Retrying database in ${RETRY_WAIT / 1000} seconds...`)
      return promisedTimeout(awaitDatabase, RETRY_WAIT)
    })
}

const connect = () => {
  return r.connect({ host: HOST, port: PORT, db: NAME })
    .then(conn => {
      connection = conn
      return awaitDatabase()
    })
    .catch(err => {
      if (err instanceof r.Error.ReqlDriverError) {
        logger.warn('Unable to connect to RethinkDB')
        logger.warn(`Retrying in ${RETRY_WAIT / 1000} seconds...`)
        return promisedTimeout(connect, RETRY_WAIT)
      }
      logger.error(`Unable to connect to RethinkDB with some errors: ${err}`)
    })
}

// This function gets one string as input makes the corresponded filter
// and take the query on RethinkDB then return the result.
// publickey: user's publickey is required.
const queryOfUsers = ({ publickey, table }) => {
    if (!publickey) {
      logger.debug('publickey should not be falsy')
      const error = new Error('publickey should not be falsy')
      error.statusCode = 400
      error.title = 'خطا رخ داد'
      error.clientMessage = 'کلید عمومی معتبر نیست!'
      error.messageEnglish = 'publickey should not be falsy'
      throw error
    }
    return r.table(table).getAll(publickey, { index: 'publickey' })
      .run(connection)
      .then(cur => {
        return cur.toArray((err, result) => {
          if (err) {
            logger.error(`The queryOfUsers' cursor has some errors : ${err}`)
            return null
          } else if (!result || result.length === 0) {
            logger.warn('Thers is no result in queryOfUsers')
            return null
          } else {
            return (JSON.stringify(result, null, 2))
          }
        })
      })
      .catch((err) => {
        logger.error(`queryOfUsers is not responding!: ${err.message}`)
      })
  }
module.exports = {
    connect,
    queryOfUsers
}