"use strict";
var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    cors = require('cors'),
    config = require('./public/config.json'),
    client = require('prom-client'),
    logger = require('./utils/logger');

app.use(cors())
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }))

app.listen(config.port, () => {
    logger.info(`Kong flip-ui started on port ${config.port}`);
});
app.post('/post', function (req, res){
    console.log(req.body)
}) ;