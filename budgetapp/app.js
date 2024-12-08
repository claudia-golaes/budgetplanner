const express = require("express");
const session = require("express-session");
const path = require("path");
const app = express();
const port = 3000;

// Importă rutele existente
const loginRoutes = require("./login");
const profileRoutes = require("./profile");
const shoppingListRoutes = require("./shoppingList");
const { getData } = require("./accounts");
const offersRoutes = require("./offers");
const generalOffersRoutes = require("./general_offers");
const budgetRoutes = require("./budget");
const recognizeRecipesRoutes = require("./leftovers");
const actualShoppingListRoutes = require("./actualShoppingList");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));
app.use(session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
}));

// Rute
app.use("/login", loginRoutes);
app.use(shoppingListRoutes);
app.use("/profile", profileRoutes);
app.use("/offers", offersRoutes);
app.use("/general-offers", generalOffersRoutes);
app.use("/budget", budgetRoutes);
app.use("/leftovers", recognizeRecipesRoutes);
app.use(actualShoppingListRoutes);

// API endpoint pentru datele utilizatorului și notificări
app.get("/api/user-data", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Nu sunteți autentificat" });
    }

    const data = getData();
    const userData = data.find(user => user.account.email === req.session.user.account.email);
    
    if (!userData) {
        return res.status(404).json({ error: "Utilizatorul nu a fost găsit" });
    }

    // Calculează notificările pentru produsele care expiră
    let notifications = [];
    userData.receipts.forEach(receipt => {
        receipt.products.forEach(product => {
            const remainingDays = product.valability - receipt.days;
            if (remainingDays <= 3) {
                notifications.push({
                    produs: product.produs,
                    pret: product.pret,
                    type: product.type,
                    status: remainingDays < 0 
                        ? `Este expirat de ${-remainingDays} zile` 
                        : `Expiră în ${remainingDays} zile`
                });
            }
        });
    });

    res.json({
        email: userData.account.email,
        notifications: notifications,
        username: userData.account.username
    });
});

// Ruta pentru jocul Memory
app.get("/memory-game", (req, res) => {
    res.sendFile(path.join(__dirname, "memory.html"));
});

// Ruta principală
app.get("/", (req, res) => {
    const data = getData();

    if (!data || data.length === 0) {
        return res.send("Datele nu sunt încă încărcate. Încearcă din nou mai târziu.");
    }

    if (!req.session.user) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="ro">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>MegaImage - Welcome</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f5f5f5;
                    }
                    h1 {
                        color: #e31837;
                        margin-bottom: 1rem;
                    }
                    button {
                        background-color: #e31837;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 1rem;
                        margin-top: 1rem;
                    }
                    button:hover {
                        background-color: #b31229;
                    }
                </style>
            </head>
            <body>
                <h1>Bine ai venit!</h1>
                <p>Te rugăm să te autentifici pentru a vedea notificările.</p>
                <form action="/login" method="get">
                    <button type="submit">Login</button>
                </form>
            </body>
            </html>
        `);
    }

    // Servește pagina principală pentru utilizatorii autentificați
    res.sendFile(path.join(__dirname, "home.html"));
});

// Pornirea serverului
app.listen(port, () => {
    console.log(`Aplicația rulează la http://localhost:${port}`);
});