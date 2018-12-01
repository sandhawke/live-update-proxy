const express = require('express')
// const debug = require('debug')('routes')
const H = require('escape-html-template-tag') // H.safe( ) if needed
// const querystring = require('querystring')
const op = require('./op')

const router = express.Router()

router.use('/static', express.static('static', {
  extensions: ['html', 'png', 'trig', 'nq', 'ttl', 'json', 'jsonld'],
  setHeaders: function (res, path, stat) {
    if (path.endsWith('.trig')) res.set('Content-Type', 'application/trig')
  }
}))

router.get('/', async (req, res) => {
  if (req.query.url) {
    res.send(await op.proxy(req.query.url))
  } else {
    res.send('' + H`<html><head></head><body>

<form method="get">
Document to poll: <input size="80" type="text" name="url"></input>
</form>
</body></html>
`)
  }
})

/*
router.get('/', async (req, res, next) => {
  const config = Object.assign({}, configFromFile)

  // the siteurl probably comes from appmgr which gets it via process.env
  if (!config.siteurl) {
    config.siteurl = req.appmgr.siteurl
  }

  if (req.query.src) {
    config.sourceList = req.query.src
    console.log('Using alternate src %j', config.sourceList)
  }

  // needs error handling
  // also, needs to cache result or something!  (but depends on sourceList, etc)

  try {
    res.send(await gendoc(config))
  } catch (e) {
    // should look at types of errors, some of which are reportable!
    console.error('Got gendoc error', e)
    res.status(500).send('<p>Internal server error, sorry.  Please try again later.  If you just changed an input document, try reverting your change.</p>')
  }
})
*/

module.exports = router
