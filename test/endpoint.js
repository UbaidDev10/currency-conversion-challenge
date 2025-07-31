// Set NODE_ENV BEFORE any requires
process.env.NODE_ENV = 'test'

const http = require('http')
const test = require('tape')
const servertest = require('servertest')
const fs = require('fs')
const path = require('path')

const mockCurrency = require('./mocks/currency')
require.cache[require.resolve('../lib/currency')] = { exports: mockCurrency }

// Now require app and db after NODE_ENV is set
const app = require('../lib/app')
const db = require('../lib/db')

const server = http.createServer(app)

const newProjectData = {
  projectId: 10002,
  projectName: 'New Test Project',
  year: 2024,
  currency: 'USD',
  initialBudgetLocal: 100000,
  budgetUsd: 100000,
  initialScheduleEstimateMonths: 6,
  adjustedScheduleEstimateMonths: 6,
  contingencyRate: 5,
  escalationRate: 2,
  finalBudgetUsd: 107000
}

const updatedProjectData = {
  projectName: 'Updated Project Name',
  year: 2025
}

// Verify database connection
function verifyConnection () {
  return new Promise((resolve, reject) => {
    db.healthCheck((err) => {
      if (err) {
        reject(new Error('Database connection failed: ' + err.message))
      } else {
        resolve()
      }
    })
  })
}

// Remove the createTestOptions function entirely

// Database setup function
async function setupDatabase () {
  // First verify connection
  await verifyConnection()

  // For SQLite3, we need to ensure the database is ready
  // Add a small delay to ensure SQLite3 is properly initialized
  await new Promise(resolve => setTimeout(resolve, 100))

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS project (
      projectId INTEGER PRIMARY KEY,
      projectName TEXT,
      year INTEGER,
      currency TEXT,
      initialBudgetLocal REAL,
      budgetUsd REAL,
      initialScheduleEstimateMonths INTEGER,
      adjustedScheduleEstimateMonths INTEGER,
      contingencyRate REAL,
      escalationRate REAL,
      finalBudgetUsd REAL
    )
  `

  // Execute table creation
  await db.queryAsync(createTableSql)

  // Clear existing data
  await db.queryAsync('DELETE FROM project')

  const fixturesPath = path.join(__dirname, './fixtures/projects.json')
  const projects = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'))

  console.log(`Inserting ${projects.length} projects into database`)

  for (const project of projects) {
    const values = [
      project.projectId, project.projectName, project.year, project.currency,
      project.initialBudgetLocal, project.budgetUsd, project.initialScheduleEstimateMonths,
      project.adjustedScheduleEstimateMonths, project.contingencyRate,
      project.escalationRate, project.finalBudgetUsd
    ]
    await db.queryAsync('INSERT INTO project VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
    console.log(`Inserted project: ${project.projectName} (${project.projectId})`)
  }

  return true
}

// Initialize database before running tests
setupDatabase().then(() => {
  // Start running tests after database is ready
  test('Database Connection and Setup', function (t) {
    t.pass('Database setup completed')
    t.end()
  })

  test('POST /api/project/budget/currency - should get project with TTD conversion', function (t) {
    const requestBody = {
      year: 2009,
      projectName: 'Tostadas John Deere',
      currency: 'TTD'
    }

    const data = JSON.stringify(requestBody)

    servertest(server, '/api/project/budget/currency', {
      method: 'POST',
      encoding: 'json',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, function (err, res) {
      t.error(err, 'No error')
      t.equal(res.statusCode, 200, 'Should return 200')
      t.ok(res.body, 'Should return a body')
      t.end()
    }).end(data)
  })

  test('GET /api/project/budget/:id - should get a project by ID', function (t) {
    servertest(server, '/api/project/budget/324', {
      encoding: 'json'
    }, function (err, res) {
      t.error(err, 'No error')
      t.equal(res.statusCode, 200, 'Should return 200')
      t.ok(res.body, 'Should return a body')
      t.end()
    })
  })

  test('POST /api/project/budget - should create a new project', function (t) {
    servertest(server, '/api/project/budget', {
      method: 'POST',
      encoding: 'json',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(newProjectData))
      }
    }, function (err, res) {
      t.error(err, 'No error')
      t.equal(res.statusCode, 200, 'Should return 200')
      t.ok(res.body, 'Should return a body')
      t.end()
    }).end(JSON.stringify(newProjectData))
  })

  test('PUT /api/project/budget/:id - should update a project', function (t) {
    servertest(server, '/api/project/budget/321', {
      method: 'PUT',
      encoding: 'json',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(updatedProjectData))
      }
    }, function (err, res) {
      t.error(err, 'No error')
      t.equal(res.statusCode, 200, 'Should return 200')
      t.ok(res.body, 'Should return a body')
      t.end()
    }).end(JSON.stringify(updatedProjectData))
  })

  test('DELETE /api/project/budget/:id - should delete a project', function (t) {
    servertest(server, '/api/project/budget/324', {
      method: 'DELETE'
    }, function (err, res) {
      t.error(err, 'No error')
      t.equal(res.statusCode, 200, 'Should return 200')
      t.ok(res.body, 'Should return a body')
      t.end()
    })
  })
}).catch((error) => {
  console.error('Failed to setup database:', error)
  process.exit(1)
})
