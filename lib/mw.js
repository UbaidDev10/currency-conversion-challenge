const db = require('./db')
const middlewareUtils = require('./utils/middleware')

module.exports = {
  cors: middlewareUtils.createCors(),
  health: middlewareUtils.createHealthCheck(db),
  logger: middlewareUtils.createLogger(),
  bodyParser: middlewareUtils.createBodyParser()
}
