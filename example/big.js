/*

  Not working -- doesn't seem to show these as changes?
      Oh -- idsplit doesn't handle things above any id
      (and there's no id for some of this, since the
      ids are on h's not sections)

  Also get-version
  And keep more versions, for testing.

*/
const quilt = require('..')
const delay = require('delay')
const fs = require('fs')

const text = fs.readFileSync(__dirname + '/bigfile.html', 'utf8')

async function main () {
  await quilt.appmgr.start()
  console.log('visit', quilt.appmgr.siteurl + '/demo')
  for (let x = 0; x < 100; x++) {
    const toggle = (x % 2 === 0)
    let myText = text
    if (toggle) {
      // myText = myText.replace(/ W3C /g, '<b style="color:blue;">W3C</b>')
    }
    myText = myText.replace(/random/, `RANDOM (${x})`)
    quilt.doc('demo', myText)
    await delay(1000)
  }
}

main()

