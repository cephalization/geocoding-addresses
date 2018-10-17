const express = require('express');
const app = express();
const port = 3030;

app.get('/locations', (req, res) => res.json({
  locations: []
}));

app.listen(port, () => console.log(`API Listening on port ${port}`));
