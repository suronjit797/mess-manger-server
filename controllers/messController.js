const Mess = require('../schema/messSchema');
const jwt = require('jsonwebtoken');
const errorMessage = require('../utilities/errorMessage')

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
        if (!mess_name) {
            return errorMessage(res, 400, 'Please provide a mess name')
        }
        if (!mess_month) {
            return errorMessage(res, 400, 'Please select a month')
        }
        const isExist = await Mess.find({ manager_id: id })
        console.log(isExist.length)
        if (!!isExist.length) {
            return errorMessage(res, 500, 'You already have a mess in this account')
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
