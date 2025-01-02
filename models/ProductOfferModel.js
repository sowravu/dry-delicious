const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product', 
    required: true,
  },
  productname: {
    type: String,
    required: true,
  },
  offerPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100, 
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > this.startDate; 
      },
      message: 'End date must be after the start date',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true, 
  },
  discountedAmounts: {
    type: [Number], // This field stores an array of numbers
    default: [], // Default value is an empty array
  },
});

module.exports = mongoose.model('ProductOffer', productOfferSchema);
