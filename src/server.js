const express = require('express')
const path = require('path')
const cors = require('cors')
const { initBrowser, initPages } = require('./core/browser-page')
const requireHttps = require('./middleware/require-https')
const logger = require('./util/logger')

const {
  ALLOW_HTTP,
  CORS_ORIGIN,
  PORT,
  MAX_PAGE = 10
} = require('../app.config')
const bodyParser = require('body-parser')
const compression = require('compression')
const errorResponder = require('./middleware/error-responder')
const errorLogger = require('./middleware/error-logger')
const router = require('./router')

const initWebServer = () => {
  const app = express()

  if (!ALLOW_HTTP) {
    logger.warn('All requests require HTTPS.')
    app.use(requireHttps())
  } else {
    logger.info('ALLOW_HTTP=true, unsafe requests are allowed. Don\'t use this in production.')
  }

  const corsOpts = {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH']
  }
  logger.info('Using CORS options:', corsOpts)
  app.use(cors(corsOpts))

  // Limit to 10mb if HTML has e.g. inline images
  app.use(bodyParser.text({ limit: '4mb', type: 'text/html' }))
  app.use(bodyParser.json({ limit: '4mb' }))

  app.use(compression({
    // Compress everything over 10 bytes
    threshold: 10
  }))

  // static file
  app.use(express.static(path.join(__dirname, './static'), {
    index: 'readme.html'
  }))

  // slbhealthcheck
  // /vi/health path depend on config on cd/
  app.use('/vi/health', (req, res) => {
    res.send('health check success')
  })
  app.use('/', router)

  app.use(errorLogger())
  app.use(errorResponder())

  app.listen(PORT, () => {
    logger.info(
      'Express server listening on http://localhost:%d/ in %s mode',
      PORT,
      app.get('env')
    )
  })
}

const ignite = async () => {
  // launch browser
  const browser = await initBrowser()

  // init max page
  await initPages(browser, MAX_PAGE)

  // 初始化服务器
  initWebServer()
}

ignite()
