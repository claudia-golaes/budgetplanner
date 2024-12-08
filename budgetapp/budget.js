const express = require("express");
const router = express.Router();
const path = require("path");

// Middleware pentru verificarea autentificării
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Nu ești autentificat!" });
    }
    next();
}

// Endpoint pentru afișarea bugetului săptămânal
router.get("/", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'budget.html'));
});

// Endpoint pentru obținerea datelor utilizatorului
router.get("/api/user-data", isAuthenticated, (req, res) => {
    const user = req.session.user;
    res.json({
        email: user.account.email,
        budget: user.budget || "Nespecificat"
    });
});

// Endpoint pentru actualizarea bugetului săptămânal
router.post("/", isAuthenticated, (req, res) => {
    const { newBudget } = req.body;

    if (!newBudget || isNaN(newBudget)) {
        return res.status(400).json({ error: "Buget invalid!" });
    }

    req.session.user.budget = parseFloat(newBudget);

    res.json({ message: "Buget actualizat cu succes!", budget: req.session.user.budget });
});

module.exports = router;