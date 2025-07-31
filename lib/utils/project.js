const config = require('../../config')
const currencyUtils = require('./currency')
const Response = require('./response')

function validateProjectData (data, isUpdate = false) {
  if (!isUpdate) {
    if (!data.projectId) return false
    return config.REQUIRED_PROJECT_FIELDS.every(field => data[field] !== undefined)
  }

  return config.REQUIRED_PROJECT_FIELDS.some(field => data[field] !== undefined)
}

async function convertProjectToTtd (project) {
  if (!config.TTD_CONVERSION_PROJECTS.includes(project.projectName)) {
    return project
  }

  try {
    const date = `${project.year}-01-01`
    const finalBudgetTtd = await currencyUtils.convertUsdToTtd(
      project.finalBudgetUsd,
      date
    )

    return {
      ...project,
      finalBudgetTtd: Math.round(finalBudgetTtd * 100) / 100
    }
  } catch (error) {
    return Response.error('Failed to convert currency to TTD')
  }
}

async function convertProjectToCurrency (project, currency) {
  try {
    const finalBudgetCurrency = await currencyUtils.convertUsdToCurrency(
      project.finalBudgetUsd,
      currency
    )

    return {
      ...project,
      [`finalBudget${currency}`]: Math.round(finalBudgetCurrency * 100) / 100
    }
  } catch (error) {
    return Response.error('Failed to convert currency to TTD')
  }
}

module.exports = {
  validateProjectData,
  convertProjectToTtd,
  convertProjectToCurrency
}
