const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Product = require('./models/productsModel');
const Category = require('./models/CategoryModel');
const Brand = require('./models/brandModel');

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Dry_Delicious";

const categoryData = [
  { categoryName: "Dry Fruits", Description: "Naturally sweet, sun-dried fruits rich in fiber, vitamins, and minerals." },
  { categoryName: "Nuts", Description: "Crunchy, protein-packed nuts freshly harvested and roasted to perfection." },
  { categoryName: "Seeds", Description: "Nutrient-dense superfood seeds loaded with Omega-3, proteins, and antioxidants." },
  { categoryName: "Spices", Description: "Handpicked, fragrant exotic spices that bring rich authentic flavor to recipes." },
  { categoryName: "Berries & Mixes", Description: "Antioxidant-rich berries and premium trail mix blends for daily vitality." }
];

const brandData = [
  { brandname: "DryDelicious Premium", description: "Our house brand offering farm-fresh, premium dried delights." },
  { brandname: "NutriGold", description: "Gold standard organic nutrition for an active, wholesome lifestyle." },
  { brandname: "Organic Harvest", description: "100% certified organic nuts, seeds, and dried superfruits." },
  { brandname: "Nature's Best", description: "Pure, unadulterated goodness harvested directly from pristine orchards." },
  { brandname: "Royal Dry Fruits", description: "Royal grade, handpicked royal nuts and exotic gourmet dry fruits." }
];

