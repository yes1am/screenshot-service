const { getPage, recyclePage, InflightRequests } = require('./browser-page')
const _ = require('lodash')
const { DEBUG_MODE } = require('../../app.config')
const logger = require('../util/logger')
const Constants = require('../constants')
const devices = require('puppeteer/DeviceDescriptors')

let tracker = null

async function render (_opts = {}, req) {
  const opts = _.merge({
    cookies: [],
    scrollPage: false,
    emulateScreenMedia: true,
    ignoreHttpsErrors: false,
    html: null,
    viewport: {
      width: 1600,
      height: 1200
    },
    goto: {
      waitUntil: 'networkidle2'
    },
    output: 'pdf',
    pdf: {
      format: 'A4',
      printBackground: true
    },
    screenshot: {
      type: 'png',
      fullPage: !_opts.screenshot.selector // 截取元素时不能为true
    },
    failEarly: false
  }, _opts)

  if (_.get(_opts, 'pdf.width') && _.get(_opts, 'pdf.height')) {
    // pdf.format always overrides width and height, so we must delete it
    // when user explicitly wants to set width and height
    opts.pdf.format = undefined
  }

  const page = await getPage()
  if (!page) {
    return Constants.BUSY_MESSAGE
  }
  const pageInstance = page.instance

  tracker = new InflightRequests(pageInstance)

  if (_.get(_opts, 'extHeader.name') && _.get(_opts, 'extHeader.value')) {
    // puppeteer
    await pageInstance.setExtraHTTPHeaders({
      [_.get(_opts, 'extHeader.name')]: _.get(_opts, 'extHeader.value')
    })
  }

  let data

  logger.info('set cookies: ', opts.cookies)
  try {
    logger.info('Set browser viewport..')
    await pageInstance.setViewport(opts.viewport)
    if (opts.emulateScreenMedia) {
      logger.info('Emulate @media screen..')
      await pageInstance.emulateMedia('screen')
    }
    if (opts.cookies && opts.cookies.length > 0) {
      logger.info('Setting cookies..')

      const client = await pageInstance.target().createCDPSession()

      await client.send('Network.enable')
      await client.send('Network.setCookies', { cookies: opts.cookies })
    }

    const device = opts.device && devices[opts.device]
    // emulate
    if (device) {
      logger.info(`emulate device ${device} ..\n`)
      await pageInstance.emulate(device)
    }

    if (opts.html) {
      logger.info('Set HTML ..')
      // https://github.com/GoogleChrome/puppeteer/issues/728
      await pageInstance.goto(`data:text/html;charset=UTF-8,${opts.html}`, opts.goto)
    } else {
      logger.info(`Goto url ${opts.url} ..\n`)
      await pageInstance.goto(opts.url, opts.goto).catch(e => {
        const inflight = tracker.inflightRequests()
        throw new Error(`Navigation failed: ${e.message}
        ${inflight.map(request => `
        url :${request.url()}
        resRemoteAdd:${JSON.stringify(request.response && request.response() && request.response().remoteAddress())}
        resStatus:${request.response && request.response() && request.response().status()}
        `).join('\n')}`)
      })
    }

    if (_.isNumber(opts.waitFor) || _.isString(opts.waitFor)) {
      logger.info(`Wait for ${opts.waitFor} ..`)
      await pageInstance.waitFor(opts.waitFor)
    }

    if (opts.scrollPage) {
      logger.info('Scroll page ..')
      await scrollPage(pageInstance)
    }

    logger.info('Rendering ..')
    if (opts.output === 'pdf') {
      if (DEBUG_MODE) {
        const msg = `\n\n---------------------------------\n
          Chrome does not support rendering in "headed" mode.
          See this issue: https://github.com/GoogleChrome/puppeteer/issues/576
          \n---------------------------------\n\n
        `
        throw new Error(msg)
      }
      data = await pageInstance.pdf(opts.pdf)
    } else {
      // This is done because puppeteer throws an error if fullPage and clip is used at the same
      // time even though clip is just empty object {}
      const screenshotOpts = _.cloneDeep(_.omit(opts.screenshot, ['clip']))
      const clipContainsSomething = _.some(opts.screenshot.clip, val => !_.isUndefined(val))
      if (clipContainsSomething) {
        screenshotOpts.clip = opts.screenshot.clip
      }

      let element = pageInstance
      if (opts.screenshot.selector && await pageInstance.$(opts.screenshot.selector)) {
        element = await pageInstance.$(opts.screenshot.selector)
      }
      data = await element.screenshot(screenshotOpts)
      logger.info('Rendering finish ..')
    }
  } catch (err) {
    logger.error(`Error when rendering page: ${err}`)
    logger.error(err.stack)
  }

  tracker && tracker.dispose && tracker.dispose()
  recyclePage(page)

  return data
}

async function scrollPage (page) {
  // Scroll to page end to trigger lazy loading elements
  await page.evaluate(() => {
    const scrollInterval = 100
    const scrollStep = Math.floor(window.innerHeight / 2)
    const bottomThreshold = 400

    function bottomPos () {
      return window.pageYOffset + window.innerHeight
    }

    return new Promise((resolve, reject) => {
      function scrollDown () {
        window.scrollBy(0, scrollStep)

        if (document.body && (document.body.scrollHeight - bottomPos() < bottomThreshold)) {
          window.scrollTo(0, 0)
          setTimeout(resolve, 500)
          return
        }

        setTimeout(scrollDown, scrollInterval)
      }

      setTimeout(reject, 30000)
      scrollDown()
    })
  })
}

module.exports = {
  render
}
