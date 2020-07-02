const { createHash } = require('crypto');
const { CryptoFactory, createContext } = require('sawtooth-sdk/signing');
const protobuf = require('sawtooth-sdk/protobuf');
const { Secp256k1PrivateKey } = require('sawtooth-sdk/signing/secp256k1');

const pb = require('protobufjs');
const protoJson = require('../../../src/generated_protos.json');
const root = pb.Root.fromJSON(protoJson);
const PGPayload = root.lookup('PGPayload');
const axios = require('axios');

const hash = (v) => {
	return createHash('sha512').update(v).digest('hex');
};

const FAMILY_NAME = 'blockchain98';
const FAMILY_VERSION = '1.0';
const NAMESPACE = '59b423';

const baseRequest = (opts) => {
	return axios(opts);
};

const postBinary = (endpoint, data) => {
	return baseRequest({
		method: 'POST',
		url: endpoint,
		headers: { 'Content-Type': 'application/json' },
		// prevent Mithril from trying to JSON stringify the body
		data
	});
};

const submit = (txn, wait = false) => {
	console.log(wait);
	return postBinary(`/blockchain/transactions${wait ? '?wait' : ''}`, txn);
};

const getSigner = (privKeyStr) => {
	const context = createContext('secp256k1');
	var privateKey = Secp256k1PrivateKey.fromHex(privKeyStr);
	var signer = new CryptoFactory(context).newSigner(privateKey);
	return signer;
};

const encodeProto = (payload) => {
	const message = PGPayload.create(payload);
	const enc = PGPayload.encode(message).finish();
	return enc;
};

const createTxn = (payload, signer) => {
	const payloadBytes = encodeProto(payload);
	const transactionHeaderBytes = protobuf.TransactionHeader
		.encode({
			familyName: FAMILY_NAME,
			familyVersion: FAMILY_VERSION,
			inputs: [ NAMESPACE ],
			outputs: [ NAMESPACE ],
			signerPublicKey: signer.getPublicKey().asHex(),
			nonce: (Math.random() * 10 ** 18).toString(36),
			batcherPublicKey: '02065387b2ef65907896387805f363e032301de2723f61bbef7cec3be438808129', //signer.getPublicKey().asHex(),
			dependencies: [],
			payloadSha512: hash(payloadBytes)
		})
		.finish();
	const transaction = protobuf.Transaction.create({
		header: transactionHeaderBytes,
		headerSignature: signer.sign(transactionHeaderBytes),
		payload: payloadBytes
	});
	const transactionBytes = protobuf.TransactionList.encode({ transactions: [ transaction ] }).finish();
	return transactionBytes;
};

const createAccount = (privKeyStr) => {
	const signer = getSigner(privKeyStr);
	const payload = {
		action: 'CreateAccountAction',
		createaccount: {
			label: 'USER'
		}
	};
	const txnBytes = createTxn(payload, signer);
	return txnBytes;
};

const chargeAccount = (privKeyStr, amount) => {
	const signer = getSigner(privKeyStr);
	const payload = {
		action: 'ChargeAccountAction',
		timestampClient: Number(Math.floor(Date.now() / 1000).toFixed(3)).toString(),
		chargeaccount: { amount: amount }
	};
	const txnBytes = createTxn(payload, signer);
	return txnBytes;
};

const makeOffer = (privKeyStr, paintingKey, offer) => {
	const signer = getSigner(privKeyStr);
	const payload = {
		action: 'MakeOfferAction',
		timestampClient: Number(Math.floor(Date.now() / 1000).toFixed(3)).toString(),
		makeOffer: {
			paintingKey,
			offer
		}
	};
	const txnBytes = createTxn(payload, signer);
	return txnBytes;
};

const makePainting = (paintingKey, privKeyStr) => {
	const signer = getSigner(privKeyStr);
	const payload = {
		action: 'CreatePaintingAction',
		timestampClient: Number(Math.floor(Date.now() / 1000).toFixed(3)).toString(),
		createPainting: {
			gene: paintingKey
		}
	};
	const txnBytes = createTxn(payload, signer);
	return txnBytes;
};

module.exports = {
	submit,
	hash,
	createAccount,
	chargeAccount,
	makeOffer,
	makePainting
};
