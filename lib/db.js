const mysql = require('mysql2')
const sqlite3 = require('sqlite3').verbose()
const config = require('../config')

const engines = {
  undefined: 'sqlite3',
  test: 'sqlite3',
  development: 'mysql',
  production: 'mysql'
}

const engine = {
  sqlite3: new sqlite3.Database(':memory:'),
  mysql: mysql.createConnection(config.mysql)
}[engines[process.env.NODE_ENV]]

const db = module.exports = engine

if (engines[process.env.NODE_ENV] === 'mysql') {
  db.connect(function (err) {
    if (err) throw err
    console.log('connected to the database')
  })
}

db.healthCheck = function (cb) {
  if (engines[process.env.NODE_ENV] === 'mysql') {
    return db.query('SELECT 1', cb)
  }
  return db.get('SELECT 1', cb)
}

// Promisify database operations for both MySQL and SQLite
db.queryAsync = function (query, values) {
  return new Promise((resolve, reject) => {
    if (engines[process.env.NODE_ENV] === 'mysql') {
      db.query(query, values, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    } else {
      // For SQLite
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        db.all(query, values, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      } else {
        // For INSERT, UPDATE, DELETE
        db.run(query, values, function (err) {
          if (err) reject(err)
          else resolve({ affectedRows: this.changes, insertId: this.lastID })
        })
      }
    }
  })
}

function executeQuery (query, values, cb) {
  if (engines[process.env.NODE_ENV] === 'mysql') {
    return db.query(query, values, function (err, data) {
      if (err) return cb(err)
      cb(null, data)
    })
  }

  // For SQLite
  db.serialize(function () {
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      db.all(query, values, function (err, rows) {
        if (err) return cb(err)
        cb(null, rows)
      })
    } else {
      // For INSERT, UPDATE, DELETE
      db.run(query, values, function (err) {
        if (err) return cb(err)
        cb(null, { affectedRows: this.changes, insertId: this.lastID })
      })
    }
  })
}
