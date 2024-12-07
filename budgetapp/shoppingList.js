const express = require("express");
const router = express.Router();

// Endpoint pentru lista de cumpărături
router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('<h1>Nu ești autentificat!</h1><a href="/login">Login</a>');
    }

    // Afișează lista de cumpărături a utilizatorului autentificat
    const user = req.session.user;
    let shoppingList = `<h1>Lista de cumpărături pentru ${user.account.email}</h1>`;
    user.receipts.forEach((receipt, index) => {
        shoppingList += `<h2>Bon #${index + 1}</h2>`;
        receipt.products.forEach(product => {
            shoppingList += `<p>Produs: ${product.produs}, Preț: ${product.pret}</p>`;
        });
    });

    res.send(shoppingList);
});

module.exports = router;
