const CartItem = require("../../models/cartModel");
const Product = require("../../models/productsModel");
const User = require("../../models/userModel");
const Brand = require("../../models/brandModel");
const Category = require("../../models/CategoryModel");
const address = require("../../models/addressModel");

const StatusCodes = require("../../utils/statusCodes")
const Order = require("../../models/orderModel")
const env = require("dotenv").config();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const razorpay = require("../../config/Razorpay");
const Return = require("../../models/returnModel");
const mongoose = require('mongoose');
const Transaction = require('../../models/transactionModel');
const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const orderplaced = async (req, res) => {
  try {
    const userId = req.query.id;
    const { selectedAddressId, totalprice, sub_total, paymentmethod, discountAmount, appliedCoupon } = req.body;

    console.log("discountAmount is", discountAmount);
    console.log("appliedCoupon is", appliedCoupon);
    console.log("total price is", totalprice);
   
    const selectedAddress = await address.findById({ _id: selectedAddressId });
    const products = await CartItem.find({ userId: userId });
    const userDetails = await User.findById({ _id: userId })
    let discountAmountPerProduct = [];
    let totalCartValue = products.reduce((sum, product) => sum + product.price * product.quantity, 0);

    if (appliedCoupon && appliedCoupon[0]?.length > 0 && discountAmount[0] > 0) {

      for (let i = 0; i < products.length; i++) {
        let productTotal = products[i].price * products[i].quantity;
        let discountShare = (productTotal / totalCartValue) * discountAmount[0];
        discountAmountPerProduct.push(discountShare / products[i].quantity);
      }
    } else {
      discountAmountPerProduct = products.map(() => 0);
    }

    console.log("discountAmountPerProduct", discountAmountPerProduct);
    console.log("totalprice is", totalprice);

    const items = products.map((product, index) => ({
      product: product.productId,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      image: product.image,
      size: product.size,
      sub_total: (product.price - discountAmountPerProduct[index]) * product.quantity,
    }));

    const totalpricewithcouponreduced = Number(totalprice[0]) - Number(discountAmount[0]);



    console.log("items", items);

    console.log("totalpricewithcouponreduced", totalpricewithcouponreduced)
    if (paymentmethod === 'online') {

      const options = {
        amount: Math.round(totalpricewithcouponreduced * 100),
        currency: "INR",
        receipt: `order_${Date.now()}`,
        payment_capture: 1

      };

      const razorpayOrder = await razorpay.orders.create(options);

      const newOrder = new Order({
        user: userId,
        shipping_address: {
          Fullname: selectedAddress.Fullname,
          Address: selectedAddress.Address,
          city: selectedAddress.city,
          State: selectedAddress.State,
          pinCode: selectedAddress.pinCode,
          Country: selectedAddress.Country,
          phone: selectedAddress.phone,
          addressType: selectedAddress.addressType
        },
        items,
        total_price: totalpricewithcouponreduced,
        payment_method: paymentmethod,
        payment_status: 'pending',
        razorpay_order_id: razorpayOrder.id
      });

      const savedOrder = await newOrder.save();


      return res.render('razorpay-payment', {
        order: savedOrder,
        razorpayOrder: razorpayOrder,
        key_id: process.env.RAZORPAY_KEY_ID
      });
    }

    else if (paymentmethod === 'COD') {
      if(totalpricewithcouponreduced>=1000){
        req.session.message = {
          icon: "error",
          text: `Cash on Delivery is not available for orders above ₹1000.`,
        };
       return res.redirect("/checkout")
    

      }else{
        const newOrder = new Order({
          user: userId,
          shipping_address: {
            Fullname: selectedAddress.Fullname,
            Address: selectedAddress.Address,
            city: selectedAddress.city,
            State: selectedAddress.State,
            pinCode: selectedAddress.pinCode,
            Country: selectedAddress.Country,
            phone: selectedAddress.phone,
            addressType: selectedAddress.addressType
          },
          items,
          total_price: totalpricewithcouponreduced,
          payment_method: paymentmethod,
          payment_status: 'pending'
        });
  
        const savedOrder = await newOrder.save();
  
        if (savedOrder) {
          for (let i = 0; i < items.length; i++) {
            const { product, quantity, size } = items[i];
            await Product.updateOne(
              { _id: product, "weightoptions.weight": size },
              { $inc: { "weightoptions.$.stock": -quantity } }
            );
          }
  
          await CartItem.deleteMany({ userId: userId });
  
          return res.render('ordercomplete', { Orderid: savedOrder.orderId });
        }
      }

    }

    else if (paymentmethod === 'WALLET' && totalpricewithcouponreduced < userDetails.walletBalance) {

      const newOrder = new Order({
        user: userId,
        shipping_address: {
          Fullname: selectedAddress.Fullname,
          Address: selectedAddress.Address,
          city: selectedAddress.city,
          State: selectedAddress.State,
          pinCode: selectedAddress.pinCode,
          Country: selectedAddress.Country,
          phone: selectedAddress.phone,
          addressType: selectedAddress.addressType
        },
        items,
        total_price: totalpricewithcouponreduced,
        payment_method: paymentmethod,
        payment_status: 'success'
      });
      const savedOrder = await newOrder.save();

      if (savedOrder) {

        const updatedwallet = await User.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: -totalpricewithcouponreduced } },
          { new: true }
        );
        if (updatedwallet) {
          const transaction = new Transaction({
            userId: userId,
            type: "debit",
            amount: Math.floor(totalpricewithcouponreduced),
            status: "success",
            createdAt: new Date(),

          });
          await transaction.save();

          for (let i = 0; i < items.length; i++) {
            const { product, quantity, size } = items[i];
            await Product.updateOne(
              { _id: product, "weightoptions.weight": size },
              { $inc: { "weightoptions.$.stock": -quantity } }
            );
          }

          await CartItem.deleteMany({ userId: userId });

        }
        return res.render('ordercomplete', { Orderid: savedOrder.orderId });
      }


    } else {
      req.session.message = {
        icon: "error",
        text: `Insufficient balance in wallet.`,
      };
      return res.redirect("/checkout")


    }


  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Order placing failed");
  }
};


