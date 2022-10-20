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

// createMess
module.exports.createMess = async (req, res, next) => {
    try {
        const date = new Date()
        const { id } = req.user
        const { mess_name, mess_month } = req.body

        const validate = CreateMessValidator({ mess_name, mess_month })
        if(!validate.isValid){
            return errorMessage(res, 400, validate.error)
        }

        const isExistId = await Mess.find({ manager_id: id })
        const isExistMonth = await Mess.find({ mess_month })
        if (!!isExistId.length && !!isExistMonth.length) {
            return errorMessage(res, 403, 'You Already Have a Mess in This Account on This Month')
        }
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
            members: [id]
        })
        const result = await mess.save()

        const userResult = await User.findByIdAndUpdate(id, {mess_id: result._id}, {new: true})
        console.log(userResult)



        return res.status(200).send({
            status: true,
            message: 'Mess created successfully',
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
        return res.send(result)
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}
