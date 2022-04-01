var axios = require('axios');
const logger = require('../utils/logger');
var config = require('../config/config.json');
var currentenv,
  serviceid,
  servicenameBlue,
  servicenameGreen,
  headervaule,
  envapi,
  routeid,
  kongips,
  port,
  keepalivedip,
  envvar;

//TO get Current Env Value 
async function getEnv() {
  logger.info('Getting Current Environment value')
  try {
    var getenv = {
      'method': 'GET',
      'url': `http://${keepalivedip}:${port}/${envapi}`,
      'headers': {
        'service': headervaule
      }
    };
    let response = await axios(getenv)
    logger.info(`Host: ${JSON.stringify(response.request["host"])}, Env api path : ${JSON.stringify(response.request["path"])}, method : ${JSON.stringify(response.request["method"])}`);
    if ((response.data).environment) {
      currentenv = (response.data).environment;
    } else {
      currentenv = response.data;
    }
    logger.info(`Current Environment value is ${currentenv}`);
    return { status: true, message: `Current Environment value is ${currentenv}`, env: currentenv }

  } catch (error) {
    var msg = {};
    logger.error(JSON.stringify(error.config))
    if (typeof error.response !== 'undefined') {
      if (`${((error.response).status)}` == "404") {
        msg = { status: false, message: error.response.data.message }
      } else {
        msg = { status: false, message: error.response.data.message, code: error.response.status }
      }
    } else {
      msg = { status: false, message: "Check Connection", code: error.code }
    }
    return msg
  }
}

//Function will get the default route id and Patch to provided service id
async function patchRoutes(kongip, servicename) {
  try {
    var getroute = {
      'method': 'GET',
      'url': `http://${kongip}:8001/services/${servicename}/routes/`,
      'headers': {
        'Content-Type': 'application/json'
      }
    };
    let getresponse = await axios(getroute)
    logger.info(`Host: ${JSON.stringify(getresponse.request["host"])}, Api path : ${JSON.stringify(getresponse.request["path"])}, method : ${JSON.stringify(getresponse.request["method"])}`);
    let data = ((getresponse).data).data
    for (var i = 0; i < data.length; i++) {
      let element = data[i]
      if ((element.headers != null) && (element.headers['env-type'] == null) && ((element.headers.service == headervaule) || (element.headers['service-type'] == headervaule))) {
        routeid = element.id
      } else if (element.headers == headervaule) {
        routeid = element.id
      }
    }
    logger.info(`Get RouteID: ${routeid}`);
    var body = JSON.stringify({ "service": { "id": serviceid } });
    var patchroute = {
      method: 'patch',
      url: `http://${kongip}:8001/services/${servicename}/routes/${routeid}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: body
    };
    let patchres = await axios(patchroute)
    logger.info(`Host: ${JSON.stringify(patchres.request["host"])}, Api path : ${JSON.stringify(patchres.request["path"])}, method : ${JSON.stringify(patchres.request["method"])}`);
    return { status: true, message: "Flipped" }
  } catch (error) {
    var msg = {};
    logger.error(JSON.stringify(error.config))
    if (typeof error.response !== 'undefined') {
      if (`${((error.response).status)}` == "404") {
        msg = { status: false, message: error.response.data.message }
      } else {
        msg = { status: false, message: error.response.data.message, code: error.response.status }
      }
    } else {
      msg = { status: false, message: "Check Connection", code: error.code }
    }
    return msg
  }
}


//This function will flip the service based on current env
async function flips() {
  if ((typeof envvar === 'undefined') || (envvar == null)) {
    await getEnv();
  }
  var done;
  try {
    for (var i = 0; i < kongips.length; i++) {
      let kongip = kongips[i]
      if (currentenv == "Blue") {
        let getservice = {
          'method': 'GET',
          'url': `http://${kongip}:8001/services/${servicenameGreen}/`,
          'headers': {
            'Content-Type': 'application/json'
          }
        };
        let response = await axios(getservice)
        logger.info(`Host: ${JSON.stringify(response.request["host"])}, Api call : ${JSON.stringify(response.request["path"])}, method : ${JSON.stringify(response.request["method"])}`);
        serviceid = (response.data).id;
        logger.info(`Service ID: ${serviceid}`);
        done = await patchRoutes(kongip, servicenameBlue);
      } else if (currentenv == "Green") {
        let getservice = {
          'method': 'GET',
          'url': `http://${kongip}:8001/services/${servicenameBlue}/`,
          'headers': {
            'Content-Type': 'application/json'
          }
        };
        let response = await axios(getservice)
        logger.info(`Host: ${JSON.stringify(response.request["host"])}, Api call : ${JSON.stringify(response.request["path"])}, method : ${JSON.stringify(response.request["method"])}`);
        serviceid = (response.data).id;
        logger.info(`Service ID: ${serviceid}`);
        done = await patchRoutes(kongip, servicenameGreen);
      }
    }
    return done
  } catch (error) {
    logger.error(`message: ${JSON.stringify(error.message)}, config : ${JSON.stringify(error.config)}`)
    var msg = {};
    if (typeof error.response !== 'undefined') {
      if (`${((error.response).status)}` == "404") {
        msg = { status: false, message: error.response.data.message }
      } else {
        msg = { status: false, message: error.response.data.message, code: error.response.status }
      }
    } else {
      msg = { status: false, message: "Check Connection", code: error.code }
    }
    return msg
  }

}

module.exports = { flips, getEnv };

//Reading config values 
module.exports.init = function (init) {
  try {
    logger.info(`Reading Values from config's for Operator: ${init.operator} `);
    if (config[`${init.operator}`]["services"][`${init.service}`]["port"]) {
      port = config[`${init.operator}`]["services"][`${init.service}`]["port"];
    } else {
      port = 8000;
    }
    kongips = config[`${init.operator}`].kongIp;
    keepalivedip = config[`${init.operator}`].keepalived;
    headervaule = config[`${init.operator}`]["services"][`${init.service}`]["header"];
    envapi = config[`${init.operator}`]["services"][`${init.service}`]["envapi"];
    servicenameBlue = config[`${init.operator}`]["services"][`${init.service}`]["servicenameBlue"];
    servicenameGreen = config[`${init.operator}`]["services"][`${init.service}`]["servicenameGreen"];
    if ( (envapi === undefined) || (servicenameBlue === undefined) || (servicenameGreen === undefined) || (headervaule === undefined)) {
      throw error
    }
    if (init.env) {
      envvar = init.env;
      if (init.env == "Blue") {
        currentenv = "Green";
      } else if (init.env == "Green") {
        currentenv = "Blue";
      }    
    } else {
      envvar = null
    }
    return this;
  } catch (error) {
    let msg = {};
    if (config[`${init.operator}`] === undefined) {
      msg = { status: false, message: `${init.operator} Operator is not present in config` }
    } else if (config[`${init.operator}`]["services"][`${init.service}`] === undefined) {
      msg = { status: false, message: `${init.service} service is not present in config` }
    } else {
      msg = { status: false, message: `Config Value is missing ` }
    }
    return msg
  }
};