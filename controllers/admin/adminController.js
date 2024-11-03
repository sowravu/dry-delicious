const Admin = require("../../models/userModel");
const Category=require("../../models/CategoryModel")
const Brand = require("../../models/brandModel");
const StatusCodes = require('../../utils/statusCodes');

const bcrypt = require("bcrypt");

const { render } = require("../../routes/adminRoute");

// Admin Login Page Controller
const loginload = async (req, res) => {
  try {
    if (!req.session.adminId) {
      return res.status(200).render("admin-login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Login page could not be loaded");
  }
};

// Admin Dashboard Controller
const loadDashboard = async (req, res) => {
  try {
    const admin = req.session.adminId;

    if (admin) {
      const adminData = await Admin.findOne({ _id: admin });
      return res.render("dashboard", { admin: adminData });
    } else {
      console.log("admin is missing");
      res.send("admin not found");
    }
  } catch (error) {
    console.log(error.message);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("dashbord page is not be loaded");

  }
};



const usersload = async (req, res) => {
  try {

    let { page = 1, limit = 5 } = req.query;

   
    page = parseInt(page);
    limit = parseInt(limit);

    
    const skip = (page - 1) * limit;

    const userData = await Admin.find({ isAdmin: false })
      .skip(skip)
      .limit(limit);

    const totalUsers = await Admin.countDocuments({ isAdmin: false });

  
    const totalPages = Math.ceil(totalUsers / limit);

  
    return res.render("users", {
      user: userData,
      currentPage: page,
      totalPages: totalPages,
      limit: limit,
   
    });
  } catch (error) {
    console.log(error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("user page is not loaded");

  }
};



const categoriesload = async (req, res) => {
  try {
     let {page=1,limit=2}=req.query;

       page=parseInt(page)
            limit=parseInt(limit)

     const skip=(page-1)*limit;

     const data = await Category.find({})
     .skip(skip)

     .limit(limit)

const totalCategors=await Category.find().countDocuments()

const totalPages=Math.ceil(totalCategors/limit)
    return res.render("categories", { 
      data: data ,
      currentPage:page,
      totalPages:totalPages,
      limit:limit,
    });
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("categories page is not loaded");
 
  }
};

const loadeditCategories = async (req, res) => {
  try {
    const id = req.query.id;
    const categoriesData = await Category.findById({ _id: id });
    return res.render("edit-categories", { data: categoriesData });
  } catch (error) {
    console.error("error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error updating category");

  }
};

// Brands List Page Controller
const loadbrands = async (req, res) => {

  try {
  
    let {page=1,limit=2}=req.query;
    page=parseInt(page)
    limit=parseInt(limit)
    
    const skip=(page-1)*limit;
    
    const brandData = await Brand.find()
    .skip(skip).limit(limit)

    const  totalBrands=await Brand.find().countDocuments()

    const totalPages= Math.ceil(totalBrands/limit)
    res.render("brands", { 
      brandData: brandData,
      currentpage:page,
      totalPageCount:totalPages,
      limit:limit
     });
  } catch (error) {
    console.error("error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("brands page is not loaded");

  }
};



// Admin Login Verification Controller
const loginverify = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await Admin.findOne({ email: email });

    if (!adminData) {
      res.render("admin-login", { message: "invalid user" });
    } else {
      const isAdmin = adminData.isAdmin;
      const passwordMatch = await bcrypt.compare(password, adminData.password);
      if (passwordMatch && isAdmin) {
        req.session.adminId = adminData._id;

        res.redirect("/admin/dashboard");
      } else {
        res.render("admin-login", { message: "invalid username or password" });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("brands page is not loaded");

  }
};

// User Block Controller
const userblock = async (req, res) => {
  try {
    const id = req.query.id;
    console.log()
  
    if (id) {
      await Admin.findByIdAndUpdate({_id:id}, { isVerified: false }); 
      res.redirect("/admin/users");
    } else {
      res.status(400).send("User ID is missing");
    }
  } catch (error) {
    console.error("Error in user blocking:", error);
    res.status(500).send("Internal Server Error");
  }
};

// User Unblock Controller
const userUnblock = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("the email id pass",id)
    if (id) {
      await Admin.findByIdAndUpdate({_id:id}, { isVerified: true });
      res.redirect("/admin/users");
    } else {
      res.status(400).send("User ID is missing");
    }
  } catch (error) {
    console.error("Error in user unblocking:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Add New Category Controller
const addCategories = async (req, res) => {
  try {
    
    const name = req.body.name;
    const Description = req.body.Description;

    const categoriesData = await Category.findOne({ categoryName: name });

    if (categoriesData) {
     req.flash("error_msg","category is already here")
     res.redirect("/admin/categories")
    } else {
      const savecategoriesData = await new Category({
        categoryName: name,
        Description: Description,
        isDelete: false,
      });
      await savecategoriesData.save();
     req.flash('success_msg', 'Category added successfully.');
     return res.redirect("/admin/categories");
    }
  } catch (error) {
    console.log("err", error);
  }
};

// Edit Category Controller
const editCategories = async (req, res) => {
  try {
    const name = req.body.name;
    const Description = req.body.description;

    const id = req.body.id;
    const categoriesdata = await Category.findById({ _id: id });
    
   const exstingData=await Category.find({categoryName:name})
   console.log("exstingData is",exstingData)
    if (categoriesdata.categoryName==name&&categoriesdata._id==id) {
       await Category.findByIdAndUpdate(
          id,
        { $set: { categoryName: name, Description: Description } }
      );
      req.flash('success_msg', 'Category updated successfully.');
     return res.redirect("/admin/categories")
          
    }else if(exstingData.length==0){
      await Category.findByIdAndUpdate(
        id,
      { $set: { categoryName: name, Description: Description } }
    );
    req.flash('success_msg', 'Category updated successfully.');
    return res.redirect("/admin/categories")
    }else{
      req.flash("error_msg","already exists")
     return res.redirect("/admin/categories")
    }
      
  } catch (error) {
    console.error("updation failed", error);
    res.send("error for update");
  }
};

// Delete/Update Category Status Controller
const deleteCategories = async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      const categoriesdata = await Category.findById({ _id: id });

      if (!categoriesdata) {
        return res.status(404).json({ message: "Category not found" });
      }
      const newStatus = categoriesdata.isDelete ? false : true;
      await Category.findByIdAndUpdate(id, { isDelete: newStatus });
      res.redirect("/admin/categories");
    } else {
      res.status(StatusCodes.BAD_REQUEST).send("ID is missing");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating category status", error });
  }
};
// Edit Brand Page Controller
const loadeditBrand = async (req, res) => {
  try {
    const id = req.query.id;
    const brandData = await Brand.findById({ _id: id });
    if (brandData) {
      return res.render("edit-brand", { data: brandData });
    } else {
      res.status(StatusCodes.NOT_FOUND).send("Brand not found");
    }
  } catch (error) {
    console.error("Error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Failed to load edit page");
  }
};

// Add New Brand Controller
const addbrand = async (req, res) => {
  try {
    const brandname = req.body.name;
    const description = req.body.description;
    const image = req.file ? req.file.filename : null;

    const brandData = await Brand.findOne({brandname:brandname});

    if (brandData) {
      req.flash("error_msg","brand is already here")
      return res.redirect("/admin/brands")
    } 
      const brand = new Brand({
        brandname: brandname,
        description: description,
        image: image,
        isActive: true,
      });
       await brand.save();

        req.flash("success_msg","brand added sucessfully")
        return res.redirect("/admin/brands")
    
  } catch (error) {
    console.error(error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error adding brand");
  }
};

// Delete/Update Brand Status Controller
const deleteBrand = async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      const bransData = await Brand.findById({ _id: id });
     
      if (!bransData) {
        return res.status(StatusCodes.NOT_FOUND).send("Brand not found");
      }
      const newStatus = bransData.isActive ? false : true;
      await Brand.findByIdAndUpdate(id, { isActive: newStatus });
      res.redirect("/admin/brands");
    } else {
      res.status(StatusCodes.BAD_REQUEST).send("ID is missing");
    }
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error deleting brand");
  }
};

