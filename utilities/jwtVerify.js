const jwt = require('jsonwebtoken');
const errorMessage = require('./errorMessage');


module.exports = async (req, res, next) => {
    try {
        const header = req.headers.authorization
        if (!header) {
            return errorMessage(res, 401, 'Unauthorized access 9')
        }
        const token = header.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRETE);
        if (!decoded) {
            return errorMessage(res, 401, 'Unauthorized access 14', error)
        }
        req.user = decoded

        next()
    } catch (error) {
        errorMessage(res, 401, 'Unauthorized access 19', error)
    }
}