const path = require('path')
const express = require('express')

const port = process.env.PORT || 8080

const app = express()

app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  res.header('Expires', '-1')
  res.header('Pragma', 'no-cache')
  next()
})

app.use(express.static(path.join(__dirname, 'build')))

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
