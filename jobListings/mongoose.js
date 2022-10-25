const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const mongoose = require("mongoose");
const localDB = 'mongodb://127.0.0.1:27017/job-filters'
const db = mongoose.connection
console.log(process.env.MONGODB_URI)
// Set up MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true
  })

db.once('open', () => console.log('Connected to DB'))