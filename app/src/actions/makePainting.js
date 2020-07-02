const { makePainting, submit } = require('../components/transactions/transactions');

export default function userMakeOffer({ privateKey, paintingKey }) {
	let txn = makePainting(paintingKey, privateKey);
	txn = Buffer.from(txn).toString('base64');
	const request = submit({ txn }, true).then((response) => response.data);
	return {
		type: 'USER_MAKE_PAINTING',
		payload: request
	};
}
