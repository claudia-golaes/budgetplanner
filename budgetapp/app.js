const express = require("express");
const session = require("express-session");
const app = express();
const port = 3000;

const loginRoutes = require("./login");
const shoppingListRoutes = require("./shoppingList");
const profileRoutes = require('./profile');
const { getData } = require("./accounts");

// Middleware pentru sesiuni
app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: true,
    })
);

// Rutele pentru login
app.use("/login", loginRoutes);

// Rutele pentru lista de cumpărături
app.use(shoppingListRoutes);

app.use('/profile', profileRoutes);

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

    const loginButton = `
        <form action="/login" method="get">
            <button type="submit">Login</button>
        </form>
    `;

    res.send(emailList + productList + loginButton);
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
