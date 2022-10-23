const express = require('express');
require('./mongoose')
const keysRouter = require('./routes/keys')
const jobsRouter = require('./routes/jobs')
const pageRouter = require('./routes/page')

const app = express();

app.use(express.static('public'));
app.use(express.json())
app.use('/jobs', jobsRouter)
app.use('/keys', keysRouter)
app.use(pageRouter)

module.exports = app