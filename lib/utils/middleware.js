const healthpoint = require('healthpoint')
const bodyParser = require('body-parser')
const pinoLogger = require('express-pino-logger')
const cors = require('cors')
const { version } = require('../../package.json')

function createLogger () {
  return pinoLogger({
    level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    redact: [
      'res.headers["set-cookie"]',
      'req.headers.cookie',
      'req.headers.authorization'
    ]
  })
}

function createHealthCheck (db) {
  const hp = healthpoint({ version }, db.healthCheck)
  return (req, res, next) => {
    req.url === '/health' ? hp(req, res) : next()
  }
}

function createBodyParser () {
  return bodyParser.json({ limit: '5mb' })
}

function createCors () {
  return cors()
}

module.exports = {
  createLogger,
  createHealthCheck,
  createBodyParser,
  createCors
}
