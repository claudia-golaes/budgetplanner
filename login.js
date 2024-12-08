const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const router = express.Router();

const { getData } = require('./accounts'); // Importă datele

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.use(session({
    secret: 'secret-key', // Înlocuiește cu o cheie puternică în producție
    resave: false,
    saveUninitialized: true
}));

// Serve static HTML file
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

router.post('/', (req, res) => {
    const data = getData();

    if (!data || data.length === 0) {
        return res.status(500).send('Datele nu sunt încă încărcate. Încearcă din nou mai târziu.');
    }

    const { email, password } = req.body;

    const user = data.find(user => user.account.email === email && user.account.password === password);

    if (user) {
        req.session.user = user;
        res.redirect('/');
    } else {
        res.status(401).send('<h1>Email sau parolă incorecte!</h1>');
    }
});

module.exports = router;
