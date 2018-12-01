const debug = require('debug')('op')
const fastgot = require('./fastgot')

async function proxy (url) {
  let text = (await fastgot(url)).body
  text = text.replace(/<head>/, '<head>' + script())
  return text
}

function script () {
  return `<script>
${livePatch.toString()}
livePatch();
</script>`
}

// the text of this function is what's injected into the server.  It
// does NOT run here in node.js
function livePatch () {
  alert('injected! ' + document.location)
}

module.exports = { proxy }
