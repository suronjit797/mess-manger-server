const Mess = require('../schema/messSchema');
const User = require('../schema/userSchema');
const jwt = require('jsonwebtoken');
const errorMessage = require('../utilities/errorMessage')
const CreateMessValidator = require('../validator/createMessValidator')

// getAllMess
module.exports.getAllMess = async (req, res, next) => {
    try {
        const result = await Mess.find()
        res.send(result)
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// getSingleMess
module.exports.getSingleMess = async (req, res, next) => {
    try {
        const { id } = req.user
        const { mess_id } = await User.findById(id)
        const result = await Mess.findById(mess_id)
        return res.status(200).send({
            status: true,
            message: 'Mess data get successfully',
            mess: result
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// createMess
module.exports.createMess = async (req, res, next) => {
    try {
        const date = new Date()
        const { id } = req.user
        const { mess_name, mess_month } = req.body

        // validate data
        const validate = CreateMessValidator({ mess_name, mess_month })
        if (!validate.isValid) {
            return errorMessage(res, 400, validate.error)
        }
        const member = await User.findById(id, '-password')
        member.post = 'manager'

        // check duplicate 
        const isExistId = await Mess.find({ manager_id: id })
        const isExistMonth = await Mess.find({ mess_month })
        if (!!isExistId.length && !!isExistMonth.length) {
            return errorMessage(res, 403, 'You Already Have a Mess in This Account on This Month')
        }
        // mess instance
        const mess = new Mess({
            mess_name,
            mess_month,
            finished: false,
            manager_id: id,
            month_id: `m-${date.getTime()}`,
            total_deposit: 0,
            total_meal: 0,
            total_meal_cost: 0,
            total_other_cost: 0,
            total_solo_cost: 0,
            members: [member]
        })

        // save mess data
        const result = await mess.save()

        // update members
        await User.findByIdAndUpdate(id, { mess_id: result._id, post: 'manager' }, { new: true })

        // send response
        return res.status(200).send({
            status: true,
            message: 'Mess created successfully',
            mess: result
        })

        // catch error
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// addMember
module.exports.addMember = async (req, res, next) => {
    try {
        const { id } = req.user
        const { email } = req.body
        const { mess_id } = await User.findById(id)
        const messResult = await Mess.findById(mess_id)
        const user = await User.findOne({ email }, '-password')

        // check empty email
        if (!email) {
            return errorMessage(res, 404, { email: 'Please provide a email to add member' })
        }

        // check empty email
        if (!user) {
            return errorMessage(res, 405, 'No User Found')
        }

        // check duplicate member
        const isMember = messResult.members.filter(member => member.email === email)
        if (isMember.length > 0) {
            return errorMessage(res, 405, 'Member already exists')
        }
        const updatedUser = {
            ...user._doc,
            mess_id: mess_id
        }

        const userResult = await User.findOneAndUpdate({ email }, updatedUser, { new: true }).select('-password')

        const updatedMess = {
            ...messResult._doc,
            members: [...messResult.members, userResult]
        }
        const result = await Mess.findByIdAndUpdate(mess_id, updatedMess, { new: true })

        return res.status(200).send({
            status: true,
            message: 'Member add successfully',
            mess: result
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}















// Delete all mess
module.exports.deleteAllMess = async (req, res, next) => {
    try {
        const result = await Mess.deleteMany()
        await User.updateMany(null, { mess_id: '', post: 'member' }, { new: true })
        return res.send(result)
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}
