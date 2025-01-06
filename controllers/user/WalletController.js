

const User = require("../../models/userModel");
require('dotenv').config();


const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');

const Transaction = require('../../models/transactionModel');
const crypto = require('crypto');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
const loadWallet=async(req,res)=>{
    try {
        const userdata= req.session.users
        console.log("user data is ",userdata._id)
        const user = await User.findById(userdata._id);
        const transactions = await Transaction.find({ userId:userdata._id }).sort({ createdAt: -1 }).limit(10);
        res.render("Wallet", { user:userdata._id,walletBalance: user.walletBalance||0, transactions });
      } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while loading the wallet");
      }
}


const createOrder=async(req,res)=>{
    try {
       
        const amount = req.body.amount * 100; 
        const options = {
          amount: amount,
          currency: "INR",
          receipt: crypto.randomBytes(10).toString('hex')
        };


  
        razorpay.orders.create(options, (err, order) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error creating Razorpay order" });
          }
          res.json(order);
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
}

const verifyPayment = async (req, res) => {
  try {
      const {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          amount
      } = req.body;

      console.log("Verifying payment:", razorpay_payment_id);

      const secretKey = process.env.RAZORPAY_KEY_SECRET;
      if (!secretKey) {
          throw new Error("Razorpay secret key is not defined");
      }

      const hmac = crypto.createHmac("sha256", secretKey);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature === razorpay_signature) {
          console.log("Payment verified successfully.");

          const userdata = req.session.users;
          console.log("the user is a mannnnnnn",req.session.users)
          const user = await User.findById(userdata._id);

          if (!user) {
              return res.status(404).json({ message: "User not found" });
          }

          user.walletBalance += amount;

          await user.save();

          const transaction = new Transaction({
              userId: userdata._id,
              type: "credit",
              amount: amount,
              status:"success",
              createdAt: new Date(),
              paymentId:razorpay_payment_id,
              
          });

          await transaction.save();

          return res.json({ message: "Payment verified successfully" });
      } else {
          return res.status(400).json({ message: "Invalid payment signature" });
      }
  } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Server error" });
  }
};




module.exports={
    verifyPayment,
    createOrder,
    loadWallet,
    
}