// Edit Brand Controller
const editBrand = async (req, res) => {
  try {
    const name = req.body.brandname.trim();
    const Description = req.body.branddescription;
    const id = req.query.id;
    
    const brandData = await Brand.findById({ _id: id });
    const image = req.files ? req.files.filename : brandData.image;
     
    const  exisingBrand=await Brand.find({brandname:name})
      
    if (brandData.brandname==name &&brandData._id==id) {
            await Brand.findOneAndUpdate(
              { _id: id },
        { $set: { brandname: name, description: Description, image: image } }
      );

      req.flash("success_msg","updated sucessfully")
      return res.redirect("/admin/brands")

    }else if(exisingBrand.length==0){
      await Brand.findOneAndUpdate(
        id,
         { $set: { brandname: name, description: Description, image: image } }
       )
       req.flash("success_msg","updated sucessfully")
       return res.redirect("/admin/brands")

    }else{
      req.flash("error_msg","brand is already here")
      return res.redirect("/admin/brands")
    }
      
  } catch (error) {
    console.error("updation failed", error);
    res.send("error for update");
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("error for destorying session");
        res.status(404).send("page not found");
      }
    });
    res.redirect("/admin/login");
  } catch (error) {
    console.log("erro for logout");
    res.send("error for logout");
  }
};

module.exports = {
  adminLogout,
  editBrand,
  loadeditBrand,
  deleteBrand,
  addbrand,
  loadbrands,
  deleteCategories,
  editCategories,
  loadeditCategories,
  addCategories,
  categoriesload,
  userUnblock,
  userblock,
  usersload,
  loginverify,
  loginload,
  loadDashboard,
  
};
