const CartItem = require("../../models/cartModel");
const User = require("../../models/userModel");
const Brand = require("../../models/brandModel");
const Category = require("../../models/CategoryModel");
const address = require("../../models/addressModel");
const Product = require("../../models/productsModel");
const StatusCodes = require("../../utils/statusCodes")
const Order = require("../../models/orderModel");
const { find } = require("../../models/returnModel");
const Return = require("../../models/returnModel");
const Transaction = require('../../models/transactionModel');


const loadOrders = async (req, res) => {
    try {
      
      const orders = await Order.find({}).lean();
      res.render("orderlist", { orders: orders });
    } catch (error) {
      console.error("Error fetching orders:", error.message);
      res.status(500).send("An error occurred while fetching the order list.");
    }
  };
  
 

  const loadorderdetail = async (req, res) => {
    try {
        const orderid = req.query.orderid;
        const findorder = await Order.findOne({ orderId: orderid });
        const finduser = await User.findOne({ _id: findorder.user });

        if (findorder) {

            return res.render("orderdetail", { order: findorder, user: finduser });
        } else {
            return res.status(404).send("Order not found");
        }
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Loading order details page failed");
    }
};


const changeOrderStatus=async (req,res)=>{
    try {

        const orderid=req.query.orderid;
        const {  payment_method,payment_status }=req.body
        const {  itemid, order_status } = req.body;
     
        console.log(itemid );
        console.log(orderid)
        console.log("paymant method is",payment_method)
       console.log("status order si",order_status)

       const previousStatusCheck=await  Order.findOne({orderId:orderid})

       if (previousStatusCheck.payment_status=='pending') {
        req.session.message = {
          icon: "error",
          text: "The payment for this order has not been completed.",
        };
        return res.redirect(`/admin/order-details?orderid=${orderid}`);
      }
      

       const previousONlinecheck = await Order.findOne({
        orderId: orderid,
        payment_method: "online",
        "items.order_status": "pending", 
      });

       const currentorderstatus = previousStatusCheck.items.find((item) => item._id.toString() === itemid);
       console.log("previous online check" ,previousONlinecheck)
       if(previousONlinecheck){
        
        req.session.message = {
            icon: "error",
            text: "Cannot update the order status when the payment is successful.",
          };
          return res.redirect(`/admin/order-details?orderid=${orderid}`)
        
       }
       console.log("current order stats is",order_status)
       if(currentorderstatus.order_status!='Delivered'&&currentorderstatus.order_status!='Cancelled'){
        const updatedOrder = await Order.findOneAndUpdate(
            
            {              
                orderId: orderid,

                "items._id": itemid 
            },
            {
                $set: { "items.$.order_status": order_status } 
            },
            
            { new: true } 
        );
        if(updatedOrder){
            const AllDelivered= await  Order.findOne({orderId:orderid})
        
            const AllDeliveredd = AllDelivered.items.every(item => item.order_status == 'Delivered');
    
            if(AllDeliveredd&&payment_method=='COD'){
                await Order.findOneAndUpdate(
                                {orderId: orderid},
                                {
                                    $set: { payment_status: 'success' } 
                                }
                            )
            }
        }
        }
        else{
            req.session.message = {
                icon: "error",
                text: "Order status cannot be updated for delivered items.",
              };
              return res.redirect(`/admin/order-details?orderid=${orderid}`)
        }
        req.session.message = {
            icon: "success",
            text: "status updated Sucessfully",
          };
        
    return res.redirect(`/admin/order-details?orderid=${orderid}`)
       
    } catch (error) {
        console.log(error)
        
    }
}

const loadreturn=async(req,res)=>{
    try {
         const findeturns= await Return.find().populate("productId")
         return res.render("return", {returns:findeturns})
    } catch (error) {
        console.log(error)

    }
}

const ApproveReturn=async(req,res)=>{
    try {
        const returnid=req.query.id;
        const findreturnorder=await Return.findById(returnid);
        
        if(findreturnorder.status=='Pending'){
            findreturnorder.status='Approved'

            findreturnorder.save()

            const product= await Product.findById(findreturnorder.productId)

            console.log("the product is ",product)
            
            if(product){
                const weightOption = product.weightoptions.find(option => option.weight === findreturnorder.size);
                if(weightOption){
                    weightOption.stock += findreturnorder.quantity;
                    await product.save();
                }
            }

        const finduser= await User.findById(findreturnorder.userId)
        if(finduser){
            finduser.walletBalance=finduser.walletBalance+findreturnorder.refundAmount;
           await finduser.save();
        }

      const changeorderStatus = await Order.findOne({orderId:findreturnorder.orderId})  

          console.log("changeorderStatus is",changeorderStatus)

      if(changeorderStatus){

                
for(let i=0 ; i<changeorderStatus.items.length;i++){

    if(changeorderStatus.items[i].size==findreturnorder.size){
        changeorderStatus.items[i].order_status='Returned'
        await changeorderStatus.save()
    }else{
        console.log("order stats changin faielded")
    }

}


      }
        const transaction = new Transaction({
            userId: finduser._id,
            type: "credit",
            amount: findreturnorder.refundAmount,
            status:"success",
            createdAt: new Date(),
          
        });

        await transaction.save();
        
        }else{
            req.session.message = {
                icon: "error",
                text: "return is already approved  or rejected",
              };
            return  res.redirect("/admin/return")
        }
        req.session.message = {
            icon: "success",
            text: "return is successfully approved.",
          };

       return res.redirect("/admin/return")
        
    } catch (error) {
        console.log(error)
    }
}

const RejectReturn=async(req,res)=>{
    try {
       
        const returnid=req.query.id;

        const findreturnorder=await Return.findById(returnid); 
          if(findreturnorder.status=='Pending'){

            findreturnorder.status='Rejected'

            findreturnorder.save()


            const changeorderStatus = await Order.findOne({orderId:findreturnorder.orderId})  
            console.log("changeorderStatus is",changeorderStatus)
        if(changeorderStatus){
               const items=changeorderStatus.items.find(option =>option.size===findreturnorder.size);
  
               if(items){
                  items.order_status='Return Rejected'  
                  await changeorderStatus.save();
                  req.session.message = {
                    icon: "success",
                    text: "return is successfully Rejected.",
                  };
                  return res.redirect("/admin/return")
                }
              
        }
          }else{
            req.session.message = {
                icon: "error",
                text: "return is already approved  or rejected",
              };
             return res.redirect("/admin/return")

          }

       

    } catch (error) {
           console.log(error)
     

    }
}



module.exports={
   
    RejectReturn,
    ApproveReturn,
    loadreturn,
    changeOrderStatus,
    loadorderdetail,
    loadOrders
}