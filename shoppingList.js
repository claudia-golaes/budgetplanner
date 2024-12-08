const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const user = req.session.user;
    const htmlContent = fs.readFileSync(path.join(__dirname, "shoppingList.html"), "utf8");
    
    const htmlWithUser = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MegaImage - Listele tale de cumpărături</title>
            <script>
                window.user = ${JSON.stringify(user)};
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