const mongoose=require("mongoose");


const cartSchema=new mongoose.Schema({

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 

  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true }, 

  name: { type: String, required: true },

  size: { type: String, required: true }, 

  price: { type: Number, required: true },

  quantity: { type: Number, required: true, default: 1 },

  image: { type: String, required: true }

})


const CartItem = mongoose.model('CartItem', cartSchema);

module.exports=CartItem;