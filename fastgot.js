const got = require('got')
const debug = require('debug')('fastgot')
const EventEmitter = require('eventemitter3')


// or use node's 'events',
// and maybe url is event name?

const eventRelay = new EventEmitter()
const lastResponse = {}
const timeLastWanted = {}

function sleep (ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

async function fastgot (url) {
  let response = lastResponse[url]
  if (!response) {
    debug('booting', url)
    await booting(url)
    response = lastResponse[url]
    debug('booting complete', url)
  } else {
    timeLastWanted[url] = new Date()
  }
  return response
}

function booting (url) {
  const start = !timeLastWanted[url]
  timeLastWanted[url] = new Date()
  if (start) run(url)
  return new Promise(resolve => {
    function listener (eventURL) {
      if (url === eventURL) {
        eventRelay.removeListener('got', listener)
        resolve()
      }
    }
    eventRelay.on('got', listener)
  })
}

let counter = 0
async function run (url) {
  let me = counter++
  let extra = 0
  debug('runner %d starting for %s', me, url)
  let lastFetchEnded = 0
  let delay = 0
  while (true) {
    let now = new Date()
    const unfetched = now - lastFetchEnded
    // debug('runner %d unfetched %d delay %d', me, unfetched, delay)
    if (unfetched >= delay) {
      debug('runner %d fetching, unfetched %d >= delay %d', me, unfetched, delay)
      console.log('actually fetching', url)
      lastResponse[url] = await got(url)
      debug('runner %d got resolved', me)
      now = new Date()
      eventRelay.emit('got', url)
      lastFetchEnded = now
    }
    const unwanted = now - timeLastWanted[url]
    delay = 1000 + (unwanted / 10)
    // debug('runner %d, delay set to %dms', me, delay)
    // only sleep a little while, so we can be awaked
    await sleep(100)

    if (unwanted > 1000 * 1 * 5) {
      debug('runner %d expiring, url not wanted recently', me)
      delete timeLastWanted[url]
      delete lastResponse[url]
      return
    }
  }
}

module.exports = fastgot
