const express = require('express');
const router = express.Router();
const path = require('path');

// Ruta principală pentru pagina de profil
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    res.sendFile(path.join(__dirname, 'profile.html'));
});

// API endpoint pentru datele profilului
router.get('/data', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Nu ești autentificat!" });
    }

    const { email, card_id } = req.session.user.account;
    res.json({ email, card_id });
});

// Ruta pentru logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Eroare</title>
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
                        h1 { color: #e31837; }
                        a {
                            color: #1a1a1a;
                            text-decoration: none;
                            padding: 10px 20px;
                            background: #e0e0e0;
                            border-radius: 5px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <h1>Eroare la deconectare!</h1>
                    <a href="/">Înapoi la pagina principală</a>
                </body>
                </html>
            `);
        }
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Deconectare reușită</title>
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
                    h1 { color: #e31837; }
                    a {
                        color: white;
                        text-decoration: none;
                        padding: 10px 20px;
                        background: #e31837;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    a:hover { background: #b31229; }
                </style>
            </head>
            <body>
                <h1>Te-ai deconectat cu succes!</h1>
                <a href="/login">Autentificare</a>
            </body>
            </html>
        `);
    });
});

module.exports = router;