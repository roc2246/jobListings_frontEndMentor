const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  new: {
    type: Boolean,
    required: true,
  },
  featured: {
    type: Boolean,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  contract: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  languages: {
    type: Array,
    required: true,
  },
  tools: {
    type: Array,
    required: false,
  }
});

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;
