const mysql = require('mysql2')
const sqlite3 = require('sqlite3').verbose()
const config = require('../../config')

const engines = {
    undefined: 'sqlite3',
    test: 'sqlite3',
    development: 'mysql',
    production: 'mysql'
}

function createDbConnection() {
    const engine = {
        sqlite3: new sqlite3.Database(':memory:'),
        mysql: mysql.createConnection(config.mysql)
    }[engines[process.env.NODE_ENV]]

    if (engines[process.env.NODE_ENV] === 'mysql') {
        engine.connect(function (err) {
            if (err) throw err
        })
    }
    return engine
}

function queryAsync(db, query, values) {
    return new Promise((resolve, reject) => {
        if (engines[process.env.NODE_ENV] === 'mysql') {
            db.query(query, values, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        } else {
            if (query.trim().toUpperCase().startsWith('SELECT')) {
                db.all(query, values, (err, rows) => {
                    if (err) reject(err)
                    else resolve(rows)
                })
            } else {
                db.run(query, values, function (err) {
                    if (err) reject(err)
                    else resolve({ affectedRows: this.changes, insertId: this.lastID })
                })
            }
        }
    })
}

function healthCheck(db, cb) {
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
