const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: 'Please Provide Your Name',
        trim: true,
    },
    email: {
        type: String,
        required: 'Please Provide Your Email',
        trim: true,
        unique: [true, 'User Already Exists in This Email']
    },
    password: {
        type: String,
        required: 'Please Provide Your Password'
    },
    picture: String,
    balance: Number,
    meal: Number,
    solo: Number,
    post: String,
    mess_id: String,
},{timestamps:true,});

const User = mongoose.model('User',userSchema);

module.exports = User