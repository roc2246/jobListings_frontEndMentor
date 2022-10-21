const express = require('express');
require('./mongoose')
const filtersRouter = require('./routes/filters')
const jobsRouter = require('./routes/jobs')
const pageRouter = require('./routes/page')

const app = express();

app.use(express.static('public'));
app.use(express.json())
app.use('/jobs', jobsRouter)
app.use('/filters', filtersRouter)
app.use(pageRouter)

module.exports = app