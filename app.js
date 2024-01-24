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

mongoose.connect('mongodb+srv://masenov3377:CAL4y0ZeSodTjmND@cluster0.n5ty6uk.mongodb.net/myMoneyPostDB?retryWrites=true&w=majority')
		.then(() => app.listen( port, () => {console.log(`Example app listening on port ${port}`);} ) );

 