const { redisClient } = require("../config/redis.config");

const setCacheWithExpiration = async (itemKey, exp, data) => {
  return await redisClient.setexAsync(itemKey, exp, data);
};

const getCachedItem = async (itemKey) => {
  return await redisClient.getAsync(itemKey);
};

const clearCacheItem = async (itemKey) => {
  return await redisClient.clear(itemKey);
};


module.exports = {
  setCacheWithExpiration,
  getCachedItem,
  clearCacheItem 
};