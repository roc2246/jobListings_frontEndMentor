require('dotenv').config

const mongoose = require("mongoose");
const localDB = 'mongodb://127.0.0.1:27017/job-filters'
const dbName = "comments"
// const MONGODB_URI = `mongodb+srv://childswebdev:${password}@comment-section-cluster.mn0pidu.mongodb.net/${dbName}?retryWrites=true&w=majority`
const db = mongoose.connection

// Set up MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true
  })

db.once('open', () => console.log('Connected to DB'))