require('dotenv').config()

// Projects that should be converted to TTD
const TTD_CONVERSION_PROJECTS = [
  'Peking roasted duck Chanel',
  'Choucroute Cartier',
  'Rigua Nintendo',
  'Llapingacho Instagram'
]

// Required fields for project data
const REQUIRED_PROJECT_FIELDS = [
  'projectName',
  'year',
  'currency',
  'initialBudgetLocal',
  'budgetUsd',
  'initialScheduleEstimateMonths',
  'adjustedScheduleEstimateMonths',
  'contingencyRate',
  'escalationRate',
  'finalBudgetUsd'
]

module.exports = {
  server: {
    port: process.env.PORT || 1337
  },
  mysql: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'budget'
  },
  currency: {
    apiKey: process.env.CURRENCY_API_KEY
  },
  TTD_CONVERSION_PROJECTS,
  REQUIRED_PROJECT_FIELDS
}
