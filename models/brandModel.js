const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  brandname: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String, 
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Brand", brandSchema);
