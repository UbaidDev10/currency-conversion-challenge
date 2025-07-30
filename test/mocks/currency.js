// Mock currency conversion for tests
const mockConversionRates = {
    '2000-01-01': 6.8, // Historical rate for 2000
    '2001-01-01': 6.75, // Historical rate for 2001
    '2009-01-01': 6.72, // Historical rate for 2009
    '2024-01-01': 6.85 // Current rate for 2024
}

module.exports = {
    convertUsdToTtd: async function (usdAmount, date) {
        // Use date-specific rate or fallback to 6.8
        const rate = mockConversionRates[date] || 6.8
        return usdAmount * rate
    }
}
