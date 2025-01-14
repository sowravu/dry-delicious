const { name } = require("ejs");
const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: false,
    unique: false,
    sparse: true,
    default: null,
  },
 address:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Address",
    required:true
  }],
  googleId: {
    type: String,
    
  },
  password: {
    type: String,
    required: false,
  },
  walletBalance: {
    type: Number,
    default: 0,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  Image:{
  type:String,
  required: false,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

module.exports = mongoose.model("User", userSchema);
