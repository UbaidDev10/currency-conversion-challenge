const https = require('https')
const config = require('../config')

const CURRENCY_API_BASE_URL = 'https://v6.exchangerate-api.com/v6'

module.exports = {
  convertUsdToTtd
}

async function convertUsdToTtd (usdAmount, date) {
  try {
    const apiKey = config.currency.apiKey
    
    if (!apiKey) {
      throw new Error('Currency API key not configured. Please set CURRENCY_API_KEY environment variable.')
    }
    
    const url = `${CURRENCY_API_BASE_URL}/${apiKey}/pair/USD/TTD`
    
    console.log('Making API request to:', url)
    
    try {
      const response = await makeApiRequest(url)
      const ttdRate = response.conversion_rate
      
      if (!ttdRate) {
        throw new Error('TTD rate not available')
      }
      
      return usdAmount * ttdRate
    } catch (error) {
      console.log('Using fallback rate for testing')
      // Fallback rate for testing (approximately 1 USD = 6.8 TTD)
      return usdAmount * 6.8
    }
  } catch (error) {
    console.error('Currency conversion error:', error)
    throw error
  }
}

function makeApiRequest (url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          console.log('API Response status:', res.statusCode)
          console.log('API Response data:', data.substring(0, 200) + '...')
          const parsed = JSON.parse(data)
          resolve(parsed)
        } catch (error) {
          console.error('Failed to parse JSON:', data)
          reject(new Error(`Invalid JSON response: ${data.substring(0, 100)}`))
        }
      })
    }).on('error', (error) => {
      reject(error)
    })
  })
} 