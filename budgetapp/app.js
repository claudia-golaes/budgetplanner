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
const actualShoppingListRoutes = require("./actualShoppingList");

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

// Middleware pentru servirea fișierelor statice
app.use(express.static(__dirname));

// Rutele aplicației
app.use("/login", loginRoutes);
app.use(shoppingListRoutes);
app.use("/profile", profileRoutes);
app.use("/offers", offersRoutes);
app.use("/general-offers", generalOffersRoutes);
app.use("/budget", budgetRoutes);
app.use("/leftovers", recognizeRecipesRoutes);
app.use(actualShoppingListRoutes);

// Ruta pentru jocul Memory
app.get("/memory-game", (req, res) => {
    res.sendFile(path.join(__dirname, "memory.html")); // Servește fișierul HTML pentru joc
});

// Redirecționează pagina principală către /login
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Pornirea serverului
app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
