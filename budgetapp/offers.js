const express = require("express");
const router = express.Router();

// Ruta pentru ofertele personalizate
router.get("/", (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('<h1>Nu ești autentificat!</h1><a href="/login">Login</a>');
    }

    const user = req.session.user; // Obține detaliile utilizatorului logat din sesiune

    if (!user.promotions || user.promotions.length === 0) {
        return res.send("<h1>Nu există oferte personalizate disponibile.</h1>");
    }

    // Construiește lista de oferte personalizate
    let promotionsHtml = "<h1>Oferte Personalizate</h1>";
    user.promotions.forEach(promotion => {
        promotionsHtml += `
            <div>
                <h2>${promotion.promotion_name}</h2>
                <p>${promotion.details}</p>
            </div>
        `;
    });

    // Adaugă buton de întoarcere
    promotionsHtml += `
        <form action="/" method="get">
            <button type="submit">Înapoi la pagina principală</button>
        </form>
    `;

    res.send(promotionsHtml);
});

module.exports = router;
