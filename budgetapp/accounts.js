let jsonData = [];

const fs = require('fs');

fs.readFile('accounts.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Eroare la citirea fișierului:', err);
        return;
    }

    jsonData = JSON.parse(data);
});

module.exports = {
    getData: () => jsonData, 
};
