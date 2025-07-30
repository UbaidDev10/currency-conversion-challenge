const express = require('express')
const project = require('./project')
const Response = require('./utils/response')

const endpoints = express.Router()

module.exports = endpoints

endpoints.post('/project/budget/currency', handleBudgetCurrencyRequest)
endpoints.get('/project/budget/:id', handleGetProjectById)
endpoints.post('/project/budget', handleCreateProject)
endpoints.put('/project/budget/:id', handleUpdateProject)
endpoints.delete('/project/budget/:id', handleDeleteProject)
endpoints.get('/ok', (req, res) => {
  Response.send(res, Response.success({ ok: true }))
})

async function handleBudgetCurrencyRequest(req, res) {
  try {
    const { year, projectName, currency } = req.body

    if (!year || !projectName || !currency) {
      return Response.send(res, Response.badRequest('Year, Currency and projectName are required'))
    }

    const projects = await project.findProjectsByNameAndYear(projectName, year)

    if (projects.length === 0) {
      return Response.send(res, Response.notFound('Project not found'))
    }

    let processedProjects = projects

    if (currency === 'TTD') {
      processedProjects = await Promise.all(
        projects.map(p => project.convertProjectToTtd(p))
      )
    }

    Response.send(res, Response.success(processedProjects))
  } catch (error) {
    Response.send(res, Response.error('Internal server error: ' + error.message))
  }
}

async function handleGetProjectById(req, res) {
  try {
    const projectId = parseInt(req.params.id)
    if (isNaN(projectId)) {
      return Response.send(res, Response.badRequest('Invalid project ID'))
    }

    const projectData = await project.getProjectById(projectId)
    if (!projectData) {
      return Response.send(res, Response.notFound('Project not found'))
    }

    Response.send(res, Response.success(projectData))
  } catch (error) {
    Response.send(res, Response.error('Internal server error: ' + error.message))
  }
}

async function handleCreateProject(req, res) {
  try {
    const projectData = req.body
    const createdProject = await project.createProject(projectData)
    Response.send(res, Response.success(createdProject, 201))
  } catch (error) {
    if (error.message === 'Invalid project data') {
      Response.send(res, Response.badRequest(error.message))
    } else {
      Response.send(res, Response.error('Internal server error: ' + error.message))
    }
  }
}

async function handleUpdateProject(req, res) {
  try {
    const projectId = parseInt(req.params.id)
    if (isNaN(projectId)) {
      return Response.send(res, Response.badRequest('Invalid project ID'))
    }

    const projectData = req.body
    const success = await project.updateProject(projectId, projectData)

    if (!success) {
      return Response.send(res, Response.notFound('Project not found'))
    }

    Response.send(res, Response.success({ message: 'Project updated successfully' }))
  } catch (error) {
    if (error.message === 'Invalid project data for update') {
      Response.send(res, Response.badRequest(error.message))
    } else {
      Response.send(res, Response.error('Internal server error: ' + error.message))
    }
  }
}

async function handleDeleteProject(req, res) {
  try {
    const projectId = parseInt(req.params.id)
    if (isNaN(projectId)) {
      return Response.send(res, Response.badRequest('Invalid project ID'))
    }

    const success = await project.deleteProject(projectId)

    if (!success) {
      return Response.send(res, Response.notFound('Project not found'))
    }

    Response.send(res, Response.success({ message: 'Project deleted successfully' }))
  } catch (error) {
    Response.send(res, Response.error('Internal server error: ' + error.message))
  }
}
