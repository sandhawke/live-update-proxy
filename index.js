const fs = require('fs')
const fsp = fs.promises
const delay = require('delay')
const pAny = require('p-any')
const jpatch = require('jpatch')
const path = require('path')
const m = require('appmgr').create()
const debug = require('debug')('quilt-server')

const instances = {}
/**
 * Watch one file and send diffs to any streams watching it
 */
class FileMonitor {
  constructor (filename) {
    this.filename = filename
    this.text = ''
    this.streamCount = 0
    this.streams = []
    this.wake = null
    this.watch()
    this.loop()
    debug('created %O', this)
  }
  static obtain (filename) {
    let result = instances[filename]
    if (!result) {
      result = new FileMonitor(filename)
      instances[filename] = result
    }
    return result
  }
  addStream (req, res) {
    const stream = { res, alive: true, count: ++this.streamCount }
    debug('stream %n watching %s OPEN', stream.count, this.filename)
    req.on('close', () => {
      debug('stream %n watching %s CLOSED', stream.count, this.filename)
      stream.alive = false
    })
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    })
    this.sendFirstPatch(stream)
    this.streams.push(stream)
  }
  sendFirstPatch (stream) {
    // Some day we can be smarter and stream.req will include some
    // parameter indicating what version the client already has.  But
    // for now, we'll have to start from scratch, just overwriting the
    // whole thing.
    const patch = {
      jpatch: [ this.text ]
    }
    const patchEvent = `event: jpatch\ndata: ${JSON.stringify(patch)}\n\n`
    stream.res.write(patchEvent)
    debug('stream %d first event sent', stream.count)
  }
  clean () {
    this.streams = this.streams.filter(s => s.alive)
  }
  async loop () {
    while (true) {
      const newText = await fsp.readFile(this.filename, 'utf8')
      if (newText !== this.text && this.streams.length) {
        debug('new text!')
        const patch = {
          jpatch: jpatch.make(this.text, newText)
        }
        this.text = newText
        const patchEvent = `event: jpatch\ndata: ${JSON.stringify(patch)}\n\n`
        this.clean()
        this.streams.forEach(s => { s.res.write(patchEvent) })
        debug('patches sent')
      }
      // use a timeout to handle the race condition where it changed
      // between the time we read it and the now.  I don't trust that
      // inotify events wont sometimes get dropped.
      debug('sleeping for %s', this.filename)
      await pAny([delay(5000), this.woken()])
      debug('awakened for %s', this.filename)
      this.wake = null
    }
  }
  woken () {
    return new Promise(resolve => {
      this.wake = resolve
    })
  }
  /**
   * Call fs.watch to notice when this file changes.  When it does,
   * call this.wake() to wake the sleeping loop() function.  This
   * structure avoids overlapping reads which could seriously mess up
   * the event stream.
   */
  watch () {
    const opts = { persistent: false }
    this.watcher = fs.watch(this.filename, opts, (type) => {
      if (type === 'rename') { console.error(this.filename + ': removed?!') }
      if (this.wake) this.wake()
    })
  }
}

function sendPatchStream (fn, req, res) {
  let mon = FileMonitor.obtain(fn)
  mon.addStream(req, res)
}

// everything above should be refactored into patch-server

const sitemap = {
  'http://localhost:8080/static/': 'static/'
}

m.app.get('/__patches', async (req, res) => {
  const u = req.query.url
  debug('request url=%o', u)

  for (const [prefix, dir] of Object.entries(sitemap)) {
    if (u.startsWith(prefix)) {
      const tail = u.slice(prefix.length)
      const absdir = path.resolve(dir)
      let file = path.resolve(absdir, tail)
      if (!file.startsWith(absdir)) {
        res.code(401).send('squirrely URL')
        return
      }
      if (file.endsWith('/')) file = file + 'index'
      if (!file.endsWith('.html')) file = file + '.html'
      debug('       file=%o', file)
      sendPatchStream(file, req, res)      
    }
  }

})
