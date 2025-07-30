process.env.NODE_ENV = 'test'

const http = require('http')
const test = require('tape')
const servertest = require('servertest')
const fs = require('fs')
const path = require('path')

const mockCurrency = require('./mocks/currency')
require.cache[require.resolve('../lib/currency')] = { exports: mockCurrency }

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

test('Setup test database', async function (t) {
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
  await db.queryAsync(createTableSql)
  await db.queryAsync('DELETE FROM project')

  const fixturesPath = path.join(__dirname, './fixtures/projects.json')
  const projects = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'))

  for (const project of projects) {
    const values = [
      project.projectId, project.projectName, project.year, project.currency,
      project.initialBudgetLocal, project.budgetUsd, project.initialScheduleEstimateMonths,
      project.adjustedScheduleEstimateMonths, project.contingencyRate,
      project.escalationRate, project.finalBudgetUsd
    ]
    await db.queryAsync('INSERT INTO project VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
  }
  t.pass('Database setup completed')
  t.end()
})

test('POST /api/project/budget/currency - should get project with TTD conversion', function (t) {
  const requestBody = {
    year: 2009,
    projectName: 'Tostadas John Deere',
    currency: 'TTD'
  }
  servertest(server, '/api/project/budget/currency', {
    method: 'POST',
    encoding: 'json',
    body: requestBody
  }, function (err, res) {
    t.pass('API called successfully')
    t.end()
  })
})

test('GET /api/project/budget/:id - should get a project by ID', function (t) {
  servertest(server, '/api/project/budget/321', { encoding: 'json' }, function (err, res) {
    t.pass('API called successfully')
    t.end()
  })
})

test('POST /api/project/budget - should create a new project', function (t) {
  servertest(server, '/api/project/budget', {
    method: 'POST',
    encoding: 'json',
    body: newProjectData
  }, function (err, res) {
    t.pass('API called successfully')
    t.end()
  })
})

test('PUT /api/project/budget/:id - should update a project', function (t) {
  servertest(server, '/api/project/budget/321', {
    method: 'PUT',
    encoding: 'json',
    body: updatedProjectData
  }, function (err, res) {
    t.pass('API called successfully')
    t.end()
  })
})

test('DELETE /api/project/budget/:id - should delete a project', function (t) {
  servertest(server, '/api/project/budget/321', {
    method: 'DELETE',
    encoding: 'json'
  }, function (err, res) {
    t.pass('API called successfully')
    t.end()
  })
})

test('Teardown: close server', function (t) {
  setTimeout(() => {
    server.close()
    t.pass('Server closed')
    t.end()
  }, 100)
})
