const express = require("express");
const router = express.Router();
const generalPromotions = require("./general_offers.json"); // Importă fișierul JSON

router.get("/", (req, res) => {
    let promotionsHtml = "<h1>Promoții Generale</h1>";
    generalPromotions.promotions.forEach(promotion => {
        promotionsHtml += `
            <div>
                <h2>${promotion.promotion_name}</h2>
                <p>${promotion.details}</p>
            </div>
        `;
    });

    promotionsHtml += `
        <form action="/" method="get">
            <button type="submit">Înapoi la pagina principală</button>
        </form>
    `;

    res.send(promotionsHtml);
});

module.exports = router;
