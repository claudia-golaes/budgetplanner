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
    const cheaperProduct = products[index]; // Assumes the cheaper product index is passed
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


// Render the shopping list dashboard
router.get("/shopping-list", (req, res) => {
    res.sendFile(path.join(__dirname, 'shopping-list.html'));
});

// Get shopping list data
router.get("/api/shopping-list/data", (req, res) => {
    if (!req.session.shoppingList) {
        req.session.shoppingList = [];
    }
    const shoppingList = req.session.shoppingList;
    const products = getProducts();
    const newBudget = req.session.user.newBudget || req.session.user.budget || "Nespecificat";

    res.json({
        shoppingList,
        products,
        budget: newBudget
    });
});

// Remove a product from the shopping list
router.post("/shopping-list/remove", express.json(), (req, res) => {
    const { index } = req.body;

    if (req.session.shoppingList && req.session.shoppingList[index]) {
        const product = req.session.shoppingList[index];

        // Decrement the quantity if greater than 1, otherwise remove the item
        if (product.quantity > 1) {
            product.quantity -= 1;
        } else {
            req.session.shoppingList.splice(index, 1);
        }

        // Update the budget by adding the cost of the removed product
        req.session.user.newBudget =
            parseFloat(req.session.user.newBudget) + parseFloat(product.pret);

        res.sendStatus(200);
    }
});

module.exports = router;