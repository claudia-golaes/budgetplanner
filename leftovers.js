const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Funcție pentru a încărca produsele din products.json
const getProducts = () => {
    const productsPath = path.join(__dirname, "products.json");
    const productsData = fs.readFileSync(productsPath, "utf-8");
    return JSON.parse(productsData);
};

// IMPORTANT: Mutăm ruta pentru adăugare înaintea rutei pentru HTML
// pentru a evita conflictele de routing
router.post("/add-leftover", express.json(), (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "Nu ești autentificat" });
        }

        const { productName } = req.body;
        if (!productName) {
            return res.status(400).json({ error: "Numele produsului este necesar" });
        }

        const products = getProducts();
        const product = products.find(p => p.produs === productName);

        if (!product) {
            return res.status(404).json({ error: "Produsul nu a fost găsit" });
        }

        req.session.shoppingList = req.session.shoppingList || [];
        const existingProduct = req.session.shoppingList.find(
            item => item.produs === product.produs
        );

        if (existingProduct) {
            existingProduct.quantity = (existingProduct.quantity || 1) + 1;
        } else {
            req.session.shoppingList.push({ ...product, quantity: 1 });
        }

        req.session.user.newBudget = 
            (req.session.user.newBudget || req.session.user.budget) - parseFloat(product.pret);

        res.json({
            success: true,
            message: `${product.produs} a fost adăugat în lista de cumpărături`
        });
    } catch (error) {
        console.error("Error adding product to shopping list:", error);
        res.status(500).json({ error: "Eroare la adăugarea produsului în listă" });
    }
});

// Servește fișierul HTML
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "recognizeRecipes.html"));
});

module.exports = router;