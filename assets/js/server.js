const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/codduels', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    profile: {
        fullName: String,
        bio: String,
    }
});

const User = mongoose.model('User', UserSchema);

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).send({ message: 'User registered successfully' });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).send({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).send({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret');
    res.send({ token });
});

app.get('/profile', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const user = await User.findById(decoded.id);
    res.send(user.profile);
});

app.put('/profile', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'your_jwt_secret');
    await User.findByIdAndUpdate(decoded.id, { profile: req.body });
    res.send({ message: 'Profile updated successfully' });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');  
});
