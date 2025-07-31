function fixResponseData (data) {
  // Handle both single objects and arrays
  if (!Array.isArray(data)) {
    // If it's a single object, wrap it in an array, process it, and return the first item
    const processed = fixResponseData([data])
    return processed[0]
  }

  // Convert all floating point numbers to have at most 2 decimal places
  return data.map(item => {
    const result = { ...item }
    for (const key in result) {
      if (typeof result[key] === 'string' && !isNaN(result[key]) && result[key].includes('.')) {
        const num = Number(result[key])
        if (!Number.isNaN(num)) {
          result[key] = num
        }
      }
    }
    return result
  })
}

module.exports = fixResponseData
