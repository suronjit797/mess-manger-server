module.exports = (mess) => {
    const error = {}

    if (!mess.mess_name) {
        error.mess_name = 'Please Provide your mess name'
    }
    if(!mess.mess_month) {
        error.mess_month = 'Please select your mess month'
    }
    return{
        error,
        isValid: Object.keys(error).length === 0
    }
}
