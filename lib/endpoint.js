const express = require('express')
const project = require('./project')

const endpoints = express.Router()

module.exports = endpoints

// POST /api/project/budget/currency - Find budget details with currency conversion
endpoints.post('/project/budget/currency', handleBudgetCurrencyRequest)

// GET /api/project/budget/:id - Get project by ID
endpoints.get('/project/budget/:id', handleGetProjectById)

// POST /api/project/budget - Create new project
endpoints.post('/project/budget', handleCreateProject)

// PUT /api/project/budget/:id - Update project
endpoints.put('/project/budget/:id', handleUpdateProject)

// DELETE /api/project/budget/:id - Delete project
endpoints.delete('/project/budget/:id', handleDeleteProject)

// Legacy endpoint for compatibility
endpoints.get('/ok', (req, res) => {
  res.status(200).json({ ok: true })
})

async function handleBudgetCurrencyRequest (req, res) {
  try {
    const { year, projectName, currency } = req.body 
    if (!year || !projectName || !currency) {
      console.log('Missing required fields')
      return res.status(400).json({
        success: false,
        error: 'Year, Currency and projectName are required'
      })
    }
    const projects = await project.findProjectsByNameAndYear(projectName, year)  
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }
    let processedProjects = projects
    if (currency === 'TTD') {
      processedProjects = await Promise.all(
        projects.map(p => project.convertProjectToTtd(p))
      )
    } else {
      console.log('No currency conversion requested')
    }
    const response = {
      success: true,
      data: processedProjects
    }
    res.json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    })
  }
}

async function handleGetProjectById (req, res) {
  try {
    const projectId = parseInt(req.params.id)
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        error: 'Invalid project ID'
      })
    }
    
    const projectData = await project.getProjectById(projectId)
    
    if (!projectData) {
      return res.status(404).json({
        error: 'Project not found'
      })
    }
    
    res.json(projectData)
  } catch (error) {
    console.error('Error getting project by ID:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
}

async function handleCreateProject (req, res) {
  try {
    const projectData = req.body
    
    if (!validateProjectData(projectData)) {
      return res.status(400).json({
        error: 'Invalid project data'
      })
    }
    
    const createdProject = await project.createProject(projectData)
    
    res.status(201).json(createdProject)
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
}

async function handleUpdateProject (req, res) {
  try {
    const projectId = parseInt(req.params.id)
    const projectData = req.body
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        error: 'Invalid project ID'
      })
    }
    
    if (!validateProjectData(projectData, true)) {
      return res.status(400).json({
        error: 'Invalid project data'
      })
    }
    
    const updated = await project.updateProject(projectId, projectData)
    
    if (!updated) {
      return res.status(404).json({
        error: 'Project not found'
      })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating project:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
}

async function handleDeleteProject (req, res) {
  try {
    const projectId = parseInt(req.params.id)
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        error: 'Invalid project ID'
      })
    }
    
    const deleted = await project.deleteProject(projectId)
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Project not found'
      })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
}

function validateProjectData (data, isUpdate = false) {
  const requiredFields = [
    'projectName', 'year', 'currency', 'initialBudgetLocal', 'budgetUsd',
    'initialScheduleEstimateMonths', 'adjustedScheduleEstimateMonths',
    'contingencyRate', 'escalationRate', 'finalBudgetUsd'
  ]

  if (!isUpdate) {
    // For new projects, all fields are required
    if (!data.projectId) return false
    return requiredFields.every(field => data[field] !== undefined)
  }

  // For updates, at least one field must be present
  return requiredFields.some(field => data[field] !== undefined)
}
