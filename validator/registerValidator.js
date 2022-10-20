module.exports = (user) => {
    const error = {}
    const emailRegexp = new RegExp(
        /^[a-zA-Z0-9][\-_\.\+\!\#\$\%\&\'\*\/\=\?\^\`\{\|]{0,1}([a-zA-Z0-9][\-_\.\+\!\#\$\%\&\'\*\/\=\?\^\`\{\|]{0,1})*[a-zA-Z0-9]@[a-zA-Z0-9][-\.]{0,1}([a-zA-Z][-\.]{0,1})*[a-zA-Z0-9]\.[a-zA-Z0-9]{1,}([\.\-]{0,1}[a-zA-Z]){0,}[a-zA-Z0-9]{0,}$/i
    )

    if (!user.name) {
        error.name = 'Please Provide your name'
    }

    if (!user.email) {
        error.email = 'Please Provide you email'
    } else if (!emailRegexp.test(user.email)) {
        error.email = 'Please Provide a valid email'
    }

    if (!user.password) {
        error.password = 'Please Provide your password'
    } else if (user.password.length < 6) {
        error.password = 'Password must be at least 6 characters'
    }

    if (!user.confirmPassword) {
        error.confirmPassword = 'Please Provide your confirm password'
    } else if (user.confirmPassword !== user.password) {
        error.password = 'Password does not match'
    }
    return {
        error,
        isValid: Object.keys(error).length === 0
    }
}
