'use strict'

const path = require('path')
const _ = require('lodash')
const protobuf = require('protobufjs')
const logger  = require('./logger')

const protos = {}

const loadProtos = (filename, protoNames) => {
  try {
    const protoPath = path.resolve(__dirname, '../../protos', filename)
    return protobuf.load(protoPath)
      .then(root => {
        protoNames.forEach(name => {
          protos[name] = root.lookupType(name)
        })
      })
  } catch (err) {
    logger.error(`Something bad happend in loading protos with errors: ${err}`)
    throw new Error(`Something bad happend in loading protos with errors: ${err}`)
  }
}

// This function load proto files and return the roots.
const compile = () => {
  return Promise.all([
    loadProtos('payload.proto', [
      'PGPayload'
    ])
  ])
}

module.exports = _.assign(protos, { compile })
