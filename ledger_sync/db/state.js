'use strict';

const _ = require('lodash');
const r = require('rethinkdb');
const db = require('./');
const { logger } = require('../system/logger');

// The following functions get the data from "Blockchain"
// and update the corresponded table in RethinkDB.
// tableName: The table with which would work.
// indexName: The index of the tableName.
// indexValue: The value of the indexName.
// doc: the data which is given from "Blockchain".
// blockNum: The block number in which the change happened.
const addBlockState = (tableName, indexName, indexValue, doc, blockNum) => {
	logger.info(`The following document inserts to table: "${tableName}" in block: "${blockNum}"`);
	logger.info('%O', doc);
	return db.modifyTable(tableName, (table) => {
		return table
			.getAll(indexValue, { index: indexName })
			.filter({ endBlockNum: Number.MAX_SAFE_INTEGER })
			.coerceTo('array')
			.do((oldDocs) => {
				return oldDocs.filter({ startBlockNum: blockNum }).coerceTo('array').do((duplicates) => {
					return r.branch(
						// If there are duplicates, do nothing
						duplicates.count().gt(0),
						duplicates,
						// Otherwise, update the end block on any old docs,
						// and insert the new one
						table.getAll(indexValue, { index: indexName }).update({ endBlockNum: blockNum }).do(() => {
							return table.insert(
								_.assign({}, doc, {
									startBlockNum: blockNum,
									endBlockNum: Number.MAX_SAFE_INTEGER,
									timestamp: new Date()
								}),
								{
									conflict: 'replace'
								}
							);
						})
					);
				});
			});
	});
};

// The following functions get the data from "Blockchain"
// and return the function "addBlockState".
// "first parameter": the data which is given from "Blockchain".
// blockNum: The block number in which the change happened.

const addUser = (user, blockNum) => {
	return addBlockState('users', 'publickey', user.publickey, user, blockNum);
};

const addPainting = (painting, blockNum) => {
	return addBlockState('painting', 'gene', painting.gene, painting, blockNum);
};

module.exports = {
	addUser,
	addPainting
};
