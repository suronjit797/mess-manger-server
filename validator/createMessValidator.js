module.exports = (mess) => {
    const error = {}

    if (!mess.mess_name) {
        error.mess_name = 'Please Provide you email'
    }
    if(!mess.mess_month) {
        error.mess_month = 'Please Provide your password'
    }
    return{
        error,
        isValid: Object.keys(error).length === 0
    }
}
