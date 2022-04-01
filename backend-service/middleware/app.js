const express = require('express');
const app = express();
var cors = require('cors')
const logger = require('../utils/logger');
const morgan = require('morgan');
const flips = require('../routes/flip');
const bodyParser = require('body-parser');
const swaggerUi = require("swagger-ui-express"),
swaggerDocument = require("../swagger.json");

//Disabling information about the technologies used to develop the application
app.disable("x-powered-by");

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res, next) => {
  bodyParser.json()(req, res, err => {
    if (err) {
      console.error(err);
      return res.sendStatus(400); // Bad request
    }
    next();
  });
})

// CORS Policy 
app.use(cors())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.json());

//Calling a init function to initializing values if request contains operator/service vaule in body
app.use((req, res, next) => {
  let status = true
  var done = {};
  if ((req.body.operator) && (req.body.service)) {
    if (req.body.env) {
      var obj = { operator: req.body.operator, service: req.body.service, env: req.body.env }
    } else {
      obj = { operator: req.body.operator, service: req.body.service }
    }
    done = flips.init(obj)
    if (done.status != null) {
      status = done.status
    }
  }
  if (!status) {
    const error = done
    error.status = 405;
    next(error);
  } else {
    next();
  }
})

app.use('/api', flips);

app.use((req, res, next) => {
  const error = new Error("Method not allowed or Endpoint does not exist")
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
  logger.error(error.message);
});

module.exports = app;
