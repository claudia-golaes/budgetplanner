const express = require("express");
const router = express.Router();
const path = require("path");

// Servește fișierul HTML care conține interfața pentru recunoașterea produselor
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "recognizeRecipes.html")); // Servește pagina HTML
});

module.exports = router;
