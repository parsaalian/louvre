'use strict';
require('dotenv').config();
const r = require('rethinkdb');

const _ = require('lodash');
const { Stream } = require('sawtooth-sdk/messaging/stream');
const {
	Message,
	EventList,
	EventSubscription,
	EventFilter,
	StateChangeList,
	ClientEventsSubscribeRequest,
	ClientEventsSubscribeResponse
} = require('sawtooth-sdk/protobuf');

const HOST = process.env.DB_HOST;
const PORT = process.env.DB_PORT;
const NAME = process.env.DB_NAME;

const deltas = require('./deltas');
const { logger } = require('../system/logger');

const PREFIX = process.env.PREFIX;
const NULL_BLOCK_ID = process.env.NULL_BLOCK_ID;
const VALIDATOR_URL = process.env.VALIDATOR_URL;
const stream = new Stream(VALIDATOR_URL);

// Parse Block Commit Event
const getBlock = (events) => {
	const block = _.chain(events)
		.find((e) => e.eventType === 'sawtooth/block-commit')
		.get('attributes')
		.map((a) => [ a.key, a.value ])
		.fromPairs()
		.value();

	return {
		blockNum: parseInt(block.block_num),
		blockId: block.block_id,
		stateRootHash: block.state_root_hash
	};
};

// Parse State Delta Event
const getChanges = (events) => {
	const event = events.find((e) => e.eventType === 'sawtooth/state-delta');
	if (!event) return [];

	const changeList = StateChangeList.decode(event.data);
	return changeList.stateChanges.filter((change) => change.address.slice(0, 6) === PREFIX);
};

// Handle event message received by stream
const handleEvent = (msg) => {
	if (msg.messageType === Message.MessageType.CLIENT_EVENTS) {
		const events = EventList.decode(msg.content).events;
		deltas.handle(getBlock(events), getChanges(events));
	} else {
		logger.warn('Received message of unknown type:', msg.messageType);
	}
};

// Send delta event subscription request to validator
const subscribe = () => {
	const blockSub = EventSubscription.create({
		eventType: 'sawtooth/block-commit'
	});
	const deltaSub = EventSubscription.create({
		eventType: 'sawtooth/state-delta',
		filters: [
			EventFilter.create({
				key: 'address',
				matchString: `^${PREFIX}.*`,
				filterType: EventFilter.FilterType.REGEX_ANY
			})
		]
	});
	let blockId = NULL_BLOCK_ID;
	return r
		.connect({ host: HOST, port: PORT, db: NAME })
		.then((conn) => {
			return r.table('blocks').isEmpty().run(conn, (err, answer) => {
				if (err) {
					throw new Error(err);
				}
				if (!answer) {
					return r.table('blocks')('blockNum').max().run(conn, (err, blockNum) => {
						if (err) {
							throw new Error('Could not get max of blockNum, since' + ' ' + err);
						}
						const blockMax = blockNum > 4 ? blockNum - 4 : blockNum;
						return r
							.table('blocks')
							.filter(r.row('blockNum').eq(blockMax))
							.run(conn)
							.catch((err) => {
								throw new Error('Query on blocks has some problems:' + ' ' + err);
							})
							.then((cur) => {
								return cur.next((err, doc) => {
									if (err) {
										throw new Error('The cursor has some problems: ' + ' ' + err);
									}
									blockId = doc.blockId;
									conn.close();
									return stream
										.send(
											Message.MessageType.CLIENT_EVENTS_SUBSCRIBE_REQUEST,
											ClientEventsSubscribeRequest.encode({
												lastKnownBlockIds: [ blockId ],
												subscriptions: [ blockSub, deltaSub ]
											}).finish()
										)
										.then((response) => ClientEventsSubscribeResponse.decode(response))
										.then((decoded) => {
											const status = _.findKey(
												ClientEventsSubscribeResponse.Status,
												(val) => val === decoded.status
											);
											if (status !== 'OK') {
												logger.error(`Validator responded with status "${status}"`);
												throw new Error(`Validator responded with status "${status}"`);
											}
										});
								});
							});
					});
				} else {
					conn.close();
					return stream
						.send(
							Message.MessageType.CLIENT_EVENTS_SUBSCRIBE_REQUEST,
							ClientEventsSubscribeRequest.encode({
								lastKnownBlockIds: [ blockId ],
								subscriptions: [ blockSub, deltaSub ]
							}).finish()
						)
						.then((response) => ClientEventsSubscribeResponse.decode(response))
						.then((decoded) => {
							const status = _.findKey(
								ClientEventsSubscribeResponse.Status,
								(val) => val === decoded.status
							);
							if (status !== 'OK') {
								logger.error(`Validator responded with status "${status}"`);
								throw new Error(`Validator responded with status "${status}"`);
							}
						});
				}
			});
		})
		.catch((err) => {
			throw new Error('Subscriber has some errors' + ' ' + err);
		});
};

// Start stream and send delta event subscription request
const start = () => {
	return new Promise((resolve) => {
		stream.connect(() => {
			stream.onReceive(handleEvent);
			subscribe().then(resolve);
		});
	});
};

module.exports = {
	start
};
