const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true, 
    },
    discountType: {
        type: String,
        enum: ['percentage'],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return value > 0; 
            },
            message: 'Discount value must be greater than 0',
        },
    },
    minimumPurchase: {
        type: Number,
        default: 0, 
    },
    maximumAmountdiscount:{
        type:Number,
        default:0
    },
    usageLimit: {
        type: Number,
        default: 1, 
    },
    expirationDate: {
        type: Date, 
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true, 
    },
    createdAt: {
        type: Date,
        default: Date.now, 
    },
});

module.exports = mongoose.model('Coupon', couponSchema);
