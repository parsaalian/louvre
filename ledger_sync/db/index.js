'use strict';
require('dotenv').config();

const r = require('rethinkdb');
const { logger } = require('../system/logger');

/// //////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////  Connection Of RethinkDB  ////////////////////////////////////////////
/// //////////////////////////////////////////////////////////////////////////////////////////
const HOST = process.env.DB_HOST;
const PORT = process.env.DB_PORT;
const NAME = process.env.DB_NAME;
const RETRY_WAIT = process.env.RETRY_WAIT;
const AWAIT_TABLE = process.env.AWAIT_TABLE;

// Connection to db for query methods, run connect before querying
let connection = null;

const promisedTimeout = (fn, wait) => {
	return new Promise((resolve) => setTimeout(resolve, wait)).then(fn);
};

const awaitDatabase = () => {
	return r
		.tableList()
		.run(connection)
		.then((tableNames) => {
			if (!tableNames.includes(AWAIT_TABLE)) {
				throw new Error();
			}
			logger.info(`Successfully connected to database: ${NAME}`);
		})
		.catch(() => {
			logger.warn('Database not initialized:', NAME);
			logger.warn(`Retrying database in ${RETRY_WAIT / 1000} seconds...`);
			return promisedTimeout(awaitDatabase, RETRY_WAIT);
		});
};

const connect = () => {
	return r
		.connect({ host: HOST, port: PORT, db: NAME })
		.then((conn) => {
			connection = conn;
			return awaitDatabase();
		})
		.catch((err) => {
			if (err instanceof r.Error.ReqlDriverError) {
				logger.warn('Unable to connect to RethinkDB');
				logger.warn(`Retrying in ${RETRY_WAIT / 1000} seconds...`);
				return promisedTimeout(connect, RETRY_WAIT);
			}
			throw err;
		});
};

// Runs a specified query against a database table
const queryTable = (table, query, removeCursor = true) => {
	return query(r.table(table))
		.run(connection)
		.then((cursor) => (removeCursor ? cursor.toArray() : cursor))
		.catch((err) => {
			const message = err.message ? err.message : err;
			logger.error(`Query on "${table}" has some errors:` + ' ' + message);
			throw new Error(`Query on "${table}" has some errors:` + ' ' + err);
		});
};

// Use for queries that modify a table, turns error messages into errors
const modifyTable = (table, query) => {
	return queryTable(table, query, false)
		.then((results) => {
			if (!results) {
				throw new Error(`Unknown error while attempting to modify "${table}"`);
			}
			if (results.errors > 0) {
				throw new Error(results.first_error);
			}
			return results;
		})
		.catch((err) => {
			const message = err.message ? err.message : err;
			logger.error(`modifyTable on "${table}" has some errors:` + ' ' + message);
			throw new Error(`modifyTable on "${table}" has some errors:` + ' ' + err);
		});
};

/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////// Bootstrap Database //////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////

// This function bootstraps the database.
// If the database and tables exist, the function do nothing.
// Otherwise, create the database and tables.
const bootsrapDatabase = () => {
	return r
		.connect({ host: HOST, port: PORT })
		.then((conn) => {
			logger.info(`Creating "${NAME}" database...`);
			return r
				.dbList()
				.contains(NAME)
				.run(conn)
				.then((dbExist) => {
					if (dbExist) logger.info(`"${NAME}" already exists`);
					else {
						return r.dbCreate(NAME).run(conn);
					}
				})
				.then(() => {
					return Promise.all([
						r.db(NAME).tableList().contains('users').run(conn).then((tableExist) => {
							if (tableExist) logger.info('The users table already exists');
							else {
								return r
									.db(NAME)
									.tableCreate('users', {
										primary_key: 'publickey'
									})
									.run(conn);
							}
						}),

						r.db(NAME).tableList().contains('painting').run(conn).then((tableExist) => {
							if (tableExist) logger.info('The painting table already exists');
							else {
								return r
									.db(NAME)
									.tableCreate('painting', {
										primary_key: 'gene'
									})
									.run(conn);
							}
						}),

						r.db(NAME).tableList().contains('offer').run(conn).then((tableExist) => {
							if (tableExist) logger.info('The offer table already exists');
							else {
								return r
									.db(NAME)
									.tableCreate('offer', {
										primary_key: 'offerId'
									})
									.run(conn);
							}
						}),

						r.db(NAME).tableList().contains('blocks').run(conn).then((tableExist) => {
							if (tableExist) logger.info('The blocks table already exists');
							else {
								return r
									.db(NAME)
									.tableCreate('blocks', {
										primary_key: 'blockNum'
									})
									.run(conn);
							}
						})
					]);
				})
				.catch((err) => {
					const message = err.message ? err.message : err;
					logger.error('It could not bootstrap the Database' + ' ' + message);
					throw new Error('It could not bootstrap the Database' + ' ' + err);
				})
				.then(() => {
					logger.info('Bootstrapping completed');
					return conn.close();
				});
		})
		.catch((err) => {
			logger.error(`Connection to RethinkDb has some errors: ${err}`);
		});
};

module.exports = {
	connect,
	queryTable,
	modifyTable,
	bootsrapDatabase
};
