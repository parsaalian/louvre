const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const cookiePareser = require('cookie-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
require('dotenv').config();
const useragent = require('express-useragent');

const protos = require('./api/protos');
const logger = require('./api/logger');
const app = express();
const cors = require('cors');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_DATABASE, { useNewUrlParser: true, useUnifiedTopology: true });
const mongooseDB = mongoose.connection;
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

const waitParser = (req, res, next) => {
	const DEFAULT_WAIT = Math.floor(500000 / 1000);
	const parsed = req.query.wait === '' ? DEFAULT_WAIT : Number(req.query.wait);
	req.query.wait = _.isNaN(parsed) ? null : parsed;
	next();
};

// const path = require('path')
// app.use(express.static(path.join(__dirname, 'static')))

var morgan = require('morgan');
app.use(
	morgan(
		':remote-addr ":method :url HTTP/:http-version" :status :res[content-length] :response-time ":referrer" ":user-agent" ',
		{ stream: logger.stream }
	)
); //, { "stream": loggerStream() })

app.use(bodyParser.json());
//app.use(bodyParser.raw({ type: 'application/octet-stream' }))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookiePareser());
app.use(waitParser);

app.use(cors({ credentials: true, origin: [ 'http://localhost' ] }));
app.use(useragent.express());
var sess = {
	secret: process.env.SESSION_SECRET,
	resave: false,
	proxy: true,
	saveUninitialized: true,
	rolling: true,
	SameSite: true,
	name: 'sessionId',
	cookie: {
		//secure: true,
		httpOnly: true,
		//domain:,
		path: '/',
		maxAge: 6000000
	},
	store: new MongoStore({ mongooseConnection: mongooseDB })
};
if (app.get('env') === 'production') {
	app.set('trust proxy', 1); // trust first proxy
	sess.cookie.secure = true; // serve secure cookies
}
app.use(session(sess));
var server = require('http').createServer(app);

const rethink = require('./db/rethinkdb');

const blockchain = require('./api/transactions');

var authRoutes = require('./routes/auth');
var blockchainRoutes = require('./routes/blockchain');
var userRoutes = require('./routes/user');
var paintingRoutes = require('./routes/painting');

app.use('/auth', authRoutes);
app.use('/blockchain', blockchainRoutes);
app.use('/user', userRoutes);
app.use('/paintings', paintingRoutes);

/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// /////////////////////Error Handler ////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////

app.use(function(err, req, res, next) {
	logger.warn(err.statusCode + ' - ' + err.messageEnglish);
	if (!err.statusCode) {
		logger.error(err.stack);
		res.status(500).json({
			actionName: 'Intrnal Error',
			metaData: {
				title: 'خطا در سرور',
				message: 'لطفا لحظاتی بعد دوباره اقدام کنید.',
				messageEnglish: 'something bad happened!'
			}
		});
	} else {
		res.status(err.statusCode).send({
			actionName: 'Error',
			metaData: {
				title: err.title,
				clientErrorCode: err.clientCode,
				message: err.clientMessage,
				messageEnglish: err.messageEnglish
			}
		});
	}
});

/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////// START ///////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
Promise.all([ blockchain.connect(), protos.compile(), rethink.connect() ])
	.catch((err) => {
		logger.error(`Starting services has some errors: ${err}`);
	})
	.then(() => {
		logger.info('Server is ready ...');
	});

/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// /////////////////////      END     ////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
const port = process.argv[2] || process.env.PORT || 3001;
server.listen(port, () => {
	logger.info(`Server is running on ${port}`);
});
