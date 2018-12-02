let running = false

function livePatch () {
  if (running) return
  running = true
  console.log('livePatch Running')
  
  // alert('injected! ' + document.location)

  let events = new window.EventSource('/__patches?since=' +
                                      window.quiltDocumentVersion +
                                      '&name=' +
                                      window.quiltDocumentName
  )
  events.addEventListener('dompatch', e => {
    // const version = e.data.newVersion
    // console.log('got dompatch event', e)
    const patch = JSON.parse(e.data)
    // console.log('patch: ', patch)
    for (let key of Object.keys(patch)) {
      const val = patch[key]
      // console.log('patching with selector', key, val)
      let elem = document.querySelector(key)
      // console.log('... old content = ', elem.innerHTML)
      // use emerj to make this smoother
      elem.innerHTML = val
    }
  })
}

const rs = document.readyState
if (rs.match(/complete|interactive/)) {
  livePatch()
} else {
  document.addEventListener('DOMContentLoaded', livePatch)
  console.log('quilt running, waiting for DOM', document.readyState)
}

// or try https://bitbucket.org/darkkenergy/dom-is-ready/src/a912452e104de185851ce16ecb8aa05f0a8a65c4/src/dom-is-ready.js?at=master&fileviewer=file-view-default
// https://www.npmjs.com/package/dom-is-ready
