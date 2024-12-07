const express = require("express");
const router = express.Router();

// Middleware pentru verificarea autentificării
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Nu ești autentificat!" });
    }
    next();
}

// Endpoint pentru afișarea bugetului săptămânal
router.get("/", isAuthenticated, (req, res) => {
    const user = req.session.user;

    res.send(`
        <h1>Buget Săptămânal</h1>
        <p><strong>Email:</strong> ${user.account.email}</p>
        <p><strong>Buget curent:</strong> <span id="current-budget">${user.budget || "Nespecificat"}</span></p>
        <form id="budget-form">
            <label for="newBudget">Setează un buget nou:</label>
            <input type="number" id="newBudget" name="newBudget" required />
            <button type="button" onclick="updateBudget()">Actualizează</button>
        </form>
        <p id="update-message" style="color: green; display: none;">Bugetul a fost actualizat!</p>
        <a href="/">Înapoi la pagina principală</a>
        <script>
            async function updateBudget() {
                const newBudget = document.getElementById('newBudget').value;
                const message = document.getElementById('update-message');
                const currentBudget = document.getElementById('current-budget');
                
                const response = await fetch('/budget', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newBudget })
                });

                const result = await response.json();
                
                if (response.ok) {
                    currentBudget.textContent = result.budget;
                    message.style.display = 'block';
                    message.textContent = 'Bugetul a fost actualizat!';
                } else {
                    message.style.display = 'block';
                    message.textContent = result.error || 'A apărut o eroare.';
                }

                setTimeout(() => {
                    message.style.display = 'none';
                }, 3000);
            }
        </script>
    `);
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
