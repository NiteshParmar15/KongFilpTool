"use strict";

const winston = require('winston'),
    fs = require('fs');

const logDir = './logs';

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const dtFormat = () => (new Date()).toLocaleDateString() + " " + (new Date()).toLocaleTimeString();
const myFormat = winston.format.printf(info => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  });
var transports = [
    new winston.transports.Console({
        "level": 'debug',
        "handleExceptions": true,
        "json": false,
        "colorize": true,
        "stderrLevels": ['error'],
        "timestamp": dtFormat        
    }),
    new (require('winston-daily-rotate-file'))({
        "level": 'debug',
        "filename": `${logDir}/%DATE%.log`,
        "timestamp": dtFormat,
        "datePattern": 'YYYY-MM-DD',
        "prepend": true,
        "maxSize": '10m',
        "maxFiles": '5d',
        json: false,
        eol: '\r\n'
    })
];

var logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        myFormat
      ),
    transports: transports,
    exitOnError: true
});

module.exports = logger;
