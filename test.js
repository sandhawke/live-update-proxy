const quilt = require('.')
const delay = require('delay')

async function main () {
  for (const x = 0; x < 100; x++) {
    quilt.doc('hello', `<html>
<head>
  <title>Hi</title>
</head>
<body>
<p id="p1">This is Hello World</p>
<p id="p2">Counter = ${x}</p>
</body></html>`)
  }
  await delay(1000)
}

main()
