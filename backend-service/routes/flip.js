const express = require("express");
const router = express.Router();
var flip = require('./details');
const logger = require('../utils/logger');

router.get("/config", async (req, res, next) => {
  res.send(require('../config/config.json'))
});

router.post("/env", async (req, res, next) => {
  var env = await flip.getEnv();
  return res.status(200).json(env)
});

router.post("/flip", async (req, res, next) => {
  var done = await flip.flips();
  return res.status(200).json(done)
});

module.exports = router;

//Calling a init function to initializing global value from config in details.js 
module.exports.init = function (init) {
  let error = false
  let done = flip.init(init)
  if (done.status != null) {
    error = true
  }
  if (error) {
    return done
  } else {
    logger.info(JSON.stringify(init));
    return this;
  }  
};
