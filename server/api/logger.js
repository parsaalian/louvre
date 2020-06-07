const winston = require('winston')
const { combine, timestamp, label, prettyPrint, colorize, json, splat } = winston.format

/// /////////////////////////////////////////////////////////////////////////////
/// ///////////////////////Winston Logger///////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////

const logger = winston.createLogger({
  exitOnError: false,
  format: combine(
    timestamp(),
    prettyPrint(),
    colorize(),
    splat()
  ),
  level: 'info',
  // format: winston.format.json(),
  //defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exceptions.log' })
  ]
})

//if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
//}
logger.stream = {
  write: function(message, encoding) {
    logger.info(message);
  },
};


module.exports =  logger

