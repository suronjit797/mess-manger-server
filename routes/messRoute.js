const express = require('express');
const router = express.Router()
const messController = require('../controllers/messController')
const jwtVerify = require('../utilities/jwtVerify')

//GET: http://localhost:5000/api/v1/mess/all
router.get('/all', jwtVerify, messController.getAllMess)

// DELETE: http://localhost:5000/api/v1/mess/all
router.delete('/all', messController.deleteAllMess)


//GET: http://localhost:5000/api/v1/mess/singleMess
router.get('/singleMess', jwtVerify, messController.getSingleMess)

//POST: http://localhost:5000/api/v1/mess/addMember
router.post('/addMember', jwtVerify, messController.addMember)

//POST: http://localhost:5000/api/v1/mess/addMembersMoney
router.post('/addMembersMoney', jwtVerify, messController.addMembersMoney)

//POST: http://localhost:5000/api/v1/mess/addMembersMeal
router.post('/addMembersMeal', jwtVerify, messController.addMembersMeal)

//POST: http://localhost:5000/api/v1/mess/addMembersMealCost
router.post('/addMembersMealCost', jwtVerify, messController.addMembersMealCost)

//POST: http://localhost:5000/api/v1/mess/addOtherCost
router.post('/addOtherCost', jwtVerify, messController.addOtherCost)

//POST: http://localhost:5000/api/v1/mess/changeManager
router.post('/changeManager', jwtVerify, messController.changeManager)

//POST: http://localhost:5000/api/v1/mess/removeMember
router.post('/removeMember', jwtVerify, messController.removeMember)

//POST: http://localhost:5000/api/v1/mess/monthList
router.get('/monthList', jwtVerify, messController.monthList)

//POST: http://localhost:5000/api/v1/mess
router.post('/', jwtVerify, messController.createMess)

//POST: http://localhost:5000/api/v1/mess/createNew
router.post('/createNew', jwtVerify, messController.createNew)








/* 


//GET: http://localhost:5000/api/v1/mess/all
router.get('/all', userController.getAllUsers)






 */


module.exports = router