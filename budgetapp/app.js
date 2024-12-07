const express = require('express');
const app = express();
const port = 3000;


const loginRoutes = require('./login'); 
const { getData } = require('./accounts');

app.use('/login', loginRoutes);

app.get('/', (req, res) => {
    const data = getData();

    if (!data || data.length === 0) {
        return res.send('Datele nu sunt încă încărcate. Încearcă din nou mai târziu.');
    }

    let emailList = '<h1>Lista email-urilor:</h1>';
    data.forEach(user => {
        emailList += `<p>${user.account.email}</p>`;
    });

    const products = data[0].receipts[0].products;
    let productList = '<h1>Produse din primul bon:</h1>';
    products.forEach(product => {
        productList += `<p>Produs: ${product.produs}, Preț: ${product.pret}</p>`;
    });

    res.send(emailList + productList);
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});