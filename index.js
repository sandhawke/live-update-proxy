const m = require('appmgr').create()
// const delay = require('delay')
const debug = require('debug')('quilt')
// const { got } = require('pagemon')
const idsplit = require('idsplit')
const cheerio = require('cheerio')
const EventEmitter = require('events')

/*
  latestDoc['foo'] is the latest Doc object with .name === 'foo'
*/
const latestDoc = {}

// Just a counter, but start with the time incase the server restarts
// OR: use a hash of the text
let ver = 1000 // (new Date()).valueOf()

class Doc {
  constructor (name, text) {
    this.name = name
    this.text = text

    if (!this.version) {
      this.version = (ver++).toString()
    }

    if (!this.idsplit) {
      this.$ = cheerio.load(this.text)
      this.idsplit = idsplit(this.$)
      // maybe it got damaged?  seems to need this
      this.$ = cheerio.load(this.text)
    }

    this.older = []
    const previous = latestDoc[name]
    if (previous) {
      // take over the EventEmitter from the previous one
      this.ee = previous.ee
      delete previous.ee
      
      this.older.push(...previous.older)
      this.older.unshift(previous)
      delete previous.older

      // forget about anything more than this-many versions back
      const keepVersions = 2
      if (this.older.length > keepVersions) {
        this.older.splice(keepVersions, this.older.length)
      }
    } else {
      this.ee = new EventEmitter()
    }

    latestDoc[name] = this
    
    // maybe compute the dompatch?  but what if no one's watching?
    // let the first one compute it, and save it somewhere for others
    // to get at, I think.
    this.ee.emit('update')
    
    // debug('set latestDoc[%s] = %O', name, this)
    debug('set latestDoc[%s]', name)
  }

  findVersion (v) {
    if (this.version === v) return this
    return this.older.find(x => x.version === v)
  }
}

// have some lazy first doc thing?

m.app.get('/__patches', async (req, res) => {
  const docname = req.query.name
  const sinceVersion = req.query.since
  debug('__patches name=%j since=%j', docname, sinceVersion)
  let doc = latestDoc[docname]
  let sinceDoc = doc ? doc.findVersion(sinceVersion) : undefined

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  })

  // let open = true
  req.on('close', () => {
    console.log('CLOSED')
    doc.ee.off('update', send)
    // open = false
  })
  // setinterval sending ':\n\n' every 30s?  I think I prefer the client do that.

  function sendChanges (from, to, ver) {
    const patch = {}
    if (from) {
      const changes = idsplit.changes(from.idsplit, to.idsplit)
      for (const key of changes.update) {
        const selector = '#' + key
        // debug('to.$ = ', to.$)
        // debug('to.$("#p2").html() = ', to.$('#p2').html())
        patch[selector] = to.$(selector).text()
      }
    } else {
      patch[':root'] = to.text // will this wipe out the client script?
    }
    debug('sending dompatch %j %j', to.version, patch)
    const patchEvent = `event: dompatch
id: ${to.version}
data: ${JSON.stringify(patch)}\n\n`
    res.write(patchEvent)
    // save patchEvent for the next thread?  Or some other way to save
    // work if we have a lot of watchers?
  }

  function send () {
    doc = latestDoc[docname]
    sendChanges(sinceDoc, doc)
    sinceDoc = doc
  }

  send()
  doc.ee.on('update', send)

  // req.end() on server shutdown?
})

m.app.get('/:doc', async (req, res) => {
  const docname = req.params.doc
  debug('doc', req.params.doc)
  const doc = latestDoc[docname]
  if (doc) {
    // inject the version and script
    const text = doc.text.replace(/<head>/, `<head>
<script>
  var quiltDocumentName=${JSON.stringify(docname)}
  var quiltDocumentVersion=${JSON.stringify(doc.version)}
</script>
<script src="/static/quilt.js" async></script>`)
    res.send(text)
  } else {
    res.status(404).send(m.H`not found, no doc "${docname}"`)
  }
})


function doc (...args) {
  return new Doc(...args)
}

module.exports = { doc, Doc, appmgr: m, app: m.app }
