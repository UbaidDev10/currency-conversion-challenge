class Response {
  static success (data, status = 200) {
    return {
      statusCode: status,
      body: {
        success: true,
        data
      }

    }
  }

  static error (message, status = 500, details = null) {
    const response = {
      statusCode: status,
      body: {
        success: false,
        error: message
      }
    }

    if (details) {
      response.body.details = details
    }

    return response
  }

  static notFound (message = 'Resource not found') {
    return this.error(message, 404)
  }

  static badRequest (message = 'Invalid request', details = null) {
    return this.error(message, 400, details)
  }

  static unauthorized (message = 'Unauthorized') {
    return this.error(message, 401)
  }

  static send (res, response) {
    res.status(response.statusCode).json(response.body)
  }
}

module.exports = Response
