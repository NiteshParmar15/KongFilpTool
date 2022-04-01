const http = require("http");
const logger = require('./utils/logger');
const app = require('./middleware/app');
const port = process.env.PORT || 3050;
const server = http.createServer(app);

server.listen(port, () => {
  logger.info(`Started at ${port}`);
});
