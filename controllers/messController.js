const moment = require('moment')
const Mess = require('../schema/messSchema');
const User = require('../schema/userSchema');
const Month = require('../schema/monthSchema');
const errorMessage = require('../utilities/errorMessage')
const createMessValidator = require('../validator/createMessValidator')
const addMoneyValidator = require('../validator/addMoneyValidator');
const addMealValidator = require('../validator/addMealValidator');
const addMealCostValidator = require('../validator/addMealCostValidator');
const { ObjectId } = require('mongodb')
const year = moment().format('yyyy');


// createMess
module.exports.createMess = async (req, res, next) => {
    try {
        const date = new Date()
        const { id } = req.user
        const { mess_name, mess_month } = req.body

        // validate data
        const validate = createMessValidator({ mess_name, mess_month, })
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
            month_year: Number(year),
            total_deposit: 0,
            total_meal: 0,
            total_meal_cost: 0,
            total_other_cost: 0,
            total_solo_cost: 0,
            members: []
        })

        const createdMess = await mess.save()
        await Month.updateMany(null, { active: false, })
        const month = new Month({
            month: mess_month,
            year: Number(year),
            active: true,
            month_id: createdMess.month_id
        })

        // save mess data
        const monthRes = await month.save()



        // update user and add members/manager
        const updateUser = {
            ...member._doc,
            post: 'manager',
            mess_id: createdMess._id,
            active_month: monthRes._id
        }
        const updateUserMess = {
            ...member._doc,
            post: 'manager',
            mess_id: createdMess._id,
            month_list: [monthRes],
            active_month: monthRes._id
        }


        const updatedMess = {
            ...createdMess._doc,
            members: [...createdMess._doc.members, updateUserMess]

        }
        const userRes = await User.findByIdAndUpdate(id, updateUser, { new: true })
        const result = await Mess.findByIdAndUpdate(createdMess._id, updatedMess, { new: true })

        // send response
        return res.status(200).send({
            status: true,
            message: 'Mess created successfully',
            mess: result,
        })

        // catch error
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// createNew month
module.exports.createNew = async (req, res, next) => {
    try {
        const date = new Date()
        const { id } = req.user
        const { mess_month } = req.body

        const member = await User.findById(id, '-password')
        const messRes = await Mess.findById(member.mess_id)

        // check duplicate 
        const isExistId = await Mess.find({ manager_id: id })
        const isExistMonth = await Mess.find({ mess_month })
        if (!!isExistId.length && !!isExistMonth.length) {
            return errorMessage(res, 403, 'You Already Have a Mess in This Account on This Month')
        }

        // mess instance
        const mess = new Mess({
            mess_name: messRes.mess_name,
            mess_month,
            finished: false,
            manager_id: id,
            month_id: messRes.month_id,
            month_year: Number(year),
            total_deposit: 0,
            total_meal: 0,
            total_meal_cost: 0,
            total_other_cost: 0,
            total_solo_cost: 0,
            members: []
        })

        // create mess
        const createdMess = await mess.save()

        // update month
        await Month.updateMany(null, { active: false, })

        // create month
        const month = new Month({
            month: mess_month,
            year: Number(year),
            active: true,
            month_id: createdMess.month_id
        })

        // save month
        const monthRes = await month.save()
        const monthList = await Month.find({ month_id: messRes.month_id })

        // update all member
        const updatedMember = messRes.members.map(member => {
            member.balance = 0
            member.meal = 0
            member.solo = 0
            member.mess_id = createdMess.id
            member.month_list = monthList
            member.active_month = monthRes._id

            return member
        })

        // update mess
        const updatedMess = {
            ...createdMess._doc,
            members: updatedMember
        }

        // take members id
        const ids = updatedMember.map(member => member._id)
        await User.updateMany({ _id: ids }, { mess_id: createdMess._id, active_month: monthRes._id }, { new: true })
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
        const { mess_id, active_month } = await User.findById(id)
        const { month, year } = await Month.findById(active_month)


        const filter = {
            _id: mess_id,
            mess_month: month,
            month_year: year
        }

        if (!!req.body.month) {
            filter.mess_month = req.body.month
        }

        if (!!req.body.year) {
            filter.month_year = req.body.year
        }

        const result = await Mess.findOne(filter)
        if (!result) {
            return errorMessage(res, 404, `No mess found in ${month}, ${year} on your account`)
        }


        return res.status(200).send({
            status: true,
            message: 'Mess data get successfully',
            mess: result
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}


// addMember
module.exports.addMember = async (req, res, next) => {
    try {
        const { id } = req.user
        const { email } = req.body
        const { mess_id, post, active_month } = await User.findById(id)
        const month = await Month.findById(active_month)
        const filter = {
            mess_id,
            mess_month: month.month,
            month_year: month.year
        }
        const messResult = await Mess.findOne(filter)

        // check empty email
        if (!email) {
            return errorMessage(res, 404, { email: 'Please provide a email to add member' })
        }
        const user = await User.findOne({ email }, '-password')
        // check empty email
        if (!user) {
            return errorMessage(res, 405, 'No User Found')
        }
        if (post.toLowerCase() !== 'manager') {
            return errorMessage(res, 405, 'Only manager can add member')
        }
        // check duplicate member
        const isMember = messResult.members.filter(member => member.email === email)
        if (isMember.length > 0) {
            return errorMessage(res, 405, 'Member already exists')
        }
        const updatedUser = {
            ...user._doc,
            mess_id: mess_id,
            active_month,
        }
        const updatedMessUser = {
            ...user._doc,
            mess_id: mess_id,
            active_month,
            month_list: [month]
        }

        await User.findOneAndUpdate({ email }, updatedUser, { new: true }).select('-password')
        const updatedMess = {
            ...messResult._doc,
            members: [...messResult.members, updatedMessUser]
        }
        const result = await Mess.findOneAndUpdate(filter, updatedMess, { new: true })
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
        const { mess_id, post, active_month } = await User.findById(id)
        const { month, year } = await Month.findById(active_month)

        const filter = {
            mess_id,
            mess_month: month,
            month_year: year
        }
        const messResult = await Mess.findOne(filter)

        // validate input
        const validate = addMoneyValidator({ email, amount })
        if (!validate.isValid) {
            return errorMessage(res, 405, validate.error)
        }
        if (post.toLowerCase() !== 'manager') {
            return errorMessage(res, 405, 'Only manager can add money')
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
        const result = await Mess.findOneAndUpdate(filter, updatedMess, { new: true })
        return res.status(200).send({
            status: true,
            message: 'Money add successfully',
            mess: result
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// addMember's meal
module.exports.addMembersMeal = async (req, res, next) => {
    try {
        const { id } = req.user
        const { email, meal } = req.body
        const { mess_id, post, active_month } = await User.findById(id)
        const { month, year } = await Month.findById(active_month)
        const filter = {
            mess_id,
            mess_month: month,
            month_year: year
        }
        const messResult = await Mess.findOne(filter)

        // validate input
        const validate = addMealValidator({ email, meal })
        if (!validate.isValid) {
            return errorMessage(res, 405, validate.error)
        }
        if (post.toLowerCase() !== 'manager') {
            return errorMessage(res, 405, 'Only manager can add meal')
        }

        // is mess member
        const isMember = messResult.members.filter(member => member.email === email)
        if (isMember.length === 0) {
            return errorMessage(res, 405, 'Member Not Found, Please Add Member')
        }

        // update member meal
        const updatedMeal = messResult.members.map(member => {
            if (member.email === email) {
                member.meal = Number(member.meal) + Number(meal)
            }
            return member
        })
        const updatedMess = {
            ...messResult._doc,
            total_meal: Number(messResult._doc.total_meal) + Number(meal),
            members: updatedMeal
        }

        // send response
        const result = await Mess.findOneAndUpdate(filter, updatedMess, { new: true })
        return res.status(200).send({
            status: true,
            message: 'Meal add successfully',
            mess: result
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// addMultiMembersMeal meal 
module.exports.addMultiMembersMeal = async (req, res, next) => {
    // try {
    const { id } = req.user
    const memberBody = req.body
    const { mess_id, post, active_month } = await User.findById(id)
    const { month, year } = await Month.findById(active_month)
    const filter = {
        mess_id,
        mess_month: month,
        month_year: year
    }
    const messResult = await Mess.findOne(filter)

    if (post.toLowerCase() !== 'manager') {
        return errorMessage(res, 405, 'Only manager can add meal')
    }

    const updatedIds = Object.keys(memberBody) ? Object.keys(memberBody) : []

    // is mess member
    let isMember
    updatedIds.forEach(id => {
        isMember = messResult.members.filter(member => member._id.equals(id))

    })

    if (isMember.length === 0) {
        return errorMessage(res, 405, 'Member Not Found, Please Add Member')
    }
    let totalMealNumber = 0
    let updatedMeal

    // update member meal
    updatedIds.forEach(id => {
        updatedMeal = messResult.members.map(member => {
            if (member._id.equals(id)) {
                member.meal = Number(member.meal) + Number(memberBody[id])
                totalMealNumber = Number(totalMealNumber) + Number(memberBody[id])
            }
            return member
        })
    })
    const updatedMess = {
        ...messResult._doc,
        total_meal: Number(messResult._doc.total_meal) + totalMealNumber,
        members: updatedMeal
    }

    // send response
    const result = await Mess.findOneAndUpdate(filter, updatedMess, { new: true })
    return res.status(200).send({
        status: true,
        message: 'Meal add successfully',
        mess: result
    })
    // } catch (err) {
    //     return errorMessage(res, 500, 'Internal server error occurred')
    // }
}

// addMember's meal cost
module.exports.addMembersMealCost = async (req, res, next) => {
    try {
        const { id } = req.user
        const { email, mealCost } = req.body
        const { mess_id, post, active_month } = await User.findById(id)
        const { month, year } = await Month.findById(active_month)
        const filter = {
            mess_id,
            mess_month: month,
            month_year: year
        }
        const messResult = await Mess.findOne(filter)

        // validate input
        const validate = addMealCostValidator({ email, mealCost })

        if (!validate.isValid) {
            return errorMessage(res, 405, validate.error)
        }

        if (post.toLowerCase() !== 'manager') {
            return errorMessage(res, 405, 'Only manager can add meal cost')
        }

        // is mess member
        const isMember = messResult.members.filter(member => member.email === email)
        if (isMember.length === 0) {
            return errorMessage(res, 405, 'Member Not Found, Please Add Member')
        }

        const updatedMess = {
            ...messResult._doc,
            total_meal_cost: Number(messResult._doc.total_meal_cost) + Number(mealCost),
        }

        // send response
        const result = await Mess.findOneAndUpdate(filter, updatedMess, { new: true })
        return res.status(200).send({
            status: true,
            message: 'Meal cost add successfully',
            mess: result
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// Add Other cost
module.exports.addOtherCost = async (req, res, next) => {
    try {
        const { id } = req.user
        const { email, isIndividual, cost } = req.body
        const { mess_id, post, active_month } = await User.findById(id)
        const { month, year } = await Month.findById(active_month)
        const filter = {
            mess_id,
            mess_month: month,
            month_year: year
        }
        const messResult = await Mess.findOne(filter)

        // authorization
        if (post.toLowerCase() !== 'manager') {
            return errorMessage(res, 405, 'Only manager can add meal cost')
        }

        let updatedMess

        if (isIndividual) {
            // is mess member
            const isMember = messResult.members.filter(member => member.email === email)
            if (isMember.length === 0) {
                return errorMessage(res, 405, 'Member Not Found, Please Add Member')
            }

            // update member solo cost
            const updatedSoloCost = messResult.members.map(member => {
                if (member.email === email) {
                    member.solo = Number(member.solo) + Number(cost)
                }
                return member
            })

            updatedMess = {
                ...messResult._doc,
                total_solo_cost: Number(messResult._doc.total_solo_cost) + Number(cost),
                members: updatedSoloCost
            }
        } else {
            updatedMess = {
                ...messResult._doc,
                total_other_cost: Number(messResult._doc.total_other_cost) + Number(cost),
            }
        }

        // send response
        const result = await Mess.findOneAndUpdate(filter, updatedMess, { new: true })
        return res.status(200).send({
            status: true,
            message: 'Other cost add successfully',
            mess: result
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// changeManager
module.exports.changeManager = async (req, res, next) => {
    try {
        const { id } = req.user
        const { userId } = req.body
        const { mess_id, post, active_month } = await User.findById(id)
        const { month, year } = await Month.findById(active_month)
        const filter = {
            mess_id,
            mess_month: month,
            month_year: year
        }
        const messResult = await Mess.findOne(filter)

        // authorization
        if (post.toLowerCase() !== 'manager') {
            return errorMessage(res, 405, 'Only manager can change post')
        }

        const newManager = messResult.members.map(member => {
            if (member._id.equals(userId)) {
                member.post = 'manager'
            }
            if (member._id.equals(id)) {
                member.post = 'member'
            }
            return member
        })

        const updatedData = {
            ...messResult._doc,
            manager_id: userId,
            members: newManager
        }

        await User.findByIdAndUpdate(id, { post: 'member' }, { new: true })
        await User.findByIdAndUpdate(userId, { post: 'manager' }, { new: true })
        const result = await Mess.findOneAndUpdate(filter, updatedData, { new: true })

        // send response
        return res.status(200).send({
            status: true,
            message: 'Manager changed successfully',
            mess: result
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// removeMember
module.exports.removeMember = async (req, res, next) => {
    try {
        const { id } = req.user
        const { userId } = req.body
        const { mess_id, post, active_month } = await User.findById(id)
        const { month, year } = await Month.findById(active_month)
        const filter = {
            mess_id,
            mess_month: month,
            month_year: year
        }
        const messResult = await Mess.findOne(filter)

        // authorization
        if (post.toLowerCase() !== 'manager') {
            return errorMessage(res, 405, 'Only manager can remove member')
        }

        if (id === userId) {
            return errorMessage(res, 405, 'Manager cannot be remove')
        }
        const deletedMember = messResult.members.find(member => member._id.equals(userId))
        if (Number(deletedMember.balance) > 0 || Number(deletedMember.meal) > 0 || Number(deletedMember.solo) > 0) {
            return errorMessage(res, 405, 'Members have some unsolved amounts')
        }

        // filter member
        const newManager = messResult.members.filter(member => !(member._id.equals(userId)))
        const updatedData = {
            ...messResult._doc,
            manager_id: userId,
            members: newManager
        }

        // changed in database
        const result = await Mess.findOneAndUpdate(filter, updatedData, { new: true })
        // send response
        return res.status(200).send({
            status: true,
            message: 'Member remove successfully',
            mess: result
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// monthList
module.exports.monthList = async (req, res, next) => {
    try {
        const { id } = req.user
        const user = await User.findById(id)
        const mess = await Mess.findById(user.mess_id)

        // changed in database
        const result = await Month.find({ month_id: mess.month_id })

        // send response
        return res.status(200).send({
            status: true,
            message: 'Month get successfully',
            month: result,
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// change active monthList
module.exports.changeMonth = async (req, res, next) => {
    try {
        const { id } = req.user
        const user = await User.findById(id)
        const mess = await Mess.findById(user.mess_id)

        const { month_id } = req.body
        const { month, year } = await Month.findById(month_id)

        const filter = {
            mess_id: user.mess_id,
            mess_month: month,
            month_year: year
        }
        const messResult = await Mess.findOne(filter)

        if (!month_id) {
            return errorMessage(res, 500, { month_id: 'Please provide a month id' })
        }

        const changedMember = mess.members.map(member => {
            if (member._id.equals(id)) {
                member.active_month = month_id
                member.mess_id = messResult._id
                member.month_list.forEach(month => {
                    if (month._id.equals(month_id)) {
                        month.active = true
                    } else {
                        month.active = false
                    }
                    return month
                })
            }
            return member
        })

        const result = await Mess.findByIdAndUpdate(user.mess_id, { members: changedMember }, { new: true })
        await User.findByIdAndUpdate(id, { active_month: month_id }, { new: true })


        // send response
        return res.status(200).send({
            status: true,
            message: 'Month change successfully',
            mess: result,
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}

// deleteOldMonth
module.exports.deleteOldMonth = async (req, res, next) => {
    try {
        const { monthId } = req.params
        const { month, year, mess_id } = req.query

        if (!monthId) {
            return errorMessage(res, 500, { month_id: 'Please provide deleted month id' })
        }
        const result = await Mess.deleteOne({ month_id: mess_id, mess_month: month, month_year: year })
        await Month.findByIdAndDelete(monthId)

        // send response
        return res.status(200).send({
            status: true,
            message: 'Month change successfully',
            mess: result,
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}


// deleteMess
module.exports.deleteMess = async (req, res, next) => {
    try {
        const { messId } = req.params
        const { monthId } = req.query
        const { id } = req.user
        const user = await User.findById(id)
        const mess = await Mess.findById(messId)

        const userIds = mess.members.map(member => member._id)
        const deletedMess = await Mess.deleteMany({ month_id: monthId })

        const updateUser = {
            post: '',
            mess_id: '',
            active_month: ''
        }
        await User.updateMany({ _id: userIds }, updateUser, { new: true })



        // send response
        return res.status(200).send({
            status: true,
            message: 'Mess deleted successfully',
            mess: result,
        })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}












// Delete all mess
module.exports.deleteAllMess = async (req, res, next) => {
    try {
        const result = await Mess.deleteMany()
        const monthResult = await Month.deleteMany()
        await User.updateMany(null, { mess_id: '', post: 'member' }, { new: true })
        return res.send({ result, monthResult })
    } catch (err) {
        return errorMessage(res, 500, 'Internal server error occurred')
    }
}
