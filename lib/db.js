const dbUtils = require('./utils/db')

// Create database connection
let dbConnection = null

// Initialize the database connection
async function initializeDb () {
  if (!dbConnection) {
    dbConnection = await dbUtils.createDbConnection()
  }
  return dbConnection
}

// Create a db object that wraps the connection
module.exports = {
  queryAsync: async (query, values) => {
    const connection = await initializeDb()
    return dbUtils.queryAsync(connection, query, values)
  },
  healthCheck: async (cb) => {
    const connection = await initializeDb()
    return dbUtils.healthCheck(connection, cb)
  }
}
