
const puppeteer = require('puppeteer')
const { IS_HEADLESS = true, DEBUG_MODE, proxyServer } = require('../../app.config')
const os = require('os')
const path = require('path')
const logger = require('../util/logger')

const executablePath = os.platform() === 'linux'
  ? path.join(__dirname, '../../local_node_module/chrome-linux-641577/chrome')
  : path.join(__dirname, '../../local_node_module/chrome-mac-641577/Chromium.app/Contents/MacOS/Chromium')

let browser = null
const pages = []

const initBrowser = async (opts = {}) => {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: IS_HEADLESS,
      ignoreHTTPSErrors: opts.ignoreHttpsErrors,
      args: [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // --proxy-server=http=${proxyServer} 这种不行
        // `--proxy-server=${proxyServer}`, 代理
        '--disable-features=LookalikeUrlNavigationSuggestionsUI'
      ],
      sloMo: DEBUG_MODE ? 250 : undefined,
      executablePath
    })
    logger.info(`Browser Launch Success!`)
    logger.info(`proxyServer is ${proxyServer}`)
  }
  return browser
}

const initPages = async (browser, max) => {
  for (let i = 0; i < max; i++) {
    const page = await browser.newPage()
    pages.push({
      instance: page,
      isFree: true
    })
  }

  logger.info(`${max} Pages Init Success!\n`)
}

const getPage = () => {
  const page = pages.find(item => item.isFree)
  if (page) {
    page.isFree = false
  }
  return page
}

const recyclePage = page => {
  const index = pages.findIndex(item => item === page)
  if (index > -1) {
    pages[index].isFree = true
  }
}

class InflightRequests {
  constructor (page) {
    this._page = page
    this._requests = new Set()
    this._onRequest = this._onRequest.bind(this)
    this._onFinish = this._onFinish.bind(this)
    this._onFail = this._onFail.bind(this)

    this._page.on('request', this._onRequest)
    this._page.on('requestfinished', this._onFinish)
    this._page.on('requestfailed', this._onFail)
  }

  _onRequest (request) {
    this._requests.add(request)
  }

  _onFinish (request) {
    logger.info(`request finish:
    url:${request.url()}
    resRemoteAdd:${JSON.stringify(request.response && request.response() && request.response().remoteAddress())}
    resStatus:${request.response && request.response() && request.response().status()}\n`)
    this._requests.delete(request)
  }

  _onFail (request) {
    logger.error(`request failed:
    url:${request.url()}
    resRemoteAdd:${JSON.stringify(request.response && request.response() && request.response().remoteAddress())}
    resStatus:${request.response && request.response() && request.response().status()}\n`)
    this._requests.delete(request)
  }

  inflightRequests () { return Array.from(this._requests) }

  dispose () {
    this._page.removeListener('request', this._onRequest)
    this._page.removeListener('requestfinished', this._onFinish)
    this._page.removeListener('requestfailed', this._onFail)
  }
}

module.exports = {
  initBrowser,
  initPages,
  getPage,
  recyclePage,
  InflightRequests
}
