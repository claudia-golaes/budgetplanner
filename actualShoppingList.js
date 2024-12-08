const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Load products dynamically from the JSON file
const getProducts = () => {
  const productsPath = path.join(__dirname, "products.json");
  const productsData = fs.readFileSync(productsPath, "utf-8");
  return JSON.parse(productsData);
};

// Functions for preferences management
const getUserPreferences = (userId) => {
  try {
    const preferencesPath = path.join(__dirname, "userPreferences.json");
    if (!fs.existsSync(preferencesPath)) {
      return {};
    }
    const preferencesData = fs.readFileSync(preferencesPath, "utf-8");
    const preferences = JSON.parse(preferencesData);
    return preferences[userId] || {};
  } catch (error) {
    console.error("Error loading preferences:", error);
    return {};
  }
};

const saveUserPreferences = (userId, preferences) => {
  try {
    const preferencesPath = path.join(__dirname, "userPreferences.json");
    let allPreferences = {};
    if (fs.existsSync(preferencesPath)) {
      allPreferences = JSON.parse(fs.readFileSync(preferencesPath, "utf-8"));
    }
    allPreferences[userId] = preferences;
    fs.writeFileSync(preferencesPath, JSON.stringify(allPreferences, null, 2));
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
};

const analyzePurchasePatterns = (shoppingHistory) => {
  const patterns = {};
  
  shoppingHistory.forEach(purchase => {
    const purchaseDate = new Date(purchase.date);
    purchase.items.forEach(item => {
      if (!patterns[item.produs]) {
        patterns[item.produs] = {
          frequency: [],
          lastPurchase: purchaseDate,
          averageQuantity: 0,
          totalPurchases: 0
        };
      }
      
      const pattern = patterns[item.produs];
      if (pattern.lastPurchase) {
        const daysSinceLastPurchase = 
          (purchaseDate - pattern.lastPurchase) / (1000 * 60 * 60 * 24);
        pattern.frequency.push(daysSinceLastPurchase);
      }
      
      pattern.lastPurchase = purchaseDate;
      pattern.totalPurchases++;
      pattern.averageQuantity = 
        ((pattern.averageQuantity * (pattern.totalPurchases - 1)) + item.quantity) 
        / pattern.totalPurchases;
    });
  });
  
  return patterns;
};

const generateSuggestions = (patterns, currentDate) => {
  const suggestions = [];
  
  Object.entries(patterns).forEach(([product, pattern]) => {
    if (pattern.frequency.length > 0) {
      const avgFrequency = 
        pattern.frequency.reduce((a, b) => a + b, 0) / pattern.frequency.length;
      
      const daysSinceLastPurchase = 
        (currentDate - pattern.lastPurchase) / (1000 * 60 * 60 * 24);
        
      if (daysSinceLastPurchase >= avgFrequency) {
        suggestions.push({
          product,
          message: `Cumpărați ${product} în medie la fiecare ${Math.round(avgFrequency)} zile. 
                   Ultima achiziție a fost acum ${Math.round(daysSinceLastPurchase)} zile. 
                   Doriți să adăugați în listă?`,
          quantity: Math.round(pattern.averageQuantity)
        });
      }
    }
  });
  
  return suggestions;
};

// Middleware to check authentication
router.use((req, res, next) => {
  if (!req.session.user) {
    return res
      .status(401)
      .send('<h1>Nu ești autentificat!</h1><a href="/login">Login</a>');
  }
  next();
});

// Add a product to the shopping list
router.post("/shopping-list/add", express.json(), (req, res) => {
  const { index, switchToCheaper, declinedSwitch } = req.body;
  const products = getProducts();
  const product = products[index];

  if (!product) {
    return res.status(400).send("Produsul nu există.");
  }

  req.session.shoppingList = req.session.shoppingList || [];
  req.session.user.newBudget = req.session.user.newBudget || req.session.user.budget;

  const productCost = parseFloat(product.pret);

  // Handle when the user explicitly declines the switch
  if (declinedSwitch) {
    const existingProduct = req.session.shoppingList.find(
      (item) => item.produs === product.produs
    );

    if (existingProduct) {
      existingProduct.quantity = (existingProduct.quantity || 1) + 1;
    } else {
      req.session.shoppingList.push({ ...product, quantity: 1 });
    }

    req.session.user.newBudget -= productCost;
    return res.sendStatus(200);
  }

  // Handle when the user explicitly agrees to switch to a cheaper product
  if (switchToCheaper) {
    const cheaperProduct = products[index];
    req.session.shoppingList.push({ ...cheaperProduct, quantity: 1 });
    req.session.user.newBudget -= parseFloat(cheaperProduct.pret);
    return res.sendStatus(200);
  }

  // Default case: Checking for cheaper products of the same type
  const cheaperProduct = products
    .filter((p) => p.type === product.type && parseFloat(p.pret) < productCost)
    .sort((a, b) => parseFloat(a.pret) - parseFloat(b.pret))[0];

  if (cheaperProduct) {
    return res.status(200).json({
      message: `Există un produs mai ieftin din același tip: ${cheaperProduct.produs} - ${cheaperProduct.pret} RON. Doriți să faceți switch?`,
      cheaperProduct: {
        produs: cheaperProduct.produs,
        pret: cheaperProduct.pret,
        index: products.indexOf(cheaperProduct),
      },
    });
  }

  // If no cheaper product, add the original product
  const existingProduct = req.session.shoppingList.find(
    (item) => item.produs === product.produs
  );

  if (existingProduct) {
    existingProduct.quantity = (existingProduct.quantity || 1) + 1;
  } else {
    req.session.shoppingList.push({ ...product, quantity: 1 });
  }

  req.session.user.newBudget -= productCost;
  res.sendStatus(200);
});

// Get suggestions based on purchase history
router.get("/api/shopping-list/suggestions", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Nu sunteți autentificat" });
  }

  const userId = req.session.user.id;
  const preferences = getUserPreferences(userId);
  const suggestions = generateSuggestions(
    analyzePurchasePatterns(preferences.shoppingHistory || []),
    new Date()
  );

  res.json({ suggestions });
});

