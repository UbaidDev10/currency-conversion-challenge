const fs = require('fs')
const dbUtils = require('../lib/utils/db')

const stream = fs.createReadStream('./data/projects.csv')

const createTableSql = `
  CREATE TABLE IF NOT EXISTS project (
    projectId INT PRIMARY KEY,
    projectName VARCHAR(255),
    year INT,
    currency VARCHAR(3),
    initialBudgetLocal DECIMAL(10, 2),
    budgetUsd DECIMAL(10, 2),
    initialScheduleEstimateMonths INT,
    adjustedScheduleEstimateMonths INT,
    contingencyRate DECIMAL(5, 2),
    escalationRate DECIMAL(5, 2),
    finalBudgetUsd DECIMAL(10, 2)
  )
`

async function seedDatabase () {
  try {
    // Create database connection
    const db = await dbUtils.createDbConnection()

    // Create table
    await dbUtils.queryAsync(db, createTableSql)
    console.log('Table created successfully')

    // Clear existing data to avoid duplicates
    await dbUtils.queryAsync(db, 'DELETE FROM project')
    console.log('Cleared existing data')

    let data = ''

    return new Promise((resolve, reject) => {
      stream.on('data', chunk => {
        data += chunk.toString()

        const lines = data.split('\n')
        data = lines.pop()

        lines.forEach(async (line, index) => {
          if (index === 0) return // Skip header

          const values = line.split(',')
          const parsedValues = values.map(value => {
            if (value === 'NULL') return null
            if (!isNaN(value)) return parseFloat(value)
            return `"${value}"`
          })

          const insertSql = `INSERT INTO project values (${parsedValues.join(',')})`

          try {
            await dbUtils.queryAsync(db, insertSql)
            console.log('Inserted Project ID:', values[0])
          } catch (err) {
            console.error('Error inserting Project ID:', values[0], err)
            reject(err)
          }
        })
      })

      stream.on('end', async () => {
        try {
          if (db.end) {
            await new Promise((resolve, reject) => {
              db.end(err => {
                if (err) reject(err)
                else resolve()
              })
            })
          }
          console.log('Database connection closed')
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seeding
seedDatabase().catch(error => {
  console.error('Failed to seed database:', error)
  process.exit(1)
})
