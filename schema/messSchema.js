const mongoose = require('mongoose');
const { Schema } = mongoose;


const messSchema = new Schema({
    mess_name: {
        type: String,
        required: true,
        trim: true,
    },
    mess_month: {
        type: String,
        required: true,
        trim: true,
    },
    finished: Boolean,
    manager_id: String,
    month_title: String,
    total_deposit: String,
    total_meal: String,
    total_meal_cost: String,
    total_other_cost: String,
    total_solo_cost: String,
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }]
}, { timestamps: true, });

const Mess = mongoose.model('Mess', messSchema);
module.exports = Mess