// 25 carefully curated products covering every Category and Brand
const productCatalog = [
  // --- Category: Nuts ---
  {
    name: "Royal California Almonds",
    category: "Nuts",
    brand: "DryDelicious Premium",
    description: "Premium California almonds handpicked for their crisp texture, sweetness, and high vitamin E content. Ideal for snacking and baking.",
    weights: [
      { weight: '250gm', stock: 45, salesPrice: 280, Actualprice: 350 },
      { weight: '500gm', stock: 60, salesPrice: 530, Actualprice: 680 },
      { weight: '1kg', stock: 35, salesPrice: 1020, Actualprice: 1300 }
    ]
  },
  {
    name: "Jumbo King Cashew Nuts (W180)",
    category: "Nuts",
    brand: "NutriGold",
    description: "Extra-large, whole W180 cashews with an exquisite buttery crunch. Sourced responsibly and packed with essential minerals.",
    weights: [
      { weight: '250gm', stock: 40, salesPrice: 320, Actualprice: 420 },
      { weight: '500gm', stock: 50, salesPrice: 620, Actualprice: 800 },
      { weight: '1kg', stock: 25, salesPrice: 1190, Actualprice: 1550 }
    ]
  },
  {
    name: "Roasted Salted Iranian Pistachios",
    category: "Nuts",
    brand: "Organic Harvest",
    description: "Authentic Iranian pistachios lightly roasted with sea salt. Easy to crack open and loaded with heart-healthy antioxidants.",
    weights: [
      { weight: '250gm', stock: 30, salesPrice: 360, Actualprice: 450 },
      { weight: '500gm', stock: 40, salesPrice: 690, Actualprice: 880 },
      { weight: '1kg', stock: 20, salesPrice: 1350, Actualprice: 1700 }
    ]
  },
  {
    name: "Kashmiri Walnut Kernels (Akhrot)",
    category: "Nuts",
    brand: "Nature's Best",
    description: "Snow-white halved walnut kernels from the valleys of Kashmir. Rich in plant-based Omega-3 fatty acids for brain health.",
    weights: [
      { weight: '250gm', stock: 35, salesPrice: 340, Actualprice: 430 },
      { weight: '500gm', stock: 45, salesPrice: 650, Actualprice: 820 },
      { weight: '1kg', stock: 20, salesPrice: 1250, Actualprice: 1600 }
    ]
  },
  {
    name: "Roasted Macadamia Nuts",
    category: "Nuts",
    brand: "Royal Dry Fruits",
    description: "Luxurious, velvety-smooth Australian macadamias delicately dry roasted to lock in rich, buttery flavor.",
    weights: [
      { weight: '250gm', stock: 25, salesPrice: 480, Actualprice: 600 },
      { weight: '500gm', stock: 30, salesPrice: 920, Actualprice: 1150 },
      { weight: '1kg', stock: 15, salesPrice: 1790, Actualprice: 2200 }
    ]
  },

  // --- Category: Dry Fruits ---
  {
    name: "Medjool Royal King Dates",
    category: "Dry Fruits",
    brand: "DryDelicious Premium",
    description: "Known as the jewel of dates, these large, soft Medjool dates are naturally sweet, caramel-like, and rich in dietary fiber.",
    weights: [
      { weight: '250gm', stock: 50, salesPrice: 290, Actualprice: 380 },
      { weight: '500gm', stock: 45, salesPrice: 550, Actualprice: 720 },
      { weight: '1kg', stock: 30, salesPrice: 1050, Actualprice: 1400 }
    ]
  },
  {
    name: "Afghan Dried Anjeer (Figs)",
    category: "Dry Fruits",
    brand: "NutriGold",
    description: "Sun-dried Afghan string figs packed with dietary fiber, iron, and calcium. Perfectly chewy with crunchy edible seeds.",
    weights: [
      { weight: '250gm', stock: 35, salesPrice: 370, Actualprice: 480 },
      { weight: '500gm', stock: 40, salesPrice: 710, Actualprice: 920 },
      { weight: '1kg', stock: 20, salesPrice: 1380, Actualprice: 1790 }
    ]
  },
  {
    name: "Turkish Golden Dried Apricots",
    category: "Dry Fruits",
    brand: "Organic Harvest",
    description: "Tender, plump Turkish dried apricots known for vibrant color and balanced sweet-tangy flavor. Excellent source of Vitamin A.",
    weights: [
      { weight: '250gm', stock: 40, salesPrice: 240, Actualprice: 310 },
      { weight: '500gm', stock: 50, salesPrice: 460, Actualprice: 590 },
      { weight: '1kg', stock: 25, salesPrice: 890, Actualprice: 1150 }
    ]
  },
  {
    name: "Long Green Kishmish (Raisins)",
    category: "Dry Fruits",
    brand: "Nature's Best",
    description: "Slender Indian green raisins, naturally shade-dried to retain juiciness, vibrant green tint, and gentle natural sweetness.",
    weights: [
      { weight: '250gm', stock: 60, salesPrice: 140, Actualprice: 190 },
      { weight: '500gm', stock: 70, salesPrice: 260, Actualprice: 360 },
      { weight: '1kg', stock: 40, salesPrice: 490, Actualprice: 680 }
    ]
  },
  {
    name: "Black Seedless Raisins",
    category: "Dry Fruits",
    brand: "Royal Dry Fruits",
    description: "Premium large black raisins bursting with natural iron and antioxidants. A wholesome choice for daily wellness rituals.",
    weights: [
      { weight: '250gm', stock: 50, salesPrice: 160, Actualprice: 220 },
      { weight: '500gm', stock: 55, salesPrice: 300, Actualprice: 410 },
      { weight: '1kg', stock: 30, salesPrice: 570, Actualprice: 780 }
    ]
  },

  // --- Category: Seeds ---
  {
    name: "Organic Raw Black Chia Seeds",
    category: "Seeds",
    brand: "DryDelicious Premium",
    description: "High-grade organic chia seeds. High in fiber and plant Omega-3; ideal for overnight puddings, smoothies, and juices.",
    weights: [
      { weight: '250gm', stock: 55, salesPrice: 150, Actualprice: 210 },
      { weight: '500gm', stock: 60, salesPrice: 280, Actualprice: 390 },
      { weight: '1kg', stock: 35, salesPrice: 530, Actualprice: 740 }
    ]
  },
  {
    name: "Roasted Crunchy Pumpkin Seeds",
    category: "Seeds",
    brand: "NutriGold",
    description: "AA grade hulled pumpkin seeds, lightly toasted to crispy perfection. Rich in zinc, magnesium, and plant-based protein.",
    weights: [
      { weight: '250gm', stock: 45, salesPrice: 220, Actualprice: 290 },
      { weight: '500gm', stock: 50, salesPrice: 410, Actualprice: 550 },
      { weight: '1kg', stock: 25, salesPrice: 790, Actualprice: 1050 }
    ]
  },
  {
    name: "Raw Golden Flax Seeds",
    category: "Seeds",
    brand: "Organic Harvest",
    description: "Organic golden flax seeds rich in dietary fiber and essential lignans. Great topping for oats, yogurts, and morning bowls.",
    weights: [
      { weight: '250gm', stock: 65, salesPrice: 110, Actualprice: 160 },
      { weight: '500gm', stock: 75, salesPrice: 200, Actualprice: 290 },
      { weight: '1kg', stock: 40, salesPrice: 380, Actualprice: 520 }
    ]
  },
  {
    name: "Shelled Raw Sunflower Seeds",
    category: "Seeds",
    brand: "Nature's Best",
    description: "Premium dehusked sunflower kernels loaded with Vitamin E and selenium. Deliciously nutty and versatile.",
    weights: [
      { weight: '250gm', stock: 50, salesPrice: 130, Actualprice: 180 },
      { weight: '500gm', stock: 60, salesPrice: 240, Actualprice: 330 },
      { weight: '1kg', stock: 30, salesPrice: 450, Actualprice: 620 }
    ]
  },
  {
    name: "Watermelon & Muskmelon Seed Blend",
    category: "Seeds",
    brand: "Royal Dry Fruits",
    description: "Crispy duo of peeled watermelon and melon seeds. A nutrient-dense super-snack packed with potassium and amino acids.",
    weights: [
      { weight: '250gm', stock: 40, salesPrice: 180, Actualprice: 240 },
      { weight: '500gm', stock: 45, salesPrice: 340, Actualprice: 450 },
      { weight: '1kg', stock: 25, salesPrice: 640, Actualprice: 850 }
    ]
  },

  // --- Category: Spices ---
  {
    name: "Bold Green Cardamom (Elaichi 8mm+)",
    category: "Spices",
    brand: "DryDelicious Premium",
    description: "Extra-bold 8mm green cardamom pods from the hills of Idukki, Kerala. Intense aroma and vibrant green pods.",
    weights: [
      { weight: '250gm', stock: 30, salesPrice: 750, Actualprice: 950 },
      { weight: '500gm', stock: 25, salesPrice: 1450, Actualprice: 1850 },
      { weight: '1kg', stock: 15, salesPrice: 2800, Actualprice: 3600 }
    ]
  },
  {
    name: "Ceylon True Cinnamon Quills",
    category: "Spices",
    brand: "NutriGold",
    description: "Authentic, delicately layered Ceylon cinnamon quills. Low coumarin, sweet floral aroma, ideal for gourmet teas and curries.",
    weights: [
      { weight: '250gm', stock: 35, salesPrice: 310, Actualprice: 400 },
      { weight: '500gm', stock: 40, salesPrice: 590, Actualprice: 760 },
      { weight: '1kg', stock: 20, salesPrice: 1120, Actualprice: 1480 }
    ]
  },
  {
    name: "Malabar Tellicherry Black Pepper",
    category: "Spices",
    brand: "Organic Harvest",
    description: "King of spices! Extra-large Tellicherry black peppercorns from Malabar with pungent heat and woodsy citrus notes.",
    weights: [
      { weight: '250gm', stock: 45, salesPrice: 260, Actualprice: 330 },
      { weight: '500gm', stock: 50, salesPrice: 490, Actualprice: 630 },
      { weight: '1kg', stock: 30, salesPrice: 940, Actualprice: 1220 }
    ]
  },
  {
    name: "Star Anise & Aromatic Cloves",
    category: "Spices",
    brand: "Nature's Best",
    description: "Exquisite whole star anise paired with hand-sorted Madagascar cloves for deep, complex warm aroma.",
    weights: [
      { weight: '250gm', stock: 35, salesPrice: 290, Actualprice: 370 },
      { weight: '500gm', stock: 35, salesPrice: 550, Actualprice: 700 },
      { weight: '1kg', stock: 20, salesPrice: 1050, Actualprice: 1350 }
    ]
  },
  {
    name: "Pure Kashmiri Mongra Saffron (Kesar)",
    category: "Spices",
    brand: "Royal Dry Fruits",
    description: "Highest grade Grade-A1 Kashmiri Mongra saffron threads. Unmatched crimson color, deep aroma, and golden brew.",
    weights: [
      { weight: '250gm', stock: 15, salesPrice: 1200, Actualprice: 1500 },
      { weight: '500gm', stock: 10, salesPrice: 2300, Actualprice: 2900 },
      { weight: '1kg', stock: 5, salesPrice: 4400, Actualprice: 5500 }
    ]
  },

  // --- Category: Berries & Mixes ---
  {
    name: "Dried Whole Sweet Cranberries",
    category: "Berries & Mixes",
    brand: "DryDelicious Premium",
    description: "Tangy-sweet whole dried cranberries. Excellent for trail mixes, cereals, holiday salads, and daily snacking.",
    weights: [
      { weight: '250gm', stock: 45, salesPrice: 210, Actualprice: 270 },
      { weight: '500gm', stock: 50, salesPrice: 390, Actualprice: 510 },
      { weight: '1kg', stock: 30, salesPrice: 750, Actualprice: 980 }
    ]
  },
  {
    name: "Wild Dried Blueberries",
    category: "Berries & Mixes",
    brand: "NutriGold",
    description: "Succulent dried wild blueberries bursting with potent anthocyanins and antioxidants. Naturally sweet and nutrient-dense.",
    weights: [
      { weight: '250gm', stock: 35, salesPrice: 420, Actualprice: 540 },
      { weight: '500gm', stock: 40, salesPrice: 810, Actualprice: 1020 },
      { weight: '1kg', stock: 20, salesPrice: 1580, Actualprice: 1990 }
    ]
  },
  {
    name: "7-in-1 Daily Superfood Trail Mix",
    category: "Berries & Mixes",
    brand: "Organic Harvest",
    description: "Powerhouse mix of roasted almonds, cashews, cranberries, blueberries, chia seeds, pumpkin seeds, and sunflower seeds.",
    weights: [
      { weight: '250gm', stock: 50, salesPrice: 310, Actualprice: 390 },
      { weight: '500gm', stock: 60, salesPrice: 590, Actualprice: 750 },
      { weight: '1kg', stock: 35, salesPrice: 1120, Actualprice: 1450 }
    ]
  },
  {
    name: "Himalayan Dried Goji Berries",
    category: "Berries & Mixes",
    brand: "Nature's Best",
    description: "Traditional superberries dried gently to retain vibrant red hue, beta-carotene, and immune-supportive compounds.",
    weights: [
      { weight: '250gm', stock: 30, salesPrice: 360, Actualprice: 460 },
      { weight: '500gm', stock: 35, salesPrice: 690, Actualprice: 880 },
      { weight: '1kg', stock: 20, salesPrice: 1330, Actualprice: 1700 }
    ]
  },
  {
    name: "Berry Nutty Energy Crunch Blend",
    category: "Berries & Mixes",
    brand: "Royal Dry Fruits",
    description: "A gourmet blend of roasted walnuts, pistachios, blackcurrants, dried strawberries, and toasted melon seeds.",
    weights: [
      { weight: '250gm', stock: 45, salesPrice: 340, Actualprice: 430 },
      { weight: '500gm', stock: 50, salesPrice: 650, Actualprice: 820 },
      { weight: '1kg', stock: 30, salesPrice: 1240, Actualprice: 1590 }
    ]
  }
];

