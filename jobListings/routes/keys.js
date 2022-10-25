const express = require("express");
const router = express.Router();
const Key = require("../models/keys");

// Retrieves Keys
router.get("/", (req, res) => {
  Key.find()
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
    });
});

// Adds Key
router.post("/", async (req, res) => {
  const key = new Key({
    key: req.body.key,
  });
  try {
    const newKey = await key.save();
    res.status(201).json(newKey);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Removes Key
router.delete("/", async (req, res) => {
     try {
          const key = await Key.findOne({key: req.body.key})
          await key.remove()
          res.json({ message: "Removed Filter" });
          
     } catch (error) {
          res.status(500).json({ message: error.message });
        }
 
});

// Removes All Keys
router.delete("/all", async (req, res) => {
  try {
       await Key.deleteMany({})
       res.json({ message: "Removed All Filter" });
       
  } catch (error) {
       res.status(500).json({ message: error.message });
     }

});

module.exports = router;