const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;


    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {

      const order = await Order.findOneAndUpdate(
        { razorpay_order_id: razorpay_order_id },
        {
          payment_status: 'success',
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature
        },
        { new: true }
      );

      if (order) {

        for (let i = 0; i < order.items.length; i++) {
          const { product, quantity, size } = order.items[i];
          await Product.updateOne(
            { _id: product, "weightoptions.weight": size },
            { $inc: { "weightoptions.$.stock": -quantity } }
          );
        }

        await CartItem.deleteMany({ userId: order.user });

        return res.render('ordercomplete', { Orderid: order.orderId });

      }

    } else {

      await Order.findOneAndUpdate(
        { razorpay_order_id: razorpay_order_id },
        { payment_status: 'failed' }
      );
      return res.status(400).send('Payment verification failed');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Payment verification failed');
  }
};


const loadOrders = async (req, res) => {
  try {
    const user = req.session.users;

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });

    return res.render("orders", { orders: orders })

  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("orders placing page loading faield")
  }

}

const loadOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    req.session.orderId = orderId

    const orders = await Order.find({ orderId: orderId })

    return res.render("orderDetails", { orders: orders })

  } catch (error) {
    console.log(error)

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("orders deltails page loading faield")

  }
}

const cancelOrder = async (req, res) => {
  try {

    const user = req.session.users;
    const itemid = req.query.itemid;
    const product = req.query.product;
    const orderid = req.session.orderId;
    const size = req.query.size;
    const quantity = req.query.quantity
    const orderfind = await Order.findOne({ user: user._id, "items._id": itemid })
    console.log("order find is ", orderfind)
    const matchedItem = orderfind?.items?.find(item => item._id == itemid);
    const refund = matchedItem?.sub_total
    const result = await Order.updateOne(
      {
        user: user._id,
        'items._id': itemid,
      },
      {
        $set: { 'items.$.order_status': "Cancelled" },
      }
    );

    if (result) {

      const productUpdate = await Product.updateOne(
        {
          _id: product,
          'weightoptions.weight': size,
        },

        { $inc: { 'weightoptions.$.stock': +quantity } }

      )

      if (productUpdate) {
        if ((orderfind.payment_method == "online" || orderfind.payment_method == "WALLET") && 
        orderfind.payment_status == 'success') 
     {
          const finduser = await User.findById({ _id: orderfind.user })
          if (finduser) {
            finduser.walletBalance = finduser.walletBalance + Math.floor(refund);
            await finduser.save();
          }
          const transaction = new Transaction({
            userId: finduser._id,
            type: "credit",
            amount: Math.floor(refund),
            status: "success",
            createdAt: new Date(),

          });
          await transaction.save();

        }


        req.session.message = {
          icon: "success",
          text: `Product  cancelled successfully.`,
        };

        return res.redirect(`/order-details?orderId=${orderid}`);
      }

      req.session.message = {
        icon: "success",
        text: `Product  cancelled successfully.`,
      };

      return res.redirect(`/order-details?orderId=${orderid}`);

    } else {
      res.send("Failed to cancel product order");
    }

  } catch (error) {

    console.log(error);

  }
};

