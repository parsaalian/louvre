'use strict';

const blocks = require('../db/blocks');
const state = require('../db/state');
const protos = require('./protos');
const { logger } = require('../system/logger');

const deltaQueue = {
	_queue: [],
	_running: false,

	add(promisedFn) {
		this._queue.push(promisedFn);
		this._runUntilEmpty();
	},

	_runUntilEmpty() {
		if (this._running) return;
		this._running = true;
		this._runNext();
	},

	_runNext() {
		if (this._queue.length === 0) {
			this._running = false;
		} else {
			const current = this._queue.shift();
			return current().then(() => this._runNext());
		}
	}
};

const stateAdder = (address) => {
	const criterion = address.substring(68, 70);
	let addState;
	switch (criterion) {
		case 'ac':
			addState = state.addUser;
			break;
		case 'ba':
			addState = state.addPainting;
			break;
		case 'af':
			addState = state.addOffer;
			break;
		default:
			logger.warn('NO VALID ADDRESS!!');
	}
	return addState;
};

const getEntries = ({ address, value }) => {
	const criterion = address.substring(68, 70);
	let decObject;
	try {
		switch (criterion) {
			case 'ac':
				const decAccount = protos.Account.decode(value);
				decObject = protos.Account.toObject(decAccount, {});
				break;
			case 'ba':
				const decPainting = protos.Painting.decode(value);
				decObject = protos.Painting.toObject(decPainting, {});
				break;
			case 'af':
				const decOffer = protos.Offer.decode(value);
				decObject = protos.Offer.toObject(decOffer, {});
				break;
			default:
				logger.warn('INVALID ADDRESS');
		}
		return decObject;
	} catch (err) {
		const message = err.message ? err.message : err;
		logger.error(`getEntries(${address}) has some errors: ` + ' ' + message);
		throw new Error(`getEntries(${address}) has some errors: ` + ' ' + err);
	}
};

const entryAdder = (block) => (change) => {
	try {
		const addState = stateAdder(change.address);
		const entry = getEntries(change);
		return addState(entry, block.blockNum);
	} catch (err) {
		const message = err.message ? err.message : err;
		logger.error('entryAdder() has some errors: ' + ' ' + message);
		//throw new Error('entryAdder() has some errors: ' + ' ' + err)
	}
};

const handle = (block, changes) => {
	deltaQueue.add(() => {
		return Promise.all(changes.map(entryAdder(block)))
			.catch((err) => {
				const message = err.message ? err.message : err;
				logger.error('entryAdder(block) has some errors: ' + ' ' + message);
				//throw new Error('entryAdder(block) has some errors: ' + ' ' + err)
			})
			.then(() => {
				blocks.insert(block);
			});
	});
};

module.exports = {
	handle
};
