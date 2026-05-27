const express = require('express')
const https   = require('https')
const path    = require('path')

const app  = express()
const PORT = process.env.PORT || 3000

// Serve the public folder
app.use(express.static(path.join(__dirname, 'public')))

/**
 * Proxy the Aladhan Qibla endpoint so the browser never
 * has to deal with CORS on the free API.
 * GET /api/qibla/:lat/:lng
 */
app.get('/api/qibla/:lat/:lng', (req, res) => {
  const { lat, lng } = req.params
  const url = `https://api.aladhan.com/v1/qibla/${lat}/${lng}`

  https.get(url, (apiRes) => {
    let raw = ''
    apiRes.on('data', chunk => (raw += chunk))
    apiRes.on('end', () => {
      res.setHeader('Content-Type', 'application/json')
      res.send(raw)
    })
  }).on('error', err => {
    res.status(500).json({ error: err.message })
  })
})

app.listen(PORT, () => {
  console.log(`\n🕌  Quibla is running → http://localhost:${PORT}\n`)
})
