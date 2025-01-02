const mongoose=require("mongoose");


const weightSchema=new mongoose.Schema({
  weight:{
    type:String,
    required:false,
    default:0,
    enum:['250gm','500gm','1kg']
  },
  stock:{
    type:Number,
    required:false,
    min:0,
    max:1000,
    default:0,
  },
  Actualprice:{
    type:Number,
    required:false,
    default:0,
  },
  salesPrice:{
    type:Number,
    required:false,
    default:0,
  },
  originalSalesPrice:{
     type: Number,
     default: null
     },
})



const productSchema=new mongoose.Schema({

productname:{
  type:String,
  required:true
},
productDis:{
  type:String,
  required:true
},
productImage:[{
  type:String,
  required:true,
}],

productCategory:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Category",
  required:true
},
productBrand:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Brand",
  required:true,
},
is_delete:{
  type:Boolean,
  required:true
},
dateCreated:{
  type:Date,
  default:Date.now
},

weightoptions:[weightSchema]


})


module.exports=mongoose.model("product",productSchema)