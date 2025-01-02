const mongoose = require('mongoose');

const categoryOfferSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  categoryId: {
   type:mongoose.Schema.Types.ObjectId,
   ref:"Category",
   required:true
  },
  categoryname: {
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
});

module.exports = mongoose.model('CategoryOffer', categoryOfferSchema);
