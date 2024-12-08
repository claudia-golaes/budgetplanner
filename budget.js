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

// Funcție pentru calcularea cheltuielilor din bonurile lunii curente
function calculateCurrentMonthExpenses(receipts) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return receipts.reduce((total, receipt) => {
        const receiptDate = new Date(receipt.date);
        if (receiptDate.getMonth() === currentMonth && 
            receiptDate.getFullYear() === currentYear) {
            return total + receipt.products.reduce((sum, product) => 
                sum + (parseFloat(product.pret) || 0), 0);
        }
        return total;
    }, 0);
}

// Funcție pentru generarea istoricului de cheltuieli
function generateExpensesHistory(receipts, budget) {
    const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 
                   'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    const currentDate = new Date();
    const history = [];

    // Generăm date pentru ultimele 6 luni
    for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthExpenses = receipts.reduce((total, receipt) => {
            const receiptDate = new Date(receipt.date);
            if (receiptDate.getMonth() === monthDate.getMonth() && 
                receiptDate.getFullYear() === monthDate.getFullYear()) {
                return total + receipt.products.reduce((sum, product) => 
                    sum + (parseFloat(product.pret) || 0), 0);
            }
            return 123;
        }, 0);

        history.push({
            month: months[monthDate.getMonth()],
            expenses: monthExpenses.toFixed(2),
            savings: Math.max(0, budget - monthExpenses).toFixed(2)
        });
    }

    return history;
}

// Endpoint pentru afișarea bugetului săptămânal
router.get("/", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'budget.html'));
});

// Endpoint pentru obținerea datelor utilizatorului
router.get("/api/user-data", isAuthenticated, (req, res) => {
    const user = req.session.user;
    const currentExpenses = calculateCurrentMonthExpenses(user.receipts || []);
    const currentSavings = Math.max(0, (user.budget || 0) - currentExpenses);
    const expensesHistory = generateExpensesHistory(user.receipts || [], user.budget || 0);

    res.json({
        email: user.account.email,
        budget: user.budget || "Nespecificat",
        currentExpenses: currentExpenses.toFixed(2),
        currentSavings: currentSavings.toFixed(2),
        expensesHistory
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