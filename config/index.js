const pkg = require('../package.json')

const env = (pkg.config && pkg.config.env && pkg.config.env.toUpperCase()) || 'DEV'

const ALLOW_HTTP = true
const DEBUG_MODE = env === 'DEV'
const API_TOKENS = []
const PORT = 8080

const configs = {
  DEV: require('./dev'),
  FAT: require('./fat'),
  FWS: require('./fat'),
  UAT: require('./uat'),
  PRD: require('./prod'),
  PRO: require('./prod'),
  PROD: require('./prod')
}

module.exports = {
  env,
  Env: env,
  ...configs[env],
  ALLOW_HTTP,
  DEBUG_MODE,
  API_TOKENS,
  PORT
}
