const express = require('express')
const app = express()
const port = 8080

app.get('/', (req, res) => {
    fetch('http://lib.rs')
        .then(response => response.text())
        .then((response) => {
            res.send(response);
        }).catch((err) => console.error(err));
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
