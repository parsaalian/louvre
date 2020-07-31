const { createPainting, submit } = require('../components/transactions/transactions');

export default function userCreatePainting({ privateKey, paintingKey }) {
	let txn = createPainting(paintingKey, privateKey);
	txn = Buffer.from(txn).toString('base64');
	const request = submit({ txn }, true).then((response) => response.data);
	return {
		type: 'USER_MAKE_PAINTING',
		payload: request
	};
}
