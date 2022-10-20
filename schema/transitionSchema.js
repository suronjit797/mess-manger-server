const mongoose = require('mongoose');
const { Schema } = mongoose;

const transitionSchema = new Schema({
    amount: {
        type: Number,
        required: 'Please Provide Your Amount',
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: 'Please Set a Type',
    },
    note: String,
    author:{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }

},{timestamps:true,});

const Transaction = mongoose.model('Transaction',transitionSchema);

module.exports = Transaction