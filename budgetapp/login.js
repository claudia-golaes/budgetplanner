const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const { getData } = require('./accounts'); // Importă datele

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get('/', (req, res) => {
    res.send(`
        <h1>Login</h1>
        <form method="POST" action="/login">
            <label>Email:</label><br>
            <input type="email" name="email" required><br><br>
            <label>Parolă:</label><br>
            <input type="password" name="password" required><br><br>
            <button type="submit">Login</button>
        </form>
    `);
});

router.post('/', (req, res) => {
    const data = getData();

    if (!data || data.length === 0) {
        return res.status(500).send('Datele nu sunt încă încărcate. Încearcă din nou mai târziu.');
    }

    const { email, password } = req.body;

    const user = data.find(user => user.account.email === email && user.account.password === password);

    if (user) {
        res.send(`<h1>Bun venit, ${email}!</h1>`);
    } else {
        res.status(401).send('<h1>Email sau parolă incorecte!</h1>');
    }
});

module.exports = router;
