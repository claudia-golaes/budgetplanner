const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');
const generalPromotions = require("./general_offers.json");

router.get("/", (req, res) => {
    // Read the HTML template
    const template = fs.readFileSync(path.join(__dirname, 'general_offers.html'), 'utf8');
    
    // Generate promotions HTML
    let promotionsHTML = '';
    generalPromotions.promotions.forEach(promotion => {
        promotionsHTML += `
            <div class="promotion-card">
                <h2>
                    <i class="fas fa-percent"></i>
                    ${promotion.promotion_name}
                </h2>
                <p>${promotion.details}</p>
            </div>
        `;
    });

    // Replace placeholder in template with actual promotions
    const finalHTML = template.replace('<!--PROMOTIONS_PLACEHOLDER-->', promotionsHTML);
    
    res.send(finalHTML);
});

module.exports = router;