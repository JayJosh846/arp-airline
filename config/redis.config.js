require('dotenv').config();
const redis = require('redis');
const util = require('util');
const chalk = require('chalk');
const url = require('url');



// {
//   host: 127.0.0.1,
//   port: 6379
// }

const redisClient = redis.createClient({
    port: process.env.REDIS_URL_PORT || 6379,
    host: process.env.REDIS_URL || "localhost",
    auno_ready_check: true,
    auth_pass: process.env.REDIS_PSWD
  });


try {
  redisClient.getAsync = util.promisify(redisClient.get).bind(redisClient);
  redisClient.setexAsync = util.promisify(redisClient.setex).bind(redisClient);
  redisClient.clear = util.promisify(redisClient.del).bind(redisClient);
} catch (err) {
  console.log('redis error', err);
}

redisClient.on('connect', async () => {
  console.log(
    chalk.cyan.bold(
      `Redis database connected! on ${process.env.REDIS_URL}: ${process.env.REDIS_URL_PORT}`,
    ),
  );
});

redisClient.on('error', (error) => {
  console.log(chalk.red('Error initialising Redis database', error.message));
});


module.exports = {
  redisClient
};
