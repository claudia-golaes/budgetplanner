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
    const { index, switchToCheaper } = req.body;
    const products = getProducts();
    const product = products[index];
  
    if (!product) {
      return res.status(400).send("Produsul nu există.");
    }
  
    req.session.shoppingList = req.session.shoppingList || [];
  
    // Check if we are switching to a cheaper product
    if (switchToCheaper) {
      const cheaperProduct = products[index];
  
      // Add the cheaper product to the shopping list
      req.session.shoppingList.push({ ...cheaperProduct, quantity: 1 });
  
      // Update the budget
      const productCost = parseFloat(cheaperProduct.pret);
      req.session.user.newBudget -= productCost;
  
      // Stop further execution and send success response
      return res.sendStatus(200);
    }
  
    // Check if the product already exists in the shopping list
    const existingProduct = req.session.shoppingList.find(
      (item) => item.produs === product.produs
    );
  
    req.session.user.newBudget =
            req.session.user.newBudget || req.session.user.budget; 
  
    // Update the budget by subtracting the cost of the added product
    
    const productCost = parseFloat(product.pret);

    // Check for cheaper products of the same type
    const cheaperProduct = products
      .filter((p) => p.type === product.type && parseFloat(p.pret) < productCost)
      .sort((a, b) => parseFloat(a.pret) - parseFloat(b.pret))[0];
    if (cheaperProduct) {
      // Notify the user about the cheaper product
      
      return res.status(200).json({
        message: `Există un produs mai ieftin din același tip: ${cheaperProduct.produs} - ${cheaperProduct.pret} RON. Doriți să faceți switch?`,
        cheaperProduct: {
          produs: cheaperProduct.produs,
          pret: cheaperProduct.pret,
          index: products.indexOf(cheaperProduct),
        },
      });

      
    } else{
        if (existingProduct) {
            // If the product exists, increment its quantity
            existingProduct.quantity = (existingProduct.quantity || 1) + 1;
          } else {
            // If the product doesn't exist, add it with a quantity of 1
            req.session.shoppingList.push({ ...product, quantity: 1 });
          }
          req.session.user.newBudget -= productCost;
    }
  
    res.sendStatus(200);
  });
  

// Render the shopping list dashboard
router.get("/shopping-list", (req, res) => {
  if (!req.session.shoppingList) {
    req.session.shoppingList = []; // Initialize shopping list
  }

  const shoppingList = req.session.shoppingList;
  const products = getProducts(); // Function to get the product list
  const newBudget =
    req.session.user.newBudget || req.session.user.budget || "Nespecificat"; // Get the new or original budget

  res.send(`
        <h1>Shopping List Dashboard</h1>
        <p><strong>Buget curent:</strong> ${newBudget} RON</p>
        <div style="display: flex; justify-content: space-between;">
            <!-- Current Shopping List -->
            <div style="width: 45%; padding: 10px; border: 1px solid #ccc;">
                <h2>Current Shopping List</h2>
                <ul id="shoppingList">
                    ${shoppingList
                      .map(
                        (item, index) => `
                        <li>
                            ${item.produs} - ${item.pret} RON 
                            (x${item.quantity || 1}) 
                            <button onclick="removeFromShoppingList(${index})">Remove</button>
                        </li>
                    `
                      )
                      .join("")}
                </ul>
                ${
                  shoppingList.length === 0
                    ? "<p>Your shopping list is empty.</p>"
                    : ""
                }
            </div>

            <!-- Product Catalog -->
            <div style="width: 45%; padding: 10px; border: 1px solid #ccc;">
                <h2>Product Catalog</h2>
                <input 
                    type="text" 
                    id="searchBar" 
                    placeholder="Search products..." 
                    style="width: 100%; padding: 5px; margin-bottom: 10px;" 
                    onkeyup="filterProducts()"
                >
                <ul id="productList">
                    ${products
                      .map(
                        (product, index) => `
                        <li class="product-item">
                            ${product.produs} - ${product.pret} RON
                            <button onclick="addToShoppingList(${index})">Add</button>
                        </li>
                    `
                      )
                      .join("")}
                </ul>
            </div>
        </div>
        
        <!-- Toggle Product Catalog Button -->
        <button style="margin-top: 20px;" onclick="toggleCatalog()">Toggle Product Catalog</button>

        <script>
    // Toggle visibility of the product catalog
    function toggleCatalog() {
        const catalog = document.getElementById('productList');
        if (catalog.style.display === 'none') {
            catalog.style.display = 'block';
        } else {
            catalog.style.display = 'none';
        }
    }

    // Add a product to the shopping list
    function addToShoppingList(index, switchToCheaper = false) {
    fetch('/shopping-list/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, switchToCheaper }),
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Server error");
            }
        })
        .then(data => {
            if (data.cheaperProduct) {
                if (confirm(data.message)) {
                    // If the user confirms, add the cheaper product
                    addToShoppingList(data.cheaperProduct.index, true);
                }
            } else {
                location.reload();
            }
        })
        .catch(error => {
            console.error("Error:", error);
            location.reload();
        });
}


    // Remove a product from the shopping list
    function removeFromShoppingList(index) {
        fetch('/shopping-list/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index }),
        }).then(() => location.reload());
    }

    // Filter products in the product catalog
    function filterProducts() {
        const searchInput = document.getElementById('searchBar').value.toLowerCase();
        const productItems = document.querySelectorAll('.product-item');
        productItems.forEach(item => {
            const productName = item.textContent.toLowerCase();
            if (productName.includes(searchInput)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
</script>

    `);
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
