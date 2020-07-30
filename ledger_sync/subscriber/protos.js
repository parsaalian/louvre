'use strict';

const path = require('path');
const _ = require('lodash');
const protobuf = require('protobufjs');
const { logger } = require('../system/logger');

const protos = {};

const loadProtos = (filename, protoNames) => {
	const protoPath = path.resolve(__dirname, '../../protos', filename);
	return protobuf
		.load(protoPath)
		.then((root) => {
			protoNames.forEach((name) => {
				protos[name] = root.lookupType(name);
			});
		})
		.catch((err) => {
			const message = err.message ? err.message : err;
			logger.error(`Loading protos has some errors: ${message}`);
			throw new Error(`Loading protos has some errors: ${err}`);
		});
};

// This function load all proto files and give the roots.
const compile = () => {
	return Promise.all([
		loadProtos('account.proto', [ 'Account' ]),

		loadProtos('payload.proto', [ 'PGPayload' ]),

		loadProtos('painting.proto', [ 'Painting' ]),

		loadProtos('offer.proto', [ 'Offer' ])
	]).catch((err) => {
		const message = err.message ? err.message : err;
		logger.error(`Loading protos has some errors: ${message}`);
		throw new Error(`Loading protos has some errors: ${err}`);
	});
};

module.exports = _.assign(protos, { compile });
