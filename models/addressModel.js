const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  Fullname:{
    type:String,
    required:true,
  },
  Address:{
    type:String,
    required:true
  },
  city:{
    type:String,
    required:true
  },
  State:{
    type:String,
    required:true
  },
  pinCode:{
    type:Number,
    required:true
  },
  Country:{
    type:String,
    required:true
  },
  phone:{
  type:Number,
  required:true
 }

})

module.exports = mongoose.model("Address", addressSchema);