const { makeOffer, submit } = require('../components/transactions/transactions');

export default function userMakeOffer({ privateKey, paintingKey, offer }) {
	let txn = makeOffer(privateKey, paintingKey, offer);
	txn = Buffer.from(transaction).toString('base64');
	const request = submit({ txn }, true).then((response) => response.data);
	return {
		type: 'USER_MAKE_OFFER',
		payload: request
	};
}