async function seed() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully to MongoDB.");

    // Read available images from uploads
    const uploadsDir = path.join(__dirname, 'uploads');
    let images = [];
    try {
      images = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
      console.log(`Found ${images.length} images in uploads directory.`);
    } catch (err) {
      console.error("Uploads directory read error:", err.message);
    }
    if (images.length === 0) {
      images = ["1728224403023.jpg", "1728224496372.jpg", "1728225732146.jpg"];
    }

    let imgIndex = 0;
    const getNextImage = () => {
      const img = images[imgIndex % images.length];
      imgIndex++;
      return img;
    };

    // 1. Seed or Retrieve Categories
    const categoryMap = {};
    for (const cat of categoryData) {
      let existing = await Category.findOne({ categoryName: cat.categoryName });
      if (!existing) {
        existing = await Category.create({
          categoryName: cat.categoryName,
          Description: cat.Description,
          isDelete: false
        });
        console.log(`+ Created Category: ${cat.categoryName}`);
      } else {
        console.log(`- Category already exists: ${cat.categoryName}`);
      }
      categoryMap[cat.categoryName] = existing._id;
    }

    // 2. Seed or Retrieve Brands
    const brandMap = {};
    for (const b of brandData) {
      let existing = await Brand.findOne({ brandname: b.brandname });
      if (!existing) {
        existing = await Brand.create({
          brandname: b.brandname,
          description: b.description,
          image: getNextImage(),
          isActive: true
        });
        console.log(`+ Created Brand: ${b.brandname}`);
      } else {
        console.log(`- Brand already exists: ${b.brandname}`);
      }
      brandMap[b.brandname] = existing._id;
    }

    // 3. Seed Products
    let addedCount = 0;
    for (const item of productCatalog) {
      const existingProduct = await Product.findOne({ productname: item.name });
      if (!existingProduct) {
        const catId = categoryMap[item.category];
        const brandId = brandMap[item.brand];

        // 3 distinct images per product
        const pImages = [getNextImage(), getNextImage(), getNextImage()];

        await Product.create({
          productname: item.name,
          productDis: item.description,
          productImage: pImages,
          productCategory: catId,
          productBrand: brandId,
          is_delete: false,
          dateCreated: new Date(),
          weightoptions: item.weights.map(w => ({
            weight: w.weight,
            stock: w.stock,
            salesPrice: w.salesPrice,
            Actualprice: w.Actualprice,
            originalSalesPrice: w.Actualprice
          }))
        });
        addedCount++;
        console.log(`+ Added Product: ${item.name} (${item.category} | ${item.brand})`);
      } else {
        console.log(`- Product already exists: ${item.name}`);
      }
    }

    console.log(`\n==============================================`);
    console.log(`Seeding Complete!`);
    console.log(`Total Categories in DB: ${await Category.countDocuments()}`);
    console.log(`Total Brands in DB:     ${await Brand.countDocuments()}`);
    console.log(`Total Products in DB:   ${await Product.countDocuments()}`);
    console.log(`New Products Added:     ${addedCount}`);
    console.log(`==============================================\n`);

  } catch (error) {
    console.error("Seeding failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

seed();
