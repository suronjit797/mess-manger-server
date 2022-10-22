module.exports = (info) => {
    const error = {}
    console.log({info})

    if (!info.email) {
        error.mess_name = 'Please Provide you email'
    }
    if (!info.mealCost) {
        error.mealCost = 'Please Provide your meal cost'
    }
    return {
        error,
        isValid: Object.keys(error).length === 0
    }
}
