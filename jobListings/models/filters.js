const mongoose = require("mongoose");

const filterSchema = new mongoose.Schema({
    image: {
      png: {
        type: String,
        required: true,
      },
      webp: {
        type: String,
        required: true,
      },
    },
    username: {
      type: String,
      required: true,
    }
})

const Filter =  mongoose.model("Filter", filterSchema);
module.exports = Filter;
