const mongoose = require('mongoose');
const { Schema } = mongoose;


const monthSchema = new Schema({
    month: String,
    year: Number,
    active: Boolean,
    month_id: String,
});

const Month = mongoose.model('Month', monthSchema);
module.exports = Month