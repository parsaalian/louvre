const crypto = require('crypto');

const hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);

const NAMESPACE = '59b423';

const createAccountAddress = (accountId) => {
	return NAMESPACE + 'ac' + hash(accountId).substr(0, 60) + 'ac';
};

const createOfferAddress = (paintingKey, buyerKey) => {
	return NAMESPACE + 'off' + hash(paintingKey + buyerKey).substr(0, 60) + 'off';
};

const createPlayerAddress = (pubKey) => {
	return NAMESPACE + 'plr' + hash(pubKey).substr(0, 60) + 'plr';
};

const createPaintingAddress = (paintKey) => {
	return NAMESPACE + 'ab' + hash(Buffer.from(paintKey)).substr(0, 60) + 'ab';
};

const createSellAddress = (offerId) => {
	return NAMESPACE + 'sl' + hash(offerId).substr(0,60) + 'sl';
};

module.exports = {
	createAccountAddress,
	createOfferAddress,
	createPlayerAddress,
	createPaintingAddress
};
