const express = require("express");
const session = require("express-session");
const path = require("path"); // Pentru a gestiona căi de fișiere
const app = express();
const port = 3000;

// Importă rutele existente
const loginRoutes = require("./login");
const profileRoutes = require("./profile");
const shoppingListRoutes = require("./shoppingList");
const { getData } = require("./accounts");
const offersRoutes = require("./offers");
const generalOffersRoutes = require("./general_offers");
const budgetRoutes = require("./budget"); // Importă ruta bugetului
const recognizeRecipesRoutes = require("./leftovers"); // Importă ruta pentru recunoaștere


app.use(express.urlencoded({ extended: true })); // Middleware pentru formulare
app.use(express.json());
const actualShoppingListRoutes = require("./actualShoppingList");




const actualShoppingListRoutes = require("./actualShoppingList");


// Middleware pentru sesiuni
app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: true,
    })
);

// Middleware pentru servirea fișierelor statice (în cazul în care mai sunt alte resurse CSS/JS de accesat)
app.use(express.static(__dirname));
// Rutele pentru login
app.use("/login", loginRoutes);
// Rutele pentru lista de cumpărături
app.use(shoppingListRoutes);
// Rutele pentru profil
app.use("/profile", profileRoutes);
// Ruta pentru oferte
app.use("/offers", offersRoutes);
app.use("/general-offers", generalOffersRoutes);
app.use("/budget", budgetRoutes);
app.use("/leftovers", recognizeRecipesRoutes); // Înregistrează ruta în Express



app.use(actualShoppingListRoutes);

// Ruta pentru jocul Memory
app.get("/memory-game", (req, res) => {
    res.sendFile(path.join(__dirname, "memory.html")); // Servește fișierul HTML pentru joc
});

// Endpoint principal
app.get("/", (req, res) => {
    const data = getData();

    if (!data || data.length === 0) {
        return res.send(
            "Datele nu sunt încă încărcate. Încearcă din nou mai târziu."
        );
    }

    if (!req.session.user) {
        const loginButton = `
            <form action="/login" method="get">
                <button type="submit">Login</button>
            </form>
        `;
        return res.send(`
            <h1>Bine ai venit!</h1>
            <p>Te rugăm să te autentifici pentru a vedea notificările.</p>
            ${loginButton}
        `);
    }

    const loggedInUser = req.session.user.account.email;

    // Găsim utilizatorul curent în date
    const userData = data.find(user => user.account.email === loggedInUser);

    if (!userData) {
        return res.send(`
            <h1>Eroare!</h1>
            <p>Nu am găsit date pentru utilizatorul logat.</p>
        `);
    }

    // Verificăm produsele utilizatorului logat care expiră în curând
    let expiringProducts = [];
    userData.receipts.forEach(receipt => {
        receipt.products.forEach(product => {
            const remainingDays = product.valability - receipt.days;
    
            // Verificăm dacă produsul este expirat sau expiră în curând
            if (remainingDays <= 3) {
                expiringProducts.push({
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
    
    // Generăm notificările pentru utilizatorul logat
    const notifications = expiringProducts.map(product => `
        <div style="border: 1px solid ${product.status.includes("expirat") ? "darkred" : "orange"}; padding: 10px; margin-bottom: 10px;">
            <h3>${product.status.includes("expirat") ? "Produs expirat!" : "Produs care expiră curând!"}</h3>
            <p><strong>${product.produs}</strong> (${product.type})</p>
            <p>Preț: ${product.pret} RON</p>
            <p>${product.status}</p>
        </div>
    `).join("");
    

    const welcomeMessage = `<h2>Bun venit, ${loggedInUser}!</h2>`;
    res.send(`
        ${welcomeMessage}
        ${notifications || "<p>Nu există produse care să expire în curând.</p>"}
    `);
});


// Pornirea serverului
app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
