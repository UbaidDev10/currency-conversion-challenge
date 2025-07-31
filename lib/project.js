const db = require('./db')
const projectUtils = require('./utils/project')

module.exports = {
  findProjectsByNameAndYear,
  findProjectsByName,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  convertProjectToTtd: projectUtils.convertProjectToTtd,
  convertProjectToCurrency: projectUtils.convertProjectToCurrency
}

async function findProjectsByNameAndYear (projectName, year) {
  const query = `
    SELECT * FROM project 
    WHERE projectName = ? AND year = ?
  `
  return await db.queryAsync(query, [projectName, year])
}

async function findProjectsByName (projectName) {
  const query = `
    SELECT * FROM project 
    WHERE projectName = ?
  `
  return await db.queryAsync(query, [projectName])
}

async function getProjectById (projectId) {
  const query = 'SELECT * FROM project WHERE projectId = ?'
  const results = await db.queryAsync(query, [projectId])
  return results[0] || null
}

async function createProject (projectData) {
  if (!projectUtils.validateProjectData(projectData)) {
    throw new Error('Invalid project data')
  }

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
  if (!projectUtils.validateProjectData(projectData, true)) {
    throw new Error('Invalid project data for update')
  }

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
