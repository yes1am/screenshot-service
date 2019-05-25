const _ = require('lodash')
const validate = require('express-validation')
const express = require('express')
const render = require('./http/render-http')
const { API_TOKENS } = require('../app.config')
const logger = require('./util/logger')
const { renderQuerySchema, renderBodySchema, sharedQuerySchema } = require('./util/validation')

function createRouter () {
  const router = express.Router()

  if (!_.isEmpty(API_TOKENS)) {
    logger.warn('x-api-key authentication required')

    router.use('/*', (req, res, next) => {
      const userToken = req.headers['x-api-key']
      if (!_.includes(API_TOKENS, userToken)) {
        const err = new Error('Invalid API token in x-api-key header.')
        err.status = 401
        return next(err)
      }

      return next()
    })
  } else {
    logger.warn('Warning: no authentication required to use the API')
  }

  const getRenderSchema = {
    query: renderQuerySchema,
    options: {
      allowUnknownBody: false,
      allowUnknownQuery: true
    }
  }

  router.get('/api/render', validate(getRenderSchema), render.getRender)

  const postRenderSchema = {
    body: renderBodySchema,
    query: sharedQuerySchema,
    options: {
      allowUnknownBody: false,
      allowUnknownQuery: false,

      // Without this option, text body causes an error
      // https://github.com/AndrewKeig/express-validation/issues/36
      contextRequest: true
    }
  }
  router.post('/api/render', validate(postRenderSchema), render.postRender)

  return router
}

module.exports = createRouter()
