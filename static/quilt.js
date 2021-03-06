// part of the quilt-server npm package

// use browserify to build this, soon.


let running = false

function livePatch () {
  if (running) return
  running = true
  console.log('livePatch Running')

  let events = new window.EventSource(
    '/__patches?url=' + encodeURIComponent(document.location.href)
  )

  let text = ''
  
  events.addEventListener('jpatch', e => {
    // console.log('got jpatch event', e)
    const patch = JSON.parse(e.data)
    // console.log('jpatch: ', patch.jpatch)

    text = jpatch_apply(patch.jpatch, text)
    // console.log('text now', text)
    emerj.merge(document.documentElement, text)
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


// this is from node_modules/emerj/dist/index.js
//
// readable at https://github.com/bryhoyt/emerj/blob/master/src/emerj.js
//
const emerj = {attrs:function(e){for(var t={},n=0;n<e.attributes.length;n++){var i=e.attributes[n];t[i.name]=i.value}return t},nodesByKey:function(e,t){for(var n={},i=0;i<e.childNodes.length;i++){var r=t(e.childNodes[i]);r&&(n[r]=e.childNodes[i])}return n},merge:function(e,t,n){if((n=n||{}).key=n.key||function(e){return e.id},"string"==typeof t){var i=t;(t=document.createElement(e.tagName)).innerHTML=i}var r,o={old:this.nodesByKey(e,n.key),new:this.nodesByKey(t,n.key)};for(r=0;t.firstChild;r++){var d=t.removeChild(t.firstChild);if(r>=e.childNodes.length)e.appendChild(d);else{var a=e.childNodes[r],s=n.key(d);if(n.key(a)||s){var l=s&&s in o.old?o.old[s]:d;l!==a&&(a=e.insertBefore(l,a))}if(a.nodeType!==d.nodeType||a.tagName!==d.tagName)e.replaceChild(d,a);else if([Node.TEXT_NODE,Node.COMMENT_NODE].indexOf(a.nodeType)>=0){if(a.textContent===d.textContent)continue;a.textContent=d.textContent}else if(a!==d){var f={base:this.attrs(a),new:this.attrs(d)};for(var h in f.base)h in f.new||a.removeAttribute(h);for(var v in f.new)v in f.base&&f.base[v]===f.new[v]||a.setAttribute(v,f.new[v]);this.merge(a,d)}}}for(;e.childNodes.length>r;)e.removeChild(e.lastChild)}}




function jpatch_apply (jpatch, str) {
  const f = (entry) => {
    if (Array.isArray(entry)) {
      // console.log('entry %j %j', entry, str.slice(...entry))
      return str.slice(...entry)
    } else {
      // console.log('entry %j', entry, '(String)')
      return entry
    }
  }
  // console.log('APPLY  %j %j', jpatch, str)
  // console.log('PREJOIN', jpatch.map(f))
  return jpatch.map(f).join('')
}
