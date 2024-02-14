const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;

const userSchema = new mongoose.Schema({
		name: { type: String, required: true },
		idCardNumber: { type: String, required: true },
		phoneNumber: { type: String, required: true },
		username: { type: String, required: true },		
		password: { type: String, required: true },
		role: { type: String, enum: ['user', 'admin'], default: 'user'}
});

const User = mongoose.model('User', userSchema);

const transferSchema = new mongoose.Schema({
	amount: {type: Number, required: true},
	receiver: {type: String, required: true},
	sender: {type: String}
});

const Transfer = mongoose.model('Transfer', transferSchema);

app.use(express.json()); 

app.post('/transfers', (req, res) => {
	const { amount, receiver, sender } = req.body;
		 
	Transfer.create({ amount, receiver, sender })
			.then(data => res.status(201).json({status: "success", data}));		  
});

app.get('/transfers/:receiver', (req, res) => {
	
	Transfer.find({receiver: req.params.receiver})
		    .then(data => res.status(200).json({status: "success", data}));
});

app.get('/transfers/:receiver/deposits', (req, res) => {
	
	Transfer.find( {receiver: req.params.receiver, amount: {$gt: 0}} )				 
			.then(data => res.status(200).json({status: "success", data}));	 
});

app.get('/transfers/:receiver/withdrawals', (req, res) => {
	
	Transfer.find( {receiver: req.params.receiver, amount: {$lt: 0}} )				 
			.then(data => res.status(200).json({status: "success", data}));	 
});

mongoose.connect('mongodb+srv://masenov3377:CAL4y0ZeSodTjmND@cluster0.n5ty6uk.mongodb.net/myMoneyPostDB?retryWrites=true&w=majority')
		.then(() => app.listen( port, () => {console.log(`Example app listening on port ${port}`);} ) );

 