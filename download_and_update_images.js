const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/productsModel');
const Brand = require('./models/brandModel');

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Dry_Delicious";
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      // Already downloaded
      return resolve();
    }
    const request = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadImage(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    request.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

const unsplash = (id) => `https://images.unsplash.com/${id}?w=700&auto=format&fit=crop&q=80`;

// Real curated product photos
const productImagesMap = {
  "Royal California Almonds": [
    unsplash("photo-1508061253366-f7da158b6d46"),
    unsplash("photo-1623428187969-5da2dcea5ebf"),
    unsplash("photo-1574570068036-e8838d7301c2")
  ],
  "Jumbo King Cashew Nuts (W180)": [
    unsplash("photo-1509358271058-acd22cc93898"),
    unsplash("photo-1563227812-0ea4c22e6cc8"),
    unsplash("photo-1536591375315-1b8384918e69")
  ],
  "Roasted Salted Iranian Pistachios": [
    unsplash("photo-1615485290382-441e4d049cb5"),
    unsplash("photo-1563453392212-326f5e854473"),
    unsplash("photo-1514733670139-4d87a1941d55")
  ],
  "Kashmiri Walnut Kernels (Akhrot)": [
    unsplash("photo-1564759298125-eec32b9049d5"),
    unsplash("photo-1564758564527-b97d79cb27c1"),
    unsplash("photo-1589135233689-d56d25242787")
  ],
  "Roasted Macadamia Nuts": [
    unsplash("photo-1596704017254-9b121068fb31"),
    unsplash("photo-1508061253366-f7da158b6d46"),
    unsplash("photo-1623428187969-5da2dcea5ebf")
  ],
  "Medjool Royal King Dates": [
    unsplash("photo-1584308666744-24d5c474f2ae"),
    unsplash("photo-1596560548464-f010549b84d7"),
    unsplash("photo-1606851094655-b2593a9af63f")
  ],
  "Afghan Dried Anjeer (Figs)": [
    unsplash("photo-1601493700631-2b16ec4b4716"),
    unsplash("photo-1585849834908-3481231155e8"),
    unsplash("photo-1502741224143-90386d7f8c82")
  ],
  "Turkish Golden Dried Apricots": [
    unsplash("photo-1595231776515-ddffb1f4eb73"),
    unsplash("photo-1595231776506-6c84c310464f"),
    unsplash("photo-1598965675045-45c5e72c7d05")
  ],
  "Long Green Kishmish (Raisins)": [
    unsplash("photo-1597714026920-d3e9c5e3f421"),
    unsplash("photo-1601004890684-d8cbf643f5f2"),
    unsplash("photo-1608686207856-001b95cf60ca")
  ],
  "Black Seedless Raisins": [
    unsplash("photo-1534080564583-6be75777b70a"),
    unsplash("photo-1597714026920-d3e9c5e3f421"),
    unsplash("photo-1584308666744-24d5c474f2ae")
  ],
  "Organic Raw Black Chia Seeds": [
    unsplash("photo-1508737604134-2e9a3b610c1e"),
    unsplash("photo-1514733670139-4d87a1941d55"),
    unsplash("photo-1584308666744-24d5c474f2ae")
  ],
  "Roasted Crunchy Pumpkin Seeds": [
    unsplash("photo-1596704017254-9b121068fb31"),
    unsplash("photo-1574570068036-e8838d7301c2"),
    unsplash("photo-1608686207856-001b95cf60ca")
  ],
  "Raw Golden Flax Seeds": [
    unsplash("photo-1508737604134-2e9a3b610c1e"),
    unsplash("photo-1514733670139-4d87a1941d55"),
    unsplash("photo-1596704017254-9b121068fb31")
  ],
  "Shelled Raw Sunflower Seeds": [
    unsplash("photo-1596704017254-9b121068fb31"),
    unsplash("photo-1574570068036-e8838d7301c2"),
    unsplash("photo-1508061253366-f7da158b6d46")
  ],
  "Watermelon & Muskmelon Seed Blend": [
    unsplash("photo-1596704017254-9b121068fb31"),
    unsplash("photo-1508061253366-f7da158b6d46"),
    unsplash("photo-1574570068036-e8838d7301c2")
  ],
  "Bold Green Cardamom (Elaichi 8mm+)": [
    unsplash("photo-1615485290382-441e4d049cb5"),
    unsplash("photo-1596040033229-a9821ebd058d"),
    unsplash("photo-1509358271058-acd22cc93898")
  ],
  "Ceylon True Cinnamon Quills": [
    unsplash("photo-1509358271058-acd22cc93898"),
    unsplash("photo-1514733670139-4d87a1941d55"),
    unsplash("photo-1596040033229-a9821ebd058d")
  ],
  "Malabar Tellicherry Black Pepper": [
    unsplash("photo-1596040033229-a9821ebd058d"),
    unsplash("photo-1509358271058-acd22cc93898"),
    unsplash("photo-1514733670139-4d87a1941d55")
  ],
  "Star Anise & Aromatic Cloves": [
    unsplash("photo-1596040033229-a9821ebd058d"),
    unsplash("photo-1514733670139-4d87a1941d55"),
    unsplash("photo-1509358271058-acd22cc93898")
  ],
  "Pure Kashmiri Mongra Saffron (Kesar)": [
    unsplash("photo-1596040033229-a9821ebd058d"),
    unsplash("photo-1514733670139-4d87a1941d55"),
    unsplash("photo-1509358271058-acd22cc93898")
  ],
  "Dried Whole Sweet Cranberries": [
    unsplash("photo-1534080564583-6be75777b70a"),
    unsplash("photo-1584308666744-24d5c474f2ae"),
    unsplash("photo-1595231776515-ddffb1f4eb73")
  ],
  "Wild Dried Blueberries": [
    unsplash("photo-1498557850523-fd3d118b962e"),
    unsplash("photo-1534080564583-6be75777b70a"),
    unsplash("photo-1584308666744-24d5c474f2ae")
  ],
  "7-in-1 Daily Superfood Trail Mix": [
    unsplash("photo-1584308666744-24d5c474f2ae"),
    unsplash("photo-1508061253366-f7da158b6d46"),
    unsplash("photo-1574570068036-e8838d7301c2")
  ],
  "Himalayan Dried Goji Berries": [
    unsplash("photo-1534080564583-6be75777b70a"),
    unsplash("photo-1595231776515-ddffb1f4eb73"),
    unsplash("photo-1584308666744-24d5c474f2ae")
  ],
  "Berry Nutty Energy Crunch Blend": [
    unsplash("photo-1584308666744-24d5c474f2ae"),
    unsplash("photo-1508061253366-f7da158b6d46"),
    unsplash("photo-1574570068036-e8838d7301c2")
  ]
};

const brandImagesMap = {
  "DryDelicious Premium": unsplash("photo-1542838132-92c53300491e"),
  "NutriGold": unsplash("photo-1505740420928-5e560c06d30e"),
  "Organic Harvest": unsplash("photo-1546069901-ba9599a7e63c"),
  "Nature's Best": unsplash("photo-1498837167922-ddd27525d352"),
  "Royal Dry Fruits": unsplash("photo-1504674900247-0877df9cc836")
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function run() {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // 1. Process Products
    console.log("\n--- Downloading & Updating Product Images ---");
    for (const [prodName, urls] of Object.entries(productImagesMap)) {
      const slug = slugify(prodName);
      const savedFilenames = [];

      for (let i = 0; i < urls.length; i++) {
        const filename = `prod_${slug}_${i + 1}.jpg`;
        const destPath = path.join(uploadsDir, filename);
        try {
          await downloadImage(urls[i], destPath);
          savedFilenames.push(filename);
        } catch (err) {
          console.error(`Error downloading ${filename}:`, err.message);
        }
      }

      if (savedFilenames.length > 0) {
        const res = await Product.updateOne(
          { productname: prodName },
          { $set: { productImage: savedFilenames } }
        );
        console.log(`✓ Updated [${prodName}] with ${savedFilenames.length} images.`);
      }
    }

    // 2. Process Brands
    console.log("\n--- Downloading & Updating Brand Images ---");
    for (const [brandName, url] of Object.entries(brandImagesMap)) {
      const slug = slugify(brandName);
      const filename = `brand_${slug}.jpg`;
      const destPath = path.join(uploadsDir, filename);

      try {
        await downloadImage(url, destPath);
        await Brand.updateOne(
          { brandname: brandName },
          { $set: { image: filename } }
        );
        console.log(`✓ Updated Brand [${brandName}] with image: ${filename}`);
      } catch (err) {
        console.error(`Error downloading brand image for ${brandName}:`, err.message);
      }
    }

    console.log("\nAll images successfully downloaded and assigned!");
  } catch (error) {
    console.error("Execution error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

run();
