const express = require('express');
const router = express.Router();

// Endpoint pentru afișarea profilului utilizatorului logat
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('<h1>Nu ești autentificat!</h1><a href="/login">Login</a>');
    }

    const { email, card_id } = req.session.user.account;

    // Afișează detaliile utilizatorului logat
    res.send(`
        <h1>Profil utilizator</h1>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>ID Card:</strong> ${card_id}</p>
        <a href="/profile/logout">Logout</a>
    `);
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('<h1>Eroare la delogare!</h1>');
        }
        res.send('<h1>Te-ai delogat cu succes!</h1><a href="/login">Login</a>');
    });
});

module.exports = router;
