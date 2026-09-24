const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    commandTimeout: 1000,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    keyPrefix: 'manakeu:'
});
redis.on('error', () => {});
if (process.env.REDIS_ENABLED !== 'false') redis.connect().catch(() => {});
module.exports = redis;
