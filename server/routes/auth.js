var router = require('express').Router();

const logger = require('../api/logger');

const { User } = require('../db/user');

const { successRes } = require('../middlewares/response');
var auth = require('../middlewares/auth');

/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////// GET ENDPOINTS   /////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////

// This end point check "Authentication" of users from MongoDB.
router.get('/auth', (req, res, next) => {
	if (!req.session.email) {
		logger.error('Unauthorized cookie');
		const error = new Error('Unauthorized cookie');
		error.statusCode = 401;
		error.clientCode = 1;
		error.title = 'خطا رخ داد';
		error.clientMessage = 'کاربر حق دسترسی ندارد!';
		error.messageEnglish = "The user doesn't have authorization!";
		next(error);
	} else {
		res.json({
			isAuth: true,
			email: req.session.email, // Instead of req.user.email
			pubKey: req.session.pubKey
		});
	}
});

// This end point delete "Token" of users who want to logout from MongoDB.
router.get('/logout', auth.isAuthorized, (req, res, next) => {
	const agant = req.useragent;
	const userActivity = {
		action: 'LOGOUT',
		timestamp: Date.now(),
		device: agant.source,
		ip: req.ip
	};
	User.findOneAndUpdate({ email: req.session.email }, { $push: { userActivities: userActivity } }, (err, user) => {
		if (err) {
			logger.error(`Updating user activity has some error: ${err} `);
			err.statusCode = 500;
			err.clientCode = 2;
			err.messageEnglish = 'User activity could not be added!';
			next(err);
		}
		req.session.destroy();
		res.sendStatus(200);
	});
});

/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////// POST ENDPOINTS  /////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////

// This end point get the users' information and save those in MongoDB.
router.post('/register', (req, res, next) => {
	const body = {
		name: req.body.name,
		lastName: req.body.lastName,
		email: req.body.email,
		password: req.body.password
	};
	const user = new User({ ...req.body, label: [ 'USER' ] });
	user.save((err, doc) => {
		if (err) {
			if ((err.name = 'MongoError' && err.code === 11000)) {
				logger.error(
					`The save action on User Collection with document ${req.body.email} has some errors: ${err}`
				);
				err.statusCode = 400;
				err.clientCode = 9;
				err.title = 'خطا در سرور';
				err.clientMessage = 'شما قبلا ثبت نام کرده اید!';
				err.messageEnglish = 'The user has registered already!';
				next(err);
			} else {
				logger.error(
					`The save action on User Collection with document ${req.body.email} has some errors: ${err}`
				);
				err.statusCode = 500;
				err.clientCode = 9;
				err.title = 'خطا در سرور';
				err.clientMessage = 'در فرآیند ثبت نام مشکلی پیش آمده است!';
				err.messageEnglish = 'Error happened during the registration!';
				next(err);
			}
		} else {
			const data = {
				email: user.email,
				pubKey: user.pubKey,
				isVerified: user.isVerified,
				isActive: user.isActive
			};
			successRes(res, 'Registration is done successfully', data);
		}
	});
});

router.post('/changePassword', auth.isAuthorized, (req, res, next) => {
	User.findOne({ email: req.session.email }, (err, user) => {
		if (err) {
			logger.error(`The query on User Collection with email ${req.session.email} has some errors: ${err}`);
			err.statusCode = 500;
			err.clientCode = 14;
			err.clientMessage = 'در فرآیند تغییر گذرواژه مشکلی پیش آمده است!';
			err.title = 'خطا در سرور';
			err.messageEnglish = 'Error happened during the changing password!';
			next(err);
		} else if (!user) {
			logger.warn(`Email address is not valid!`);
			const error = new Error('Email address is not valid!');
			error.statusCode = 400;
			error.clientCode = 12;
			error.clientMessage = 'آدرس ایمیل معتبر نیست!';
			error.title = 'خطا رخ داد';
			error.messageEnglish = 'Email address is not valid!';
			next(error);
		} else {
			user.comparePassword(req.body.password, (err, isMatch) => {
				if (err) {
					logger.error(`comparePassword method has some errors: ${err}`);
					err.statusCode = 500;
					err.clientCode = 14;
					err.clientMessage = 'در فرآیند تغییر گذرواژه مشکلی پیش آمده است!';
					err.title = 'خطا در سرور';
					err.messageEnglish = 'Error happened during the changing password!';
					next(err);
				} else if (!isMatch) {
					logger.warn('Password is not valid!');
					const error = new Error('Inputs are not valid!');
					error.statusCode = 400;
					error.clientCode = 15;
					error.clientMessage = 'ورودی های درخواستی معتبر نیستند!';
					error.title = 'خطا رخ داد';
					error.messageEnglish = 'Inputs are not valid!';
					next(error);
				} else {
					user.password = req.body.newPassword;
					user.save((err, doc) => {
						if (err) {
							logger.error(
								`The save action on User Collection with document ${req.session
									.email} has some errors: ${err}`
							);
							err.statusCode = 500;
							err.clientCode = 14;
							err.clientMessage = 'در فرآیند تغییر گذرواژه مشکلی پیش آمده است!';
							err.title = 'خطا در سرور';
							err.messageEnglish = 'Error happened during the changing password!';
							next(err);
						} else {
							successRes(res, 'password is successfuly changed');
						}
					});
				}
			});
		}
	});
});

