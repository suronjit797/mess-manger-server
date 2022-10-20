module.exports = (user) => {
    const error = {}

    if (!user.email) {
        error.email = 'Please Provide you email'
    }
    if(!user.password) {
        error.password = 'Please Provide your password'
    }
    return{
        error,
        isValid: Object.keys(error).length === 0
    }
}
