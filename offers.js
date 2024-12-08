const express = require("express");
const router = express.Router();
const path = require("path");

// Ruta principală pentru pagina de oferte
router.get("/", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    
    res.sendFile(path.join(__dirname, "offers.html"));
});

// Ruta pentru datele ofertelor (acum este corect înregistrată)
router.get("/data", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Nu ești autentificat!" });
    }

    const user = req.session.user;
    res.json({
        promotions: user.promotions || []
    });
});

module.exports = router;