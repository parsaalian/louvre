const { createHash } = require('crypto');
const { CryptoFactory, createContext } = require('sawtooth-sdk/signing');
const protobuf = require('sawtooth-sdk/protobuf');
const { Secp256k1PrivateKey } = require('sawtooth-sdk/signing/secp256k1');
const _ = require('lodash');

require('dotenv').config();
const { Stream } = require('sawtooth-sdk/messaging/stream');
const {
	Message,
	ClientBatchSubmitRequest,
	ClientBatchSubmitResponse,
	ClientBatchStatus,
	ClientBatchStatusRequest,
	ClientBatchStatusResponse
} = require('sawtooth-sdk/protobuf');
const protos = require('./protos');
const logger = require('../api/logger');

const VALIDATOR_URL = process.env.VALIDATOR_URL;
const stream = new Stream(VALIDATOR_URL);

const FAMILY_NAME = process.env.FAMILY_NAME;
const FAMILY_VERSION = process.env.FAMILY_VERSION;
const NAMESPACE = process.env.NAMESPACE;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const context = createContext('secp256k1');
const privateKey = Secp256k1PrivateKey.fromHex(PRIVATE_KEY);
const batchSigner = new CryptoFactory(context).newSigner(privateKey);
const publicKeyHex = context.getPublicKey(privateKey).asHex();

/// //////////////////////////////////////////////////////////////////////////////////////////
/// //////////////////////////////////////////////////////////////////////////////////////////

// This function take a string and return the hash(sha512) of it.
const hash = (v) => {
	return createHash('sha512').update(v).digest('hex');
};

// This function takes an object and encodes it with proto files and return it.
// payload = { action: "", typeOfTransaction: {} }
const encodeProto = (payload) => {
	try {
		const message = protos.PGPayload.create(payload);
		const enc = protos.PGPayload.encode(message).finish();
		return enc;
	} catch (err) {
		logger.error('payload could not be encoded!' + ' ' + err);
		throw new Error('payload could not be encoded!' + ' ' + err.message);
	}
};

// This function takes an object and a string makes the transaction
// and encode with prorto files and return it.
// payload = { action: "", typeOfTransaction: {} }
// signer = The signer of the transaction.
const createTxn = (payload, signer) => {
	try {
		const payloadBytes = encodeProto(payload);
		const transactionHeaderBytes = protobuf.TransactionHeader
			.encode({
				familyName: FAMILY_NAME,
				familyVersion: FAMILY_VERSION,
				inputs: [ NAMESPACE ],
				outputs: [ NAMESPACE ],
				signerPublicKey: signer.getPublicKey().asHex(),
				nonce: (Math.random() * 10 ** 18).toString(36),
				batcherPublicKey: publicKeyHex, // signer.getPublicKey().asHex(),
				dependencies: [],
				payloadSha512: hash(payloadBytes)
			})
			.finish();
		const transaction = protobuf.Transaction.create({
			header: transactionHeaderBytes,
			headerSignature: signer.sign(transactionHeaderBytes),
			payload: payloadBytes
		});
		const transactionBytes = protobuf.TransactionList
			.encode({
				transactions: [ transaction ]
			})
			.finish();
		return transactionBytes;
	} catch (err) {
		logger.error('Transaction could not be created!' + ' ' + err);
		throw new Error('Transaction could not be created!' + ' ' + err.message);
	}
};

// This function takes an array makes the batch
// and encode with prorto files and return it.
// transactions = The transactions which should be batched.
const createBatch = (transactions) => {
	try {
		const batchHeaderBytes = protobuf.BatchHeader
			.encode({
				signerPublicKey: batchSigner.getPublicKey().asHex(),
				transactionIds: transactions.map((txn) => txn.headerSignature)
			})
			.finish();

		const batchSignature = batchSigner.sign(batchHeaderBytes);

		return protobuf.Batch.create({
			header: batchHeaderBytes,
			headerSignature: batchSignature,
			transactions: transactions
		});
	} catch (err) {
		logger.error('Batch could not be created!' + ' ' + err);
		throw new Error('Batch could not be created!' + ' ' + err.message);
	}
};

