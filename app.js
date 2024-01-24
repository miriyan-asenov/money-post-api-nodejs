const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

const transferSchema = new mongoose.Schema({
	amount: {type: Number, required: true},
	receiver: {type: String, required: true},
	sender: {type: String}
});

const Transfer = mongoose.model('Transfer', transferSchema); 

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});