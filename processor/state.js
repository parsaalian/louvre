const pb = require('protobufjs');
const { createAccountAddress, createOfferAddress, createPlayerAddress } = require('../addressing/address');
const { logger } = require('./logger');

class BC98State {
	constructor(context) {
		this.context = context;
		this.addressCache = new Map([]);
	}

	encodeFunction(payload, pathFile, pathMessage) {
		try {
			const root = pb.loadSync(pathFile);
			const file = root.lookup(pathMessage);
			let message = [];
			let data = [];
			payload.forEach((element, index) => {
				message.push(file.create(element));
				data[index] = file.encode(message[index]).finish();
			});
			return data;
		} catch (err) {
			const message = err.message ? err.message : err;
			logger.error('Something bad happened while encoding:' + ' ' + message);
			throw new Error('Something bad happened while encoding:' + ' ' + err);
		}
	}

	// //////////////////////////////////////////////////////////////////////
	// ########## Load and Get Messages #######################
	// /////////////////////////////////////////////////////////////////////

	loadMessage(key, pathFile, pathMessage) {
		let address;
		switch (pathMessage) {
			case 'Account':
				address = createAccountAddress(key);
				break;
			case 'Offer':
				address = createOfferAddress(key[0], key[1]);
				break;
			case 'Player':
				address = createPlayerAddress(key);
				break;
			case 'Painting':
				address = createPaintingAddress(key);
				break;
			default:
				logger.warn('Bad Message!');
				break;
		}
		if (this.addressCache.has(address)) {
			if (this.addressCache.get(address) === null) {
				return Promise.resolve(new Map([]));
			} else {
				return Promise.resolve(
					pb
						.load(pathFile)
						.then((root) => {
							let map = new Map([]);
							const file = root.lookup(pathMessage);
							const dec = file.decode(this.addressCache.get(address));
							const decObject = file.toObject(dec);
							return map.set(address, decObject);
						})
						.catch((err) => {
							const message = err.message ? err.message : err;
							logger.error(`${pathFile} is not loading!: ${message}`);
							throw new Error(`${pathFile} is not loading!:` + ' ' + err);
						})
				);
			}
		} else {
			return this.context
				.getState([ address ])
				.then((addressValue) => {
					if (!addressValue[address]) {
						this.addressCache.set(address, null);
						return Promise.resolve(new Map([]));
					} else {
						let data = addressValue[address];
						this.addressCache.set(address, data);
						return pb
							.load(pathFile)
							.then((root) => {
								var map = new Map([]);
								const file = root.lookup(pathMessage);
								const dec = file.decode(data);
								const decObject = file.toObject(dec);
								return map.set(address, decObject);
							})
							.catch((err) => {
								const message = err.message ? err.message : err;
								logger.error(`${pathFile} is not loading!: ${message}`);
								throw new Error(`${pathFile} is not loading!:` + ' ' + err);
							});
					}
				})
				.catch((err) => {
					const message = err.message ? err.message : err;
					logger.error(`getState in blockchain is not responding!: ${message}`);
					throw new Error('getState in blockchain is not responding!:' + ' ' + err);
				});
		}
	}

	getMessage(key, pathMessage) {
		let address;
		let pathFile;
		switch (pathMessage) {
			case 'Account':
				address = createAccountAddress(key);
				pathFile = '../protos/account.proto';
				break;
			// TODO: be aware of proto file names.
			case 'Offer':
				address = createOfferAddress(key[0], key[1]);
				pathFile = '../protos/offer.proto';
				break;
			case 'Player':
				address = createPlayerAddress(key);
				pathFile = '../protos/player.proto';
				break;
			case 'Painting':
				address = createPaintingAddress(key);
				pathFile = '../protos/painting.proto';
				break;
			default:
				logger.warn('Bad Message!');
				break;
		}
		return this.loadMessage(key, pathFile, pathMessage).then((elements) => elements.get(address)).catch((err) => {
			const message = err.message ? err.message : err;
			logger.error(`loadMessage has some problems: ${message}`);
			throw new Error('loadMessage has some problems:' + ' ' + err);
		});
	}