// This end point execute the following actions:
// 1. Find the document of a user who send the email.
// 2. Compare the Passord to hash of the password which is stored in MongoDB.
// 3. Generate a token and save it in MongoDB.
// 4. Send the tocken as a cookie to client.
router.post('/login', (req, res, next) => {
	const agent = req.useragent;
	User.findOne({ email: req.body.email }, (err, user) => {
		if (err) {
			logger.error(`The find action on User Collection with email ${req.body.email} has some errors: ${err}`);
			err.statusCode = 500;
			err.clientCode = 16;
			err.clientMessage = 'در ورود شما مشکلی پیش آمده است!';
			err.title = 'خطا در سرور';
			err.messageEnglish = 'Error happened during the login!';
			next(err);
		} else if (!user) {
			const error = new Error('Email or Password are not valid!');
			error.statusCode = 400;
			error.clientCode = 8;
			error.clientMessage = 'ایمیل یا گذرواژه معتبر نیستند!';
			error.title = 'خطا رخ داد';
			error.messageEnglish = 'Email or Password are not valid!';
			next(error);
		} else if (user.isVerified !== true) {
			const error = new Error('The email is not verified!');
			error.statusCode = 400;
			error.clientCode = 17;
			error.clientMessage = 'آدرس ایمیل شما هنوز راستی آزمایی نشده است!';
			error.title = 'خطا رخ داد';
			error.messageEnglish = 'The email is not verified!';
			next(error);
		} else if (user.isActive !== true) {
			const error = new Error('The account is not active!');
			error.statusCode = 400;
			error.clientCode = 18;
			error.clientMessage = 'حساب کاربری شما غیرفعال شده است!';
			error.title = 'خطا رخ داد';
			error.messageEnglish = 'The account is not active!';
			next(error);
		} else {
			user.comparePassword(req.body.password, (err, isMatch) => {
				if (err) {
					logger.error(`comparePassword method has some errors: ${err}`);
					err.statusCode = 500;
					err.clientCode = 16;
					err.clientMessage = 'در ورود شما مشکلی پیش آمده است!';
					err.title = 'خطا در سرور';
					err.messageEnglish = 'Error happened during the login!';
					next(err);
				} else if (!isMatch) {
					logger.info('Passwords are not match');
					const error = new Error('Email or Password are not valid!');
					error.statusCode = 400;
					error.clientCode = 8;
					error.clientMessage = 'ایمیل یا گذرواژه معتبر نیستند!';
					error.title = 'خطا رخ داد';
					error.messageEnglish = 'Email or Password are not valid!';
					next(error);
				} else {
					const userActivity = {
						action: 'LOGIN',
						timestamp: Date.now(),
						device: agent.source,
						ip: req.ip
					};
					user.userActivities.push(userActivity);
					user.emailVerificationString = undefined;
					user.save((err, doc) => {
						if (err) {
							logger.error(`Adding activity has some errors: ${err}`);
							err.statusCode = 500;
							err.clientCode = 16;
							err.clientMessage = 'در ورود شما مشکلی پیش آمده است!';
							err.title = 'خطا در سرور';
							err.messageEnglish = 'Error happened during the login!';
							next(err);
						} else {
							req.session.email = req.body.email;
							req.session.pubKey = user.pubKey;
							res.json({
								isAuth: true,
								profile: {
									name: user.name,
									lastName: user.lastName,
									email: user.email
								},
								email: user.email,
								pubKey: user.pubKey,
								name: user.name,
								lastName: user.lastName
							});
						}
					});
				}
			});
		}
	});
});

module.exports = router;
