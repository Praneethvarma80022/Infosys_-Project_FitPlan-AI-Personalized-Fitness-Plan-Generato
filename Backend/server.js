const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const exerciseRoutes = require('./routes/exercises');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); 
app.use('/exercises', express.static(path.join(__dirname, '..', 'exercises')));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/exercises', exerciseRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});