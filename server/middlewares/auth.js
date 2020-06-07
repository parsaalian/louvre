module.exports.isAuthorized = (req, res, next) => {
  if (!req.session.email) {
    const err = new Error('unauthorized cookie')
    err.statusCode = 401
    err.clientCode = 1
    err.clientMessage = 'unauthorized cookie'
    next(err)
  } else {
    next()
  }
}
