const router = require('express').Router()
const _ = require('lodash')

const { submit } = require('../api/transactions')
const logger  = require('../api/logger')

const { User } = require('../db/user')



const { successRes } = require('../middlewares/response')
const auth = require('../middlewares/auth')


/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////// Blockchain API Functions ////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
const handlePromisedResponse = func => (req, res, next) => {
  func(req)
    .then(filterQueryParams(req.query))
    .then(result => res.json(result))
    .catch(err => next(err))
}
const handleBody = (func) =>
  handlePromisedResponse(req => {
      return func(req.body, _.assign({}, req.query, req.params, req.internal))
  })

const filterQueryParams = ({ fields, omit }) => result => {
  const filterParams = obj =>
    fields
      ? _.pick(obj, fields.split(","))
      : omit
      ? _.omit(obj, omit.split(","))
      : obj;

  return Array.isArray(result)
    ? _.map(result, filterParams)
    : filterParams(result);
};

/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////// POST ENDPOINTS  /////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// ///////////////////////////////////////////////////////////////////////////////////////////////

router.post('/registerBlockchain', auth.isAuthorized, (req, res, next) => {
  User.findOne({ email: req.session.email }, (err, user) => {
    if (err) {
      logger.error(
        `The find action on User Collection with email ${req.session.email} has some errors: ${err}`
      );
      err.statusCode = 500;
      err.title = 'خطا در سرور'
      err.clientMessage = 'در ثبت نام در بلاک چین مشکلی پیش آمده است!'
      err.messageEnglish = "Error happened during the registration in blockchain!";
      next(err);
    } else if (!user) {
      logger.error(`User with email ${req.session.email} doesn't exist!`)
      const error = new Error('Email address is not valid!')
      error.statusCode = 404
      error.clientMessage = 'آدرس ایمیل معتبر نیست!'
      error.title = 'خطا رخ داد'
      error.messageEnglish = 'Email address is not valid!'
      next(error)
    } else {
      if (!user.pubKey) {
        user.updateOne({ $set: { pubKey: req.body.publicKey } }, (err, doc) => {
          if (err) {
            logger.error(`user update has some errors: ${err}`);
            err.statusCode = 500;
            err.title = 'خطا در سرور'
            err.clientMessage = 'در ثبت نام در بلاک چین مشکلی پیش آمده است!'
            err.messageEnglish = "Error happened during the registration in blockchain!";
            next(err);
          } else {
            req.session.pubKey = req.body.publicKey;
            const data = {
              email: user.email,
              pubKey: req.body.publicKey,
            }
            successRes(res, 'The client is registered in blockchain successfully', data)
          }
        });
      } else {
        const error = new Error("PublicKey already exists!");
        error.statusCode = 409;
        error.clientMessage = 'کلید عمومی تکراری است!'
        error.title = 'خطا رخ داد'
        error.messageEnglish = "PublicKey already exists!";
        next(error);
      }
    }
  })
})
// This end point handle all transactions which users send to blockchain.
router.post("/transactions", handleBody(submit)); 



module.exports = router;
