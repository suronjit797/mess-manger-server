module.exports = (info) => {
    const error = {}

    if (!info.email) {
        error.mess_name = 'Please Provide you email'
    }
    if (!info.meal) {
        error.meal = 'Please Provide your meal'
    }
    return {
        error,
        isValid: Object.keys(error).length === 0
    }
}
