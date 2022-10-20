const express = require('express');
const router = express.Router()
const messController = require('../controllers/messController')
const jwtVerify = require('../utilities/jwtVerify')

//GET: http://localhost:5000/api/v1/mess/all
router.get('/all', jwtVerify, messController.getAllMess)

//POST: http://localhost:5000/api/v1/mess
router.post('/', jwtVerify, messController.createMess)

// DELETE: http://localhost:5000/api/v1/mess/all
router.delete('/all', messController.deleteAllMess)





/* 

//GET: http://localhost:5000/api/v1/users/all
router.get('/all', userController.getAllUsers)

//GET: http://localhost:5000/api/v1/users/:id
router.get('/:id', userController.getSingleUsers)





 */


module.exports = router