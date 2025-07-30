const express = require('express')
const mw = require('./mw')

const app = express()
const endpoints = require('./endpoint')

app.use(mw.cors)
app.use(mw.logger)
app.use(mw.bodyParser)
app.use(mw.health)

app.use('/api', endpoints)

app.options('*', mw.cors)

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, _req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
})

module.exports = app
