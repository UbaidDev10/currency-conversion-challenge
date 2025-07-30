const https = require('https')
const config = require('../../config')
const Response = require('./response')

const CURRENCY_API_BASE_URL = 'https://v6.exchangerate-api.com/v6'

function makeApiRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = ''
            res.on('data', (chunk) => {
                data += chunk
            })
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data))
                } catch (error) {
                    reject(Response.error('Invalid API response'))
                }
            })
        }).on('error', (error) => {
            reject(Response.error('API request failed'))
        })
    })
}

async function convertUsdToTtd(usdAmount, date) {
    const apiKey = config.currency.apiKey

    if (!apiKey) {
        return Response.error(
            'Currency API key not configured. Please set CURRENCY_API_KEY environment variable.'
        )
    }
    const url = `${CURRENCY_API_BASE_URL}/${apiKey}/pair/USD/TTD`
    try {
        const response = await makeApiRequest(url)
        const ttdRate = response.conversion_rate

        if (!ttdRate) {
            return Response.error('TTD rate not available')
        }
        return usdAmount * ttdRate
    } catch (error) {
        return Response.error('Currency conversion failed')
    }
}

module.exports = {
    convertUsdToTtd,
    makeApiRequest
}
