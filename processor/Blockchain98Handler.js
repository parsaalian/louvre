const { TransactionHandler } = require('sawtooth-sdk/processor/handler')
const { InternalError, InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')
const pb = require('protobufjs')
require('dotenv').config()

const { BC98State } = require('./state')
const { logger } = require('./logger')

const MIN_VALUE = process.env.MIN_VALUE
const PG_FAMILY = process.env.PG_FAMILY
const PG_VERSION = process.env.PG_VERSION
const PG_NAMESPACE = process.env.PG_NAMESPACE

// Function to obtain the payload obtained from client

const _decodeRequest = (payload) => {
  if (payload === undefined || payload === null || !Buffer.isBuffer(payload)) {
    const error = new Error('The payload is not valid.')
    throw error
  }
  return pb.load('../protos/payload.proto')
  .then((root) => {
    const file = root.lookup('PGPayload')
    const dec = file.decode(payload)
    return dec
  })
  .catch((err) => {
    const message = err.message ? err.message : err
    logger.error('Loading proto file "payload.proto" and decoding has some errors:' + ' ' + message)
    throw new Error('Loading proto file "payload.proto" and decoding has some errors:' + ' ' + err)
  })
}

    // Function to display the errors

const _toInternalError = (err) => {
  logger.info('in error message block')
  const message = err.message ? err.message : err
  logger.error(message)
  throw new InternalError(message)
}

class Blockchain98Handler extends TransactionHandler {
  constructor () {
    super(PG_FAMILY, [PG_VERSION], [PG_NAMESPACE])
  }

  apply (transactionProcessRequest, context) {
    return _decodeRequest(transactionProcessRequest.payload)
    .then((update) => {
      let header = transactionProcessRequest.header
      let txId = transactionProcessRequest.signature
      let userPublicKey = header.signerPublicKey
      let bC98State = new BC98State(context)
      let action = update.action
      let timestamp = update.timestampClient
      console.log(update)
      if (!action) {
        logger.error('Action is required!')
        throw new Error('Action is required!')
      }

      // This function get the following inputs and check the
      // database address and pass inputs to "BC98State.setAccount"
      // label: "USER"
      // publicKey: transactionProcessRequest.header.signerPublicKey
      // transactionId: transactionProcessRequest.signature
      // actionTx: update.action // Action of transaction
      const createAccount = (label, publicKey) => {
        if (label !== 'USER') {
          const error = new Error('The label is not valid.')
          return error
        }
        if (publicKey !== userPublicKey) {
          const error = new Error('The publickey is not valid.')
          throw error
        }
        logger.info('Creating Account for ' + publicKey)
        return bC98State.getMessage(publicKey, 'Account')
        .catch((err) => {
          const message = err.message ? err.message : err
          logger.error(`getAccount in blockchain is not responding!: ${message}`)
          throw new Error(`getAccount in blockchain is not responding!: ${message}`)
        })
        .then((accountValue) => {
          if (accountValue && accountValue.publickey !== undefined) {
            logger.error('Account Already exists!!')
            throw new Error('Account Already exists!!')
          }
          return bC98State.setAccount(label, publicKey)
        })
      }


      // This function get the following inputs and check the
      // database address and pass inputs to "BC98State.setCharge"
      // amount: The amount of charge.
      // publicKey: transactionProcessRequest.header.signerPublicKey
      // transactionId: transactionProcessRequest.signature
      // actionTx: update.action // Action of transaction
      // timestampTx: The timestamp which is sent by client.
      const chargeAccount = (amount, publicKey) => {
        if(isNaN(Number(amount)) || !Number.isInteger(Number(amount))) {
          throw new Error('The amount is not valid!')
        }
        logger.info('Charging Account : ' + publicKey + ' with ' + amount)
        return bC98State.setCharge(amount, publicKey)
      }


      let actionPromise

      switch (action) {

        case 'CreateAccountAction':
          if (!update && !update.createaccount) {
            logger.error('update does not have "createaccount" field!')
            throw new Error('update does not have "createaccount" field!')
          }
          let label = update.createaccount.label
          actionPromise = createAccount(label, userPublicKey)
          break


        case 'ChargeAccountAction':
          if (!update && !update.chargeAccount) {
            logger.error('update does not have "chargeaccount" field!')
            throw new Error('update does not have "chargeaccount" field!')
          }
          let amount = update.chargeaccount.amount

          actionPromise = chargeAccount(amount, userPublicKey)
          break

       
        default :
          throw new Error(`Action must be create or take not ${action}`)
      }
        // Get the current state, for the key's address

      return actionPromise
        // .catch((err) => {
        //     let message = err.message ? err.message : err
        //     throw console.log(`the functions in PolyGameHandler are not working!: ${message}` )
        // })
        .then(addresses => {
          if (addresses.length === 0) {
            throw new Error('State Error!')
          }
        })
    })
    .catch((err) => {
      const message = err.message ? err.message : err
      logger.error('Something bad happend! ' + message)
      throw new InvalidTransaction(message)
    })
  }
}

module.exports = Blockchain98Handler

