const m = require('appmgr').create()
const delay = require('delay')
const debug = require('debug')('test')
const { got } = require('pagemon')
const idsplit = require('idsplit')

const docs = {}

/*
  latestDoc['foo'] is the latest Doc object with .name === 'foo'
*/  
const latestDoc = {}

// Just a counter, but start with the time incase the server restarts
// OR: use a hash of the text
const ver = (new Date()).valueOf()

class Doc {
  constructor (name, text) {
    this.name = name
    this.text = text

    if (!this.version) {
      this.version = ver++
    }

    if (!this.idsplit) {
      this.idsplit = idsplit(this.text)
    }

    this.older = []
    const previous = latestDoc[name]
    if (previous) {
      this.older.push(previous.older)
      delete previous.older

      // forget about anything more than 10 versions back
      if (this.older.length > 10) {
        this.older.splice(10, this.older.length)
      }
    }

    latestDoc[name] = this
    debug('set latestDoc[%s] = %o', name, this)
  }
}

// have some lazy first doc thing?

m.app.get('/:doc', async (req, res) => {
  debug('doc', req.param.doc)
  const doc = latestDoc[req.param.doc]
  if (doc) {
    // inject the version and script
    const text = doc.text.replace(/<head>/, `<head>
<script>
  var quiltDocumentName=${JSON.stringify(req.param.doc)}
  var quiltDocumentVersion=${JSON.stringify(doc.version)}
</script>
<script src="/static/quilt.js" async></script>
`)
    res.send(text)
  } else {
    res.status(404).send(m.H`not found, no doc "${req.param.doc}"`)
  }
})

m.app.get('/__patches', async (req, res) => {
  const doc = latestDoc[req.query.name]
  const sinceVersion = req.query.since

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  })
  
  let open = true
  req.on('close', () => {
    console.log('CLOSED')
    open = false
  })
  // setinterval sending ':\n\n' every 30s?  I think I prefer the client do that.

  let sinceDoc = doc.older.find(x => x.version === sinceVersion)

  function sendChanges (from, to, ver) {
    const patch = {}
    if (from) {
      const changes = idsplit.changes(from.idsplit, to.idsplit)
      for (const key of changes.update) {
        patch['#' + key] = to.idsplit[key]
      }
    } else {
      patch['/'] = to.text // will this wipe out the client script?
    }
    debug('sending dompatch %j %j', to.version, patch)
    res.write(`event: dompatch\nid: ${to.version}\ndata: ${JSON.stringify(patch)}\n\n`)
  }
  
  function send () {
    sendChanges(sinceDoc, doc)
    sinceDoc = doc
  }

  send()
  doc.on('update', send)

  // req.end() on server shutdown?
  }
})

/*
async function proxy (url) {
  let text = (await got(url)).body
  text = text.replace(/<head>/, '<head>' + script())
  return text
}

function script () {
  return `<script>
${livePatch.toString()}
livePatch();
</script>`
}
*/

function doc (...args) {
  return new Doc(...args)
}

module.exports = { doc, Doc, appmgr: m, app: m.app }
