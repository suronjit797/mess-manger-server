module.exports = (info) => {
    const error = {}

    if (!info.email) {
        error.mess_name = 'Please Provide you email'
    }
    if (!info.amount) {
        error.amount = 'Please Provide your amount'
    }
    return {
        error,
        isValid: Object.keys(error).length === 0
    }
}
