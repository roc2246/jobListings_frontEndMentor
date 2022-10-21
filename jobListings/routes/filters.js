const express = require('express')
const router = express.Router();
const Filter = require('../models/filters')

// Retrieves Filters
router.get('/',  (req, res) => {
     Filter.find().then((result) => {
      res.send(result)
     }).catch((err) => {
      console.log(err)
     })
})

module.exports = router