const brand = require("../../models/brandModel");
const category = require("../../models/CategoryModel");
const product = require("../../models/productsModel");

//Load product

const loadproducts = async (req, res) => {
  try {
    let { page = 1, limit = 5 } = req.query;

   
    page = parseInt(page);
    limit = parseInt(limit);

    
    const skip = (page - 1) * limit;

    const data = await product
    .find()
    .populate("productBrand")
    .populate("productCategory").skip(skip) .limit(limit);

    const totalProducts = await product.countDocuments();
     

  
    const totalPages = Math.ceil(totalProducts / limit);
       

   return res.render("products", { data: data,
    currentpage: page,
    totalPages: totalPages,
    limit: limit,
    });
  } catch (error) {
    console.log(error);
  }
};

//Load Addproduct

const loadAddProduct = async (req, res) => {
  try {
    const brandData = await brand.find();
    
    const categoryData = await category.find();
    return res.render("addProducts", { brand: brandData, cat: categoryData });
  } catch (error) {
    console.log(error);
    res.statues(500).send("error to load addProduct");
  }
};

const addProduct = async (req, res) => {
  try {
    const productName = req.body.productname;
    
    const productDescription = req.body.productDis;
    const weight = req.body.weigth;

    const stock250gm = weight.SM ? weight.SM.stock : null;

    const price250gm = weight.SM ? weight.SM.salesPrice : null;
    
    
    const price500gm = weight.Medium ? weight.Medium.salesPrice : null;
    const stock1kg = weight.L ? weight.L.stock : null;

    const price1kg = weight.L ? weight.L.salesPrice : null;
    const productBrand = req.body.productbrand;

    const productcategory = req.body.productcategory;
    
    const image = req.files.map((item) => item.filename);

    const existingData = await product.find({
      productname: productName,
    });
    console.log("existing data is", existingData);
    if (existingData.length > 0) {
      req.flash("error_msg", "already exists");
      return res.redirect("/admin/products");
    } else {
      const newProduct = await new product({
        productname: productName,
        productDis: productDescription,
        productImage: image,
        productCategory: productcategory,
        productBrand: productBrand,
        weightoptions: [
          {
            weight: "250gm",
            stock: stock250gm,
            salesPrice: price250gm,
          },
          {
            weight: "500gm",
            stock: stock500gm,
            salesPrice: price500gm,
          },
          {
            weight: "1kg",
            stock: stock1kg,
            salesPrice: price1kg,
          },
        ],
        is_delete: false,
      });
      await newProduct.save();
      req.flash("success_msg", "product added successfully.");
      return res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
    res.send("somethig is worng");
  }
};

const loadEditProduct = async (req, res) => {
  try {

    const id = req.query.id;
    const productData = await product
      .findById(id)
      .populate("productCategory")
      .populate("productBrand");
    const categorys = await category.find();
    const brands = await brand.find();
    if (productData) {
      // console.log(productData);
      return res.render("edit-product", {
        data: productData,
        Category: categorys,
        Brand: brands,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productName = req.body.productname;
    const productDescription = req.body.productDis;
    const weight = req.body.weigth;
    const stock250gm = weight.SM ? weight.SM.stock : 0;
    const price250gm = weight.SM ? weight.SM.salesPrice : 0;
    const stock500gm = weight.Medium ? weight.Medium.stock : 0;
    const price500gm = weight.Medium ? weight.Medium.salesPrice : 0;
    const stock1kg = weight.L ? weight.L.stock : 0;
    const price1kg = weight.L ? weight.L.salesPrice : 0;
    const productBrand = req.body.productbrand;
    const productcategory = req.body.productcategory;

    let existingImages = [];
    let imageMapping = {};

    try {

      console.log("bodyyyyyyyy",req.body,req.files);
      existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
      imageMapping = req.body.imageMapping ? JSON.parse(req.body.imageMapping) : {};
    } catch (err) {
      console.log("Error parsing image data:", err);
      existingImages = [];
      imageMapping = {}; 
    }

    const productFind = await product.findById({ _id: id });
    let productimage = [...productFind.productImage];  


    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const originalFileName = Object.entries(imageMapping).find(([orig, new_]) => new_ === file.originalname)?.[0];
        
        if (originalFileName) {
          const index = productFind.productImage.indexOf(originalFileName);
          if (index !== -1) {
            productimage[index] = file.filename;  
          }
        } else {
          productimage.push(file.filename);  
        }
      });
    }

    const existingProduct = await product.findOne({ productname: productName });

    if (productFind.productname === productName && productFind._id == id) {
      await product.findByIdAndUpdate(
        {
          _id: id,
        },
        {
          $set: {
            productname: productName,
            productDis: productDescription,
            productImage: productimage,
            productCategory: productcategory,
            productBrand: productBrand,
            weightoptions: [
              {
                weight: "250gm",
                stock: stock250gm,
                salesPrice: price250gm,
              },
              {
                weight: "500gm",
                stock: stock500gm,
                salesPrice: price500gm,
              },
              {
                weight: "1kg",
                stock: stock1kg,
                salesPrice: price1kg,
              },
            ],
          },
        }
      );

      req.flash("success_msg", "Product updated successfully.");
      return res.redirect("/admin/products");
    } else if (!existingProduct) {
      await product.findByIdAndUpdate(
        {
          _id: id,
        },
        {
          $set: {
            productname: productName,
            productDis: productDescription,
            productImage: productimage,
            productCategory: productcategory,
            productBrand: productBrand,
            weightoptions: [
              {
                weight: "250gm",
                stock: stock250gm,
                salesPrice: price250gm,
              },
              {
                weight: "500gm",
                stock: stock500gm,
                salesPrice: price500gm,
              },
              {
                weight: "1kg",
                stock: stock1kg,
                salesPrice: price1kg,
              },
            ],
          },
        }
      );
      req.flash("success_msg", "Product updated successfully.");
      return res.redirect("/admin/products");
    } else {
      req.flash("error_msg", "Product already exists.");
      return res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
    req.flash("error_msg", "An error occurred while updating the product.");
    return res.redirect("/admin/products");
  }
};

const deleteProduct =async(req,res)=>{
  try {
  const id =req.query.id
  const findProduct=await product.findById(id)
  if(findProduct.is_delete==false){
    await product.findByIdAndUpdate({
      _id:id  
    },
    {$set:{is_delete:true}}
  )
  res.redirect("/admin/products")
  }else if(findProduct.is_delete==true){
    await product.findByIdAndUpdate({
      _id:id  
    },
    {$set:{is_delete:false}}
  )
  res.redirect("/admin/products")
  }else{
    res.send("blocking product faild")
  }
  } catch (error) {
    res.send("canot be find the product")
    console.log(error)
  }

}

module.exports = {
  loadproducts,
  loadAddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
  deleteProduct
};
