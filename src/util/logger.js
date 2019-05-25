const log4js = require('log4js')
const config = require('../../app.config')

log4js.configure({
  appenders: {
    console: {
      type: 'console'
    }
  },
  categories: {
    default: {
      appenders: ['console'],
      level: config.Env === 'prod' ? 'error' : 'info'
    }
  }
})

const logger = log4js.getLogger()

module.exports = logger
