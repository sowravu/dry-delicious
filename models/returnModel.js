const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
    orderId: {
         type: String,
         required: true
    },
    itemid:{
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    size: {
        type: String,
        required: true,
        min: 1},

    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    reason: {
        type: String,
        enum: ['Defective', 'Wrong Item', 'Changed Mind', 'Other'],
        default: 'Other'
    },

    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    returnDate: {
        type: Date,
        default: Date.now
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    comments: {
        type: String
    }
});

const Return  = mongoose.model('Return', returnSchema);
module.exports=Return;