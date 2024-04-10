const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const port = 3000;

const app = express();

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	idCardNumber: { type: String, required: true, unique: true },
	phoneNumber: { type: String, required: true, unique: true },
	username: { type: String, required: true, unique: true },		
	password: { type: String, required: true, select: false },
	role: { type: String, enum: ['user', 'admin'], default: 'user'}
});

const User = mongoose.model('User', userSchema);

const transferSchema = new mongoose.Schema({
	amount: {type: Number, required: true},
	username: {type: String, required: true},
	operation: { type: String, enum: ['deposited', 'withdrawn', 'sent', 'requested'], default: 'sent'},
	createdAt: { type: Date, default: Date.now() },
	sentTo: {type: String},
	requestedFrom: {type: String}
});

const Transfer = mongoose.model('Transfer', transferSchema);

function protectUser(req, res, next){
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
		const token = req.headers.authorization.split(' ')[1];
		
		User.findById( jwt.verify(token, '1111222233334444').id )
			.then( user => (req.params.receiver === user.username) && next() );
	}	
}

function protectAdmin(req, res, next){
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
		const token = req.headers.authorization.split(' ')[1];
		
		User.findById( jwt.verify(token, '1111222233334444').id )
			.then( user => (user.role === 'admin') && next() );
	}	
}

function signup(req, res){
	const {name, idCardNumber, phoneNumber, username, password, role} = req.body;
		 
	bcrypt.hash(password, 12)
		  .then(hashedP => User.create({name, idCardNumber, phoneNumber, username, password: hashedP, role}))
		  .then(data => res.status(201).json({status: "success", data}));
}

function login(req, res){
	const {username, password} = req.body;
	
	User.findOne({username}).select('+password')
		.then(user => bcrypt.compare(password, user.password)
				            .then(() => res.status(201)
											.json({status: "success", 
												   token: jwt.sign({ id: user._id }, 
																	'1111222233334444', 
																	{expiresIn: 300}
																  )
												  })
								 )
			 );
}

function adminTransfer(req, res){
	const { amount, user, operation } = req.body;
		 
	Transfer.create({ amount, user, operation })
			.then(data => res.status(201).json({status: "success", data}));
}

function showTransfers(req, res){
	Transfer.find({})
			.then(data => res.status(200).json({status: "success", data}));
}

function showUsers(req, res){
	User.find({})
		.then(data => res.status(200).json({status: "success", data}));
}

app.use( express.json() ); 

app.post('/users/signup', signup);

app.post('/users/login', login);

app.post('/admin/transfers', protectAdmin, adminTransfer);

app.get('/transfers', protectAdmin, showTransfers);

app.get('/users', protectAdmin, showUsers);

app.get('/transfers/:receiver', protectUser, (req, res) => {
	
	Transfer.find({receiver: req.params.receiver})
		    .then(data => res.status(200).json({status: "success", data}));
});

app.get('/transfers/:receiver/deposits', protectUser, (req, res) => {
	
	Transfer.find( {receiver: req.params.receiver, amount: {$gt: 0}} )				 
			.then(data => res.status(200).json({status: "success", data}));	 
});

app.get('/transfers/:receiver/withdrawals', protectUser, (req, res) => {
	
	Transfer.find( {receiver: req.params.receiver, amount: {$lt: 0}} )				 
			.then(data => res.status(200).json({status: "success", data}));	 
});

app.get('/transfers/:receiver/balance', protectUser, (req, res) => {
	
	Transfer.aggregate([{ $match: {receiver: req.params.receiver} }, 
						{ $group: {_id: null, balance: {$sum: '$amount'}}}])
			.then(data => res.status(200).json({status: "success", data}));	 
});

mongoose.connect('mongodb+srv://masenov3377:CAL4y0ZeSodTjmND@cluster0.n5ty6uk.mongodb.net/myMoneyPostDB?retryWrites=true&w=majority')
		.then(() => app.listen( port, () => {console.log(`App listening on port ${port}`);} ) );

 