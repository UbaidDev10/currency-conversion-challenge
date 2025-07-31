const mysql = require('mysql2')
const sqlite3 = require('sqlite3').verbose()
const config = require('../../config')

const engines = {
  undefined: 'sqlite3',
  test: 'sqlite3',
  development: 'mysql',
  production: 'mysql'
}

function createDbConnection () {
  const engineType = engines[process.env.NODE_ENV]

  if (engineType === 'sqlite3') {
    const db = new sqlite3.Database(':memory:')

    // Ensure SQLite3 is ready before returning
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        resolve(db)
      })
    })
  } else {
    const connection = mysql.createConnection(config.mysql)
    connection.connect(function (err) {
      if (err) throw err
    })
    return Promise.resolve(connection)
  }
}

function queryAsync (db, query, values) {
  return new Promise((resolve, reject) => {
    if (engines[process.env.NODE_ENV] === 'mysql') {
      db.query(query, values, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    } else {
      // For SQLite3, handle different query types
      const queryUpper = query.trim().toUpperCase()

      if (queryUpper.startsWith('SELECT')) {
        db.all(query, values, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      } else if (queryUpper.startsWith('INSERT')) {
        db.run(query, values, function (err) {
          if (err) reject(err)
          else resolve({ affectedRows: this.changes, insertId: this.lastID })
        })
      } else if (queryUpper.startsWith('UPDATE') || queryUpper.startsWith('DELETE')) {
        db.run(query, values, function (err) {
          if (err) reject(err)
          else resolve({ affectedRows: this.changes })
        })
      } else {
        // For CREATE, DROP, etc.
        db.run(query, values, function (err) {
          if (err) reject(err)
          else resolve({ affectedRows: this.changes })
        })
      }
    }
  })
}

function healthCheck (db, cb) {
  if (engines[process.env.NODE_ENV] === 'mysql') {
    return db.query('SELECT 1', cb)
  }
  return db.get('SELECT 1', cb)
}

module.exports = {
  createDbConnection,
  queryAsync,
  healthCheck,
  engines
}
