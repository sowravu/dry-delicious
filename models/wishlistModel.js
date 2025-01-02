const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const wishlistSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      isRed: {
        type: Boolean,   
        required: true,  
        default: true   
      }
    }
  ]
}, {
  timestamps: true 
});


const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
