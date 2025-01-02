const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            default: () => uuidv4(), 
            unique: true, 
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        shipping_address: {
            Fullname: { type: String, required: true },
            Address: { type: String, required: true },
            city: { type: String, required: true },
            State: { type: String, required: true },
            pinCode: { type: String, required: true },
            Country: { type: String, required: true },
            phone: { type: String, required: true },
            addressType: { type: String, enum: ['Home', 'Work', 'Other'], required: true },
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'product', 
                    required: true,
                },
                name: { type: String, required: true }, 
                price: { type: Number, required: true },
                size: { type: String, required: true }, 
                quantity: { type: Number, required: true }, 
                image: { type: String, required: true },
                sub_total: { type: String, required: true },
                order_status: {
                    type: String,
                    enum: ['confirmed', 'Shipped', 'Delivered', 'Cancelled','return requested','Returned','Return Rejected'],
                    default: 'confirmed',
                },
            },
         
        ],
        total_price: {
            type: Number,
            required: true,
        },
        payment_status:{
            type:String,
            enum:['pending','success'],
            default:'pending'
        },
       
        payment_method:{
            type:String,
            enum:['COD','online','WALLET'],
            required:true
        },
        razorpay_order_id: {
            type: String,
            default: null
        },
        razorpay_payment_id: {
            type: String,
            default: null
        },
        razorpay_signature: {
            type: String,
            default: null
        },
     
    },
    
    { timestamps: true } 
);

const Order = mongoose.model('order', orderSchema);

module.exports = Order;
