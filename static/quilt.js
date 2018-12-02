function livePatch () {
  // alert('injected! ' + document.location)
  
  let events = new EventSource('/__patches?since=' +
                               window.quiltDocumentVersion +
                               '&name=' +
                               window.quildDocumentName
                              )
  events.addEventListener('dompatch', e => {
    // const version = e.data.newVersion
    console.log('got dompatch event', e)
    const domPatch = e.data
    const selectors = domPatch.selectors
    let elem = document.querySelectors(selectors)
    // use emerj to make this smoother
    elem.innertHTML = domPatch.html
  })
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM fully loaded and parsed');
  livePatch()
});
