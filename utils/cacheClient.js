const redis = require('../config/redis');
module.exports = {
    async get(key) {
        if (process.env.REDIS_ENABLED === 'false') return null;
        try {
            return await redis.get(key);
        } catch {
            return null;
        }
    },
    async setex(key, ttl, value) {
        if (process.env.REDIS_ENABLED === 'false') return null;
        try {
            return await redis.setex(key, ttl, value);
        } catch {
            return null;
        }
    }
};
