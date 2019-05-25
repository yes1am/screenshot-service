const _ = require('lodash')
const logger = require('../util/logger')

const SLICE_THRESHOLD = 1000

function createErrorLogger (_opts) {
  const opts = _.merge({
    logRequest: status => status >= 400 && status !== 404 && status !== 503,
    logStackTrace: status => status >= 500 && status !== 503
  }, _opts)

  return function errorHandler (err, req, res, next) {
    const status = err.status ? err.status : 500

    if (opts.logRequest(status)) {
      logRequestDetails('error', req, status)
    }

    if (opts.logStackTrace(status)) {
      logger.error(err, err.stack)
    } else {
      logger.error(err.toString())
    }

    next(err)
  }
}

function logRequestDetails (logLevel, req) {
  logger[logLevel]('Request headers:', deepSupressLongStrings(req.headers))
  logger[logLevel]('Request parameters:', deepSupressLongStrings(req.params))
  logger[logLevel]('Request body:', req.body)
}

function deepSupressLongStrings (obj) {
  const newObj = {}
  _.each(obj, (val, key) => {
    if (_.isString(val) && val.length > SLICE_THRESHOLD) {
      newObj[key] = `${val.slice(0, SLICE_THRESHOLD)} ... [CONTENT SLICED]`
    } else if (_.isPlainObject(val)) {
      deepSupressLongStrings(val)
    } else {
      newObj[key] = val
    }
  })

  return newObj
}

module.exports = createErrorLogger
