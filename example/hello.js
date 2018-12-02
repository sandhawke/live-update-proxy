const quilt = require('..')
const delay = require('delay')

async function main () {
  for (let x = 0; x < 1000; x++) {
    quilt.doc('hello', `<html>
<head>
  <title>Hi</title>
</head>
<body>
<p id="p1">This is Hello World</p>
<p id="p2">Counter = ${x}</p>
</body></html>`)
    await delay(100)
  }
}

main()
