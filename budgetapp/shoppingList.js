const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Endpoint pentru lista de cumpărături
router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send(`
            <h1>Nu ești autentificat!</h1>
            <a href="/login">Login</a>
        `);
    }

    const user = req.session.user; // User data from session

    // Read the HTML file and inject the user data
    const htmlContent = fs.readFileSync(path.join(__dirname, "shoppingList.html"), "utf8");
    const htmlWithUser = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Past Receipts</title>
            <script>
                window.user = ${JSON.stringify(user)}; // Inject user data
            </script>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>
    `;
    res.send(htmlWithUser);
});

module.exports = router;
