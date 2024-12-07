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

app.use(express.urlencoded({ extended: true })); // Middleware pentru formulare
app.use(express.json());

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

    let emailList = "<h1>Lista email-urilor:</h1>";
    data.forEach((user) => {
        emailList += `<p>${user.account.email}</p>`;
    });

    const products = data[0].receipts[0].products;
    let productList = "<h1>Produse din primul bon:</h1>";
    products.forEach((product) => {
        productList += `<p>Produs: ${product.produs}, Preț: ${product.pret}</p>`;
    });

    if (req.session.user) {
        const welcomeMessage = `<h2>Bun venit, ${req.session.user.account.email}!</h2>`;
        res.send(welcomeMessage + emailList + productList);
    } else {
        const loginButton = `
            <form action="/login" method="get">
                <button type="submit">Login</button>
            </form>
        `;
        res.send(emailList + productList + loginButton);
    }
});

// Pornirea serverului
app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