const returnOrder = async (req, res) => {

  const { itemId, productId, size, quantity, reason, comments } = req.body;
  try {
    const orderid = req.session.orderId
    const user = req.session.users;
    const statusupdtion = await Order.updateOne(
      {
        user: user._id,
        'items._id': itemId,
      },
      {
        $set: {
          'items.$.order_status': 'return requested'
        }
      }
    );
    console.log(req.body)
    const order = await Order.findOne({ orderId: orderid });

    const item = order.items.find(item => item._id.toString() === itemId);

    const refundAmount = item.sub_total


    console.log("refund amout is", refundAmount)

    if (statusupdtion) {
      const newReturn = new Return({
        orderId: orderid,
        productId: productId,
        userId: user._id,
        size: size,
        quantity: quantity,
        reason: reason,
        refundAmount: refundAmount,
        comments: comments,
        itemid: itemId,
      });

      await newReturn.save();
    }
    return res.redirect(`/order-details?orderId=${orderid}`);

  } catch (error) {
    console.log(error)
  }
}



const generateInvoice = async (req, res) => {
  let browser;
  try {
    const orderId = req.query.orderId;
    const order = await Order.findOne({ orderId: orderId });
    if (!order) {
      console.error('Order not found:', orderId);
      return res.status(404).send('Order not found');
    }

    const invoiceTemplatePath = path.join(__dirname, '../../views/user/invoice-template.ejs');
    const ejs =require('ejs')
    const htmlContent = await ejs.renderFile(invoiceTemplatePath, { order });

    console.log('HTML Content:', htmlContent);

    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });

    // Save PDF locally for debugging
    fs.writeFileSync(`invoice-${orderId}.pdf`, pdfBuffer);

    console.log('PDF Buffer Size:', pdfBuffer.length);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.end(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).send('An error occurred while generating the invoice.');
  } finally {
    if (browser) {
      await browser.close().catch(console.error);
    }
  }
};
const razorpayCreateorder=async(req,res)=>{
  try {

    const { amount, currency, receipt } = req.body; 
    req.session.receipt=receipt
    console.log("receipt is is ",req.session.receipt)
    const order = await razorpay.orders.create({
        amount: amount * 100, 
        currency,
        receipt,
    });
    res.json({
      success: true,
      orderId: order.id,
      ordersid:receipt,
  });
    
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}
const verifyRetryRazorpayPayment=async(req,res)=>{
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const orderid=req.session.receipt
console.log("req.bosy isisi",req.body)

    console.log("razorpay_order_id is",razorpay_order_id)

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', razorpay.key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

console.log("generatedSignature is",generatedSignature)

console.log("razorpay_signature is",razorpay_signature)

    if (generatedSignature === razorpay_signature) {
     
       const order= await Order.findByIdAndUpdate(
            {_id:orderid},
            { $set: { payment_status: 'success', razorpay_payment_id:razorpay_payment_id, razorpay_signature:razorpay_signature } }
        );

     if(order){
      for (let i = 0; i < order.items.length; i++) {
        const { product, quantity, size } = order.items[i];
        await Product.updateOne(
          { _id: product, "weightoptions.weight": size },
          { $inc: { "weightoptions.$.stock": -quantity } }
        );
      }
         await CartItem.deleteMany({ userId: order.user });
     }
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Invalid signature' });
    }


  } catch (error) {
     console.error('Error verifying payment:', error);
        res.status(500).json({ success: false });
  }
}



 

module.exports = {
  verifyRetryRazorpayPayment,
  razorpayCreateorder,
  generateInvoice,
  returnOrder,
  verifyRazorpayPayment,
  orderplaced,
  loadOrders,
  loadOrderDetails,
  cancelOrder

}


