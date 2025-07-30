const dbUtils = require('./utils/db')

// Create database connection
const db = module.exports = dbUtils.createDbConnection()

// Add utility functions to db object
db.queryAsync = (query, values) => dbUtils.queryAsync(db, query, values)
db.healthCheck = (cb) => dbUtils.healthCheck(db, cb)
