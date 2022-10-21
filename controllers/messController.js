const Mess = require('../schema/messSchema');
const User = require('../schema/userSchema');
const jwt = require('jsonwebtoken');
const errorMessage = require('../utilities/errorMessage')
const createMessValidator = require('../validator/createMessValidator')
const addMoneyValidator = require('../validator/addMoneyValidator')

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
    const result = await Mess.findOne({mess_id})
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
        const validate = createMessValidator({ mess_name, mess_month })
        if (!validate.isValid) {
            return errorMessage(res, 400, validate.error)
        }
        const member = await User.findById(id, '-password')

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
            members: []
        })

        // save mess data
        const createdMess = await mess.save()

        // update user and add members/manager
        const updateUser = {
            ...member._doc,
            post: 'manager',
            mess_id: createdMess._id
        }
        const updatedMess = {
            ...createdMess._doc,
            members: [...createdMess._doc.members, updateUser]
        }
        await User.findByIdAndUpdate(id, updateUser, { new: true })
        const result = await Mess.findByIdAndUpdate(createdMess._id, updatedMess, { new: true })

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

// addMember's money
module.exports.addMembersMoney = async (req, res, next) => {
    try {
        const { id } = req.user
        const { email, amount } = req.body
        const { mess_id } = await User.findById(id)
        const messResult = await Mess.findById(mess_id)
        const user = await User.findOne({ email }, '-password')
        // validate input
        const validate = addMoneyValidator({ email, amount })

        if (!validate.isValid) {
            return errorMessage(res, 405, validate.error)
        }

        // is mess member
        const isMember = messResult.members.filter(member => member.email === email)
        if (isMember.length === 0) {
            return errorMessage(res, 405, 'Member Not Found, Please Add Member')
        }

        // update member money
        const updatedAmount = messResult.members.map(member => {
            if (member.email === email) {
                member.balance = Number(member.balance) + Number(amount)
            }
            return member
        })
        const updatedMess = {
            ...messResult._doc,
            total_deposit: Number(messResult._doc.total_deposit) + Number(amount),
            members: updatedAmount
        }

        // send response
        const result = await Mess.findByIdAndUpdate(mess_id, updatedMess, { new: true })
        return res.status(200).send({
            status: true,
            message: 'Money add successfully',
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
