
const brand = require("../../models/brandModel");
const category = require("../../models/CategoryModel");
const product = require("../../models/productsModel");
const ProductOffer = require('../../models/ProductOfferModel');
const StatusCodes = require('../../utils/statusCodes');
const CategoryOffer = require("../../models/categoryOfferModule")
const loadoffers = async (req, res) => {
  try {
    const findproducts = await product.find()
    const findcategories = await category.find()
    const findproductoffer = await ProductOffer.find()
    return res.render("offers", { product: findproducts, offers: findproductoffer, category: findcategories })
  } catch (error) {
    console.log(error)
  }
}
const addoffers = async (req, res) => {
  try {
    const { productSelect, productOfferPercentage, productOfferStartDate, productOfferEndDate } = req.body;

    const existingOffer = await ProductOffer.findOne({ productId: productSelect, isActive: true });
    if (existingOffer) {
      req.session.message = {
        icon: "error",
        text: "This product already has an active offer",
      };
      return res.redirect("/admin/offers")
    }

    const selectedProduct = await product.findById(productSelect)
    let discountedAmounts = []
    if (selectedProduct) {
      selectedProduct.weightoptions.forEach(option => {
        const discount = (option.salesPrice * productOfferPercentage) / 100;

        option.salesPrice = Math.round(option.salesPrice - discount);
        discountedAmounts.push(Math.round(discount))


      });

      await selectedProduct.save();
    }

    const newOffer = new ProductOffer({
      type: "Product Offer",
      productId: selectedProduct._id,
      productname: selectedProduct.productname,
      offerPercentage: productOfferPercentage,
      startDate: new Date(productOfferStartDate),
      endDate: new Date(productOfferEndDate),
      discountedAmounts
    });

    await newOffer.save();

    req.session.message = {
      icon: "success",
      text: "Offer added successfully and sales prices updated",
    };
    return res.redirect("/admin/offers")

  } catch (error) {

    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Internal server error');

  }
};

const removeoffer = async (req, res) => {
  try {
    const id = req.query.id
    console.log("idid is is ", id)
    const findoffer = await ProductOffer.findOne({ productId: id })
    console.log("ProductOffer is is ", ProductOffer)
    if (findoffer) {
      const findproduct = await product.findById(findoffer.productId);
      console.log("findproduct is is ", findproduct)
      if (findproduct) {

        for (let i = 0; i < findoffer.discountedAmounts.length; i++) {

          findproduct.weightoptions[i].salesPrice = findproduct.weightoptions[i].salesPrice + Math.round(findoffer.discountedAmounts[i])
        }
        await findproduct.save();
        await ProductOffer.deleteOne({ _id: findoffer._id });
      }

      req.session.message = {
        icon: "success",
        text: "Offer removed successfully and sales prices updated",
      };
      return res.redirect("/admin/offers")

    }
  } catch (error) {
    console.log(error)
  }
}
const loadcategoryoffers = async (req, res) => {
  try {

    const categories = await category.find({ isDelete: false });
    const offers = await CategoryOffer.find({ isActive: true }).populate("categoryId");
    return res.render("categoryoffer", { category: categories, offers });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};


const addcategoryoffers = async (req, res) => {
  try {
    const { categorySelect, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate } = req.body;


    const existingOffer = await CategoryOffer.findOne({ categoryId: categorySelect, isActive: true });
    if (existingOffer) {
      req.session.message = {
        icon: "error",
        text: "An active offer already exists for this category.",
      };
      return res.redirect("/admin/category-offer");
    }

    
    const findcategory = await category.findById(categorySelect);
    console.log("findcategory id id ", findcategory);
    if (!findcategory) return res.status(404).send("Category not found");

    const newOffer = new CategoryOffer({
      type: "Category",
      categoryId: findcategory._id,
      categoryname: findcategory.categoryName,
      offerPercentage: categoryOfferPercentage,
      startDate: categoryOfferStartDate,
      endDate: categoryOfferEndDate,
    });

    await newOffer.save();

   
    const products = await product.find({ productCategory: findcategory._id, is_delete: false });
    for (const product of products) {
      product.weightoptions.forEach((option) => {
       
        if (!option.originalSalesPrice) {
          option.originalSalesPrice = option.salesPrice; 
        }
        option.salesPrice = Math.round(option.salesPrice - (option.salesPrice * categoryOfferPercentage) / 100);
      });
      await product.save();
    }

    req.session.message = {
      icon: "success",
      text: "Offer added successfully and sales prices updated",
    };

    return res.redirect("/admin/category-offer");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const removecategoryoffer = async (req, res) => {
  try {
    const { offerId } = req.body;

    
    const offer = await CategoryOffer.findById(offerId);
    console.log("offer is ", offer);
    if (!offer) return res.status(404).send("Offer not found");

    offer.isActive = false;
    await offer.save();

   
    const products = await product.find({ productCategory: offer.categoryId, is_delete: false });
    for (const product of products) {
      product.weightoptions.forEach((option) => {
        if (option.originalSalesPrice) {
          option.salesPrice = option.originalSalesPrice; 
          delete option.originalSalesPrice; 
        }
      });
      await product.save();
    }

    req.session.message = {
      icon: "success",
      text: "Offer removed successfully and sales prices updated",
    };

    return res.redirect("/admin/category-offer");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};




module.exports = {
  loadcategoryoffers,
  addcategoryoffers,
  removecategoryoffer,
  removeoffer,
  addoffers,
  loadoffers
}