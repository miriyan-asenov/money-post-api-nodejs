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
	role: { type: String, enum: ['user', 'admin'], default: 'user'},
	active: { type: Boolean, default: true, select: false }
});

const User = mongoose.model('User', userSchema);

const transferSchema = new mongoose.Schema({
	amount: {type: Number, required: true},
	username: {type: String, required: true},
	operation: { type: String, enum: ['deposited', 'withdrawn', 'sent', 'requested'], default: 'sent'},
	createdAt: { type: Date, default: Date.now() },
	receiver: {type: String}
});

const Transfer = mongoose.model('Transfer', transferSchema);

function protectUser(req, res, next){
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
		const token = req.headers.authorization.split(' ')[1];
		
		User.findById( jwt.verify(token, '1111222233334444').id )
			.then( user => (req.params.username === user.username) && next() );
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
	const { amount, username, operation } = req.body;
		 
	Transfer.create({ amount, username, operation })
			.then(data => res.status(201).json({status: "success", data}));
}

function userTransfer(req, res){
	const { amount, operation, receiver } = req.body;
		 
	Transfer.create({ amount, username: req.params.username, operation, receiver })
			.then(data => res.status(201).json({status: "success", data}));
}

function showTransfersByUser(req, res){
	Transfer.find( { $or: [{username: req.params.username},{receiver: req.params.username}] } )
		    .then(data => res.status(200).json({status: "success", data}));
}

function showDepositsByUser(req, res){
	Transfer.find( { username: req.params.username, operation: 'deposited' } )
		    .then(data => res.status(200).json({status: "success", data}));
}

function showWithdrawalsByUser(req, res){
	Transfer.find( { username: req.params.username, operation: 'withdrawn' } )
		    .then(data => res.status(200).json({status: "success", data}));
}

function showSendingsByUser(req, res){
	Transfer.find( { username: req.params.username, operation: 'sent' } )
		    .then(data => res.status(200).json({status: "success", data}));
}

function showRequestsByUser(req, res){
	Transfer.find( { username: req.params.username, operation: 'requested' } )
		    .then(data => res.status(200).json({status: "success", data}));
}

function showSendingsByReceiver(req, res){
	Transfer.find( { receiver: req.params.username, operation: 'sent' } )
		    .then(data => res.status(200).json({status: "success", data}));
}

function showRequestsByReceiver(req, res){
	Transfer.find( { receiver: req.params.username, operation: 'requested' } )
		    .then(data => res.status(200).json({status: "success", data}));
}

function showUserBalance(req, res){
	Transfer.aggregate([{ $match: { $or: [ {username: req.params.username}, {receiver: req.params.username} ] } },
						{ $group: { _id: {username: "$username", operation: "$operation"}, total: {$sum: "$amount"} } }
					   ])
			.then(data => res.status(200).json({status: "success", data}));
}

function deleteCurrentUser(req, res){
	User.findOneAndUpdate( { username: req.params.username }, { active: false } )
		    .then(data => res.status(204).json({status: "success", data: null}));
}

function showAllUsers(req, res){
	User.find({})
		.then(data => res.status(200).json({status: "success", data}));
}

app.get('/:username/transfers', protectUser, showTransfersByUser);
app.get('/:username/transfers/deposited', protectUser, showDepositsByUser);
app.get('/:username/transfers/withdrawn', protectUser, showWithdrawalsByUser);
app.get('/:username/transfers/sent', protectUser, showSendingsByUser);
app.get('/:username/transfers/requested', protectUser, showRequestsByUser);
app.get('/:username/transfers/receivedMoney', protectUser, showSendingsByReceiver);
app.get('/:username/transfers/receivedRequests', protectUser, showRequestsByReceiver);
app.get('/:username/balance', protectUser, showUserBalance);
app.get('/:username/delete', protectUser, deleteCurrentUser);
app.get('/admin/users', protectAdmin, showAllUsers);

app.use( express.json() ); 
app.post('/users/signup', signup);
app.post('/users/login', login);
app.post('/admin/transfers', protectAdmin, adminTransfer);
app.post('/:username/transfers', protectUser, userTransfer);

mongoose.connect('mongodb+srv://masenov3377:CAL4y0ZeSodTjmND@cluster0.n5ty6uk.mongodb.net/myMoneyPostDB?retryWrites=true&w=majority')
		.then(() => app.listen( port, () => {console.log(`App listening on port ${port}`);} ) );

 /*
 function showTransfers(req, res){
	Transfer.find({})
			.then(data => res.status(200).json({status: "success", data}));
}

function showUsers(req, res){
	User.find({})
		.then(data => res.status(200).json({status: "success", data}));
}


app.get('/transfers', protectAdmin, showTransfers);

app.get('/users', protectAdmin, showUsers);

app.get('/transfers/:receiver/balance', protectUser, (req, res) => {
	
	Transfer.aggregate([{ $match: {receiver: req.params.receiver} }, 
						{ $group: {_id: null, balance: {$sum: '$amount'}}}])
			.then(data => res.status(200).json({status: "success", data}));	 
});

Transfer.aggregate( [
						{ $match: { { $or: [ {username: req.params.username}, {receiver: req.params.username} ] } } },
						 
					] 
				  );
 { $or: [ $username: req.params.username, { $and: [ $operation: "sent", $receiver: req.params.username ] } ] }
 
 { $and: [ $operation: "sent", $receiver: req.params.username ] }
 */