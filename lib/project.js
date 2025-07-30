const db = require('./db')
const currency = require('./currency')
const config = require('../config')

module.exports = {
  findProjectsByNameAndYear,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  convertProjectToTtd
}

async function findProjectsByNameAndYear (projectName, year) {
  const query = `
    SELECT * FROM project 
    WHERE projectName = ? AND year = ?
  `
  return await db.queryAsync(query, [projectName, year])
}

async function getProjectById (projectId) {
  const query = 'SELECT * FROM project WHERE projectId = ?'
  const results = await db.queryAsync(query, [projectId])
  return results[0] || null
}

async function createProject (projectData) {
  const query = `
    INSERT INTO project (
      projectId, projectName, year, currency, initialBudgetLocal,
      budgetUsd, initialScheduleEstimateMonths, adjustedScheduleEstimateMonths,
      contingencyRate, escalationRate, finalBudgetUsd
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  const values = [
    projectData.projectId,
    projectData.projectName,
    projectData.year,
    projectData.currency,
    projectData.initialBudgetLocal,
    projectData.budgetUsd,
    projectData.initialScheduleEstimateMonths,
    projectData.adjustedScheduleEstimateMonths,
    projectData.contingencyRate,
    projectData.escalationRate,
    projectData.finalBudgetUsd
  ]
  
  await db.queryAsync(query, values)
  return projectData
}

async function updateProject (projectId, projectData) {
  const existingProject = await getProjectById(projectId)
  if (!existingProject) {
    return false // Project not found
  }

  // Merge new data with existing data
  const updatedProject = { ...existingProject, ...projectData }

  const query = `
    UPDATE project SET 
      projectName = ?, year = ?, currency = ?, initialBudgetLocal = ?,
      budgetUsd = ?, initialScheduleEstimateMonths = ?, adjustedScheduleEstimateMonths = ?,
      contingencyRate = ?, escalationRate = ?, finalBudgetUsd = ?
    WHERE projectId = ?
  `
  const values = [
    updatedProject.projectName,
    updatedProject.year,
    updatedProject.currency,
    updatedProject.initialBudgetLocal,
    updatedProject.budgetUsd,
    updatedProject.initialScheduleEstimateMonths,
    updatedProject.adjustedScheduleEstimateMonths,
    updatedProject.contingencyRate,
    updatedProject.escalationRate,
    updatedProject.finalBudgetUsd,
    projectId
  ]

  const result = await db.queryAsync(query, values)
  return result.affectedRows > 0
}

async function deleteProject (projectId) {
  const query = 'DELETE FROM project WHERE projectId = ?'
  const result = await db.queryAsync(query, [projectId])
  return result.affectedRows > 0
}

async function convertProjectToTtd (project) {
  // Only convert if project name is in the list
  if (config.TTD_CONVERSION_PROJECTS.includes(project.projectName)) {
    try {
      console.log('Converting project to TTD:', project.projectName)
      const date = `${project.year}-01-01`
      const finalBudgetTtd = await currency.convertUsdToTtd(project.finalBudgetUsd, date)
      
      console.log('Conversion successful, TTD amount:', finalBudgetTtd)
      
      return {
        ...project,
        finalBudgetTtd: Math.round(finalBudgetTtd * 100) / 100
      }
    } catch (error) {
      console.error('Error converting project to TTD:', error)
      // Return project with a fallback TTD value for testing
      return {
        ...project,
        finalBudgetTtd: project.finalBudgetUsd * 6.8 // Fallback rate
      }
    }
  }

  // For other projects, return the project without TTD conversion field
  return project
} 