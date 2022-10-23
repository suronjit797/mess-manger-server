const User = require('../schema/userSchema');
const registerValidator = require('../validator/registerValidator')
const loginValidator = require('../validator/loginValidator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const errorMessage = require('../utilities/errorMessage')


// register
module.exports.register = async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body

    // check validate
    const validate = registerValidator(req.body)
    if (!validate.isValid) {
        return errorMessage(res, 400, validate.error)
    }

    // check duplicate user
    const isUser = await User.findOne({ email })
    if (isUser) {
        return errorMessage(res, 500, 'User already exists')
    }

    // hash password
    bcrypt.hash(password, 9, async (err, hash) => {
        if (err) {
            return errorMessage(res, 500, 'Internal server error occurred', err)
        }
        try {
            // create instance
            const user = new User({
                name,
                email,
                password: hash,
                picture: '',
                balance: 0,
                meal: 0,
                solo: 0,
                post: 'member',
                mess_id: '',
                active_month: ''
            })
            const result = await user.save()

            console.log(result)

            if (result) {
                // create token
                const token = jwt.sign({
                    id: user._id,
                    name: result.name,
                    email: result.email,
                }, process.env.JWT_SECRETE)

                return res.status(200).send({
                    status: true,
                    message: 'User create successfully',
                    token: `Bearer ${token}`,
                })
            } else {
                return errorMessage(res, 500, 'User Create Failed');
            }
        } catch (err) {
            return errorMessage(res, 500, 'Internal server error occurred')
        }
    });
}

// login
module.exports.login = async (req, res, next) => {
    const { email, password } = req.body

    // check validate
    const validate = loginValidator({ email, password })
    if (!validate.isValid) {
        return errorMessage(res, 400, validate.error)
    }

    try {
        // check  user existence
        const user = await User.findOne({ email })
        if (!user) {
            return errorMessage(res, 400, "User and password doesn't match")
        }

        const hash = user.password
        bcrypt.compare(password, hash, function (err, result) {
            if (err) {
                return errorMessage(res, 500, 'Internal server error occurred', err)
            }
            if (!result) {
                return errorMessage(res, 400, { password: "User and password doesn't match" })
            }
            // create token
            const token = jwt.sign({
                id: user._id,
                name: user.name,
                email: user.email,
            },
                process.env.JWT_SECRETE,
                // { expiresIn: '1d' }
            )
            return res.status(200).send({
                status: true,
                message: 'Login successfully',
                token: `Bearer ${token}`,
            })
        });

    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}


// Get all user 
module.exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select("-password")
        if (!users.length) {
            return res.send({
                status: false,
                message: 'No user found',
            })
        }
        res.send({
            status: true,
            message: 'Successfully retrieved',
            users,
        })
    } catch (error) {
        return errorMessage(res, 400, "Server Error occurred", error)
    }

}

// Get a single user  
module.exports.getSingleUsers = async (req, res, next) => {
    try {
        const { id } = req.params
        const users = await User.findById(id, "-password")
        if (!users) {
            return res.send({
                status: false,
                message: 'No user found',
            })
        }
        res.send({
            status: true,
            message: 'Successfully retrieved',
            users,
        })
    } catch (error) {
        return errorMessage(res, 400, "Server Error occurred", error)
    }

}

// Delete all users
module.exports.deleteAllUsers = async (req, res, next) => {
    try {
        const result = await User.deleteMany()
        return res.send(result)
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

 // Get user 
module.exports.getUser = async (req, res, next) => {
    const { email } = req.user
    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.send({
                status: false,
                message: 'No user found',
            })
        }
        user.password = ''
        res.send({
            status: true,
            message: 'Successfully retrieved',
            user,
        })
    } catch (error) {
        return errorMessage(res, 400, "Server Error occurred", error)
    }

}