	// //////////////////////////////////////////////////////////////////////
	// ########## Offer Actions #######################
	// /////////////////////////////////////////////////////////////////////

	makeOffer(paintingKey, sellerKey, buyerKey, offer) {
		try {
			const offerPayload = {
				paintingKey,
				sellerKey,
				buyerKey,
				offer,
				accepted: false
			};
			const offerData = this.encodeFunction(
				[ offerPayload ],
				'../protos/payload.proto',
				/* TODO: offer payload name */ 'Offer'
			);
			const offerAddress = createOfferAddress(paintingKey, buyerKey);
			this.addressCache.set(offerAddress, offerData[0]);

			return this.context.setState({
				[offerAddress]: offerData[0]
			});
		} catch (err) {
			const message = err.message || err;
			logger.error(`setState in makeOffer has some problems: ${message}`);
			throw new Error(`setState in makeOffer has some problems: ${err}`);
		}
	}

	acceptOffer(paintingKey, sellerKey, buyerKey) {
		return this.getMessage([ paintingKey, buyerKey ], 'Offer')
			.then((offerValue) => {
				if (
					!offerValue ||
					offerValue.paintingKey !== paintingKey ||
					offerValue.sellerKey !== sellerKey ||
					offerValue.buyerKey !== buyerKey
				) {
					logger.error('No offer with these attributes found!');
					throw new Error('Painting attributes are not valid!');
				}

				const offerAmount = Number(offerValue.offer);

				return this.getMessage(buyerKey, 'Player')
					.then((buyerValue) => {
						if (Number(buyerValue.balance) < offerAmount) {
							logger.error('Buyer does not have enough balance.');
							throw new Error('Not enough balance.');
						}

						return this.getMessage(paintingKey, 'Painting')
							.then((paintingValue) => {
								if (paintingValue.owner !== sellerKey) {
									logger.error('This player is not the owner of painting!');
									throw new Error('This player is not the owner of painting!');
								}

								return this.getMessage(sellerKey, 'Player').then((sellerValue) => {
									const offerPayload = {
										...offerValue,
										accepted: true
									};

									const sellerPayload = {
										...sellerValue,
										balance: sellerValue.balance + offerAmount
									};

									const buyerPayload = {
										...buyerValue,
										balance: buyerValue.balance - offerAmount
									};

									const paintingPayload = {
										...paintingValue,
										owner: buyerPayload.pubKey
									};

									const offerData = this.encodeFunction(
										[ offerPayload ],
										'../protos/offer.proto',
										'Offer'
									);
									const offerAddress = createOfferAddress([ paintingKey, buyerKey ]);

									const sellerData = this.encodeFunction(
										[ sellerPayload ],
										'../protos/player.proto',
										'Player'
									);
									const sellerAddress = createPlayerAddress(sellerKey);

									const buyerData = this.encodeFunction(
										[ buyerPayload ],
										'../protos/player.proto',
										'Player'
									);
									const buyerAddress = createPlayerAddress(buyerKey);

									const paintingData = this.encodeFunction(
										[ paintingPayload ],
										'../protos/player.proto',
										'Player'
									);
									const paintingAddress = createPaintingAddress(paintingKey);

									this.addressCache.set(offerAddress, offerData[0]);
									this.addressCache.set(sellerAddress, sellerData[0]);
									this.addressCache.set(buyerAddress, buyerData[0]);
									this.addressCache.set(paintingAddress, paintingData[0]);
								});

								logger.info(
									`Painting ${paintingKey} is changing ownership from player ${sellerKey} to ${buyerKey}`
								);

								return this.context
									.setState({
										[offerAddress]: offerData[0],
										[sellerAddress]: sellerData[0],
										[buyerAddress]: buyerData[0],
										[paintingAddress]: paintingData[0]
									})
									.catch((err) => {
										throw err;
									});
							})
							.catch((err) => {
								throw err;
							});
					})
					.catch((err) => {
						throw err;
					});
			})
			.catch((err) => {
				const message = err.message || err;
				logger.error(`getOffer in blockchain is not responding: ${message}`);
				throw new Error(`getOffer in blockchain is not responding: ${err}`);
			});
	}
}

module.exports = {
	BC98State
};