// This function takes an array makes the batch
// and encode with prorto files and return it and the transactions.
// txnList = The transactions which should be batched.
const batch = (txnList) => {
	try {
		const txns = protobuf.TransactionList.decode(txnList).transactions;
		return [ createBatch(txns), txns ];
	} catch (err) {
		logger.error('Batch could not be created!' + ' ' + err);
		throw new Error('Batch could not be created!' + ' ' + err.message);
	}
};

// This function open a connection between server and validator.
const connect = () => {
	return new Promise((resolve) => stream.connect(resolve))
		.then(() => {
			stream.onReceive((msg) => {
				logger.warn('Received message of unknown type:', msg.messageType);
			});
		})
		.catch((err) => {
			logger.error('Server can not connect to Validator!' + ' ' + err);
			throw new Error('Server can not connect to Validator!');
		});
};

// This functions sends the batches to validator.
const submit = (txnJson, { wait }) => {
	const txnBuffer = Buffer.from(txnJson.txn, 'base64');
	const batchAndTx = batch(txnBuffer);
	logger.info(`The transaction with transactionId ${batchAndTx[1][0].headerSignature} is recieved`);
	const batchBytes = batchAndTx[0];
	return stream
		.send(
			Message.MessageType.CLIENT_BATCH_SUBMIT_REQUEST,
			ClientBatchSubmitRequest.encode({
				batches: [ batchBytes ]
			}).finish()
		)
		.then((response) => {
			return ClientBatchSubmitResponse.decode(response);
		})
		.then((decoded) => {
			const submitStatus = _.findKey(ClientBatchSubmitResponse.Status, (val) => val === decoded.status);
			if (submitStatus !== 'OK') {
				logger.error(`Batch submission failed with status '${submitStatus}'`);
				throw new Error(`Batch submission failed with status '${submitStatus}'`);
			}
			if (wait === null) {
				return { batch: batchBytes.headerSignature };
			}

			return stream
				.send(
					Message.MessageType.CLIENT_BATCH_STATUS_REQUEST,
					ClientBatchStatusRequest.encode({
						batchIds: [ batchBytes.headerSignature ],
						wait: true,
						timeout: wait
					}).finish()
				)
				.then((statusResponse) => {
					const statusBody = ClientBatchStatusResponse.decode(statusResponse).batchStatuses[0];
					if (statusBody.status !== ClientBatchStatus.Status.COMMITTED) {
						const id = statusBody.batchId;
						const status = _.findKey(ClientBatchStatus.Status, (val) => val === statusBody.status);
						const message =
							statusBody.invalidTransactions.length > 0 ? statusBody.invalidTransactions[0].message : '';
						logger.error(`Batch ${id} is ${status}, with message: ${message}`);
						// throw new Error(
						//   `Batch ${id} is ${status}, with message: ${message}`
						// );
						const error = new Error();
						error.clientCode = 100;
						error.title = 'تراکنش ناموفق';
						error.messageEnglish = message.split('Error:')[1];
						error.clientMessage = messageMap.get(message.split('Error:')[1].trim());
						throw error;
					}

					// Wait to return until new block is in database
					return new Promise((resolve) =>
						setTimeout(() => {
							resolve({ batch: batchBytes.headerSignature });
						}, 1000)
					)
						.then(() => {
							logger.info(
								`The transaction with transactionId ${batchAndTx[1][0].headerSignature} is done.`
							);
							return {
								success: true,
								actionName: 'Successfull Transaction',
								metaData: {
									title: 'تراکنش موفق',
									messageEnglish: 'The txn is done successfully!',
									message: 'تراکنش با موفقیت انجام شد!'
								},
								data: {
									txId: batchAndTx[1][0].headerSignature
								}
							};
						})
						.catch((err) => {
							logger.error(`The transaction with transactionId ${batchAndTx[1][0]
								.headerSignature} is not done.
                            The process had some errors: ${err}`);

							const error = new Error('');
							error.clientCode = 100;
							error.clientMessage = 'The txn is rejected!';
							throw error;
						});
				});
		})
		.catch((err) => {
			err.statusCode = 400;
			throw err;
		});
};

module.exports = {
	createBatch,
	hash,
	connect,
	submit,
	batch,
	encodeProto,
	createTxn
};