// Save completed shopping list to history
router.post("/api/shopping-list/complete", express.json(), (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Nu sunteți autentificat" });
  }

  const userId = req.session.user.id;
  const preferences = getUserPreferences(userId);
  
  preferences.shoppingHistory = preferences.shoppingHistory || [];
  preferences.shoppingHistory.push({
    date: new Date(),
    items: req.session.shoppingList || []
  });
  
  saveUserPreferences(userId, preferences);
  req.session.shoppingList = []; // Clear current shopping list
  req.session.user.newBudget = req.session.user.budget; // Reset budget
  
  res.sendStatus(200);
});

// Render the shopping list dashboard
router.get("/shopping-list", (req, res) => {
  res.sendFile(path.join(__dirname, 'shopping-list.html'));
});

// Get shopping list data including suggestions
router.get("/api/shopping-list/data", (req, res) => {
  if (!req.session.shoppingList) {
    req.session.shoppingList = [];
  }
  const shoppingList = req.session.shoppingList;
  const products = getProducts();
  const newBudget = req.session.user.newBudget || req.session.user.budget || "Nespecificat";

  // Get suggestions if user is authenticated
  let suggestions = [];
  if (req.session.user && req.session.user.id) {
    const preferences = getUserPreferences(req.session.user.id);
    suggestions = generateSuggestions(
      analyzePurchasePatterns(preferences.shoppingHistory || []),
      new Date()
    );
  }

  res.json({
    shoppingList,
    products,
    budget: newBudget,
    suggestions
  });
});

// Remove a product from the shopping list
router.post("/shopping-list/remove", express.json(), (req, res) => {
  const { index } = req.body;

  if (req.session.shoppingList && req.session.shoppingList[index]) {
    const product = req.session.shoppingList[index];

    if (product.quantity > 1) {
      product.quantity -= 1;
    } else {
      req.session.shoppingList.splice(index, 1);
    }

    req.session.user.newBudget =
      parseFloat(req.session.user.newBudget) + parseFloat(product.pret);

    res.sendStatus(200);
  }
});

module.exports = router;