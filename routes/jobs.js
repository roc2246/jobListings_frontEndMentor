const express = require("express");
const router = express.Router();
const Job = require("../models/jobs");

// Getting Jobs
router.get("/", async (req, res) => {
  try {
    const Jobs = await Job.find();
    res.json(Jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Updating Job
router.patch("/:id", getJob, async (req, res) => {
  if (req.body.content != null) {
    res.Job.content = req.body.content;
  }
  try {
    const updatedJob = await res.Job.save();
    res.json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Middleware
async function getJob(req, res, next) {
  let Job;
  try {
    Job = await Job.findOne({ id: req.params.id });

    if (Job === null) {
      return res.status(400).json({ message: "Cannot find Job" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.Job = Job;
  next();
}

module.exports = router;
