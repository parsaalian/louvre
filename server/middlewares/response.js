const successRes = (res, message, data, metaData, statusCode = 200) => {
    return res.status(statusCode).json({ success: true, message: message, data: data, metaData: metaData })
  }

  module.exports = {
    successRes
  }