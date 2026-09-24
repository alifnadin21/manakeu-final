// utils/cacheUtils.js
const redis = require('../config/redis');
async function scan(pattern) {
    if (process.env.REDIS_ENABLED === 'false') return [];
    let cursor = '0';
    const result = [];
    do {
        const [next, keys] = await redis.scan(
            cursor,
            'MATCH',
            'manakeu:' + pattern,
            'COUNT',
            100
        );
        cursor = next;
        result.push(...keys.map((key) => key.slice('manakeu:'.length)));
    } while (cursor !== '0');
    return result;
}

// Fungsi untuk invalidate single pattern
const invalidateCache = async (pattern) => {
    try {
        const keys = await scan(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(
                `Cache dihapus untuk pola: ${pattern}, ${keys.length} kunci dihapus`
            ); // Notifikasi cache dihapus
            return {
                success: true,
                message: `Cache dihapus: ${keys.length} kunci`,
                pattern,
                keys
            };
        }
        return {
            success: true,
            message: 'Tidak ditemukan kunci untuk dihapus',
            pattern
        };
    } catch (error) {
        console.error('Error penghapusan cache:', {
            error: error.message,
            pattern,
            stack: error.stack
        });
        return {
            success: false,
            message: 'Gagal menghapus cache',
            error: error.message,
            pattern
        };
    }
};

// Fungsi untuk invalidate multiple patterns
const invalidateMultipleCache = async (patterns) => {
    try {
        const results = await Promise.all(
            patterns.map((pattern) => invalidateCache(pattern))
        );
        const success = results.every((result) => result.success);

        return {
            success,
            results,
            totalPatternsProcessed: patterns.length,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error penghapusan cache multiple:', error);
        return {
            success: false,
            message: 'Gagal menghapus cache multiple',
            error: error.message,
            patterns
        };
    }
};

// Fungsi untuk refresh cache (invalidate dan regenerate)
const refreshCache = async (pattern, regenerateFunction, ...args) => {
    try {
        // Invalidate existing cache
        await invalidateCache(pattern);

        // Regenerate cache
        if (regenerateFunction && typeof regenerateFunction === 'function') {
            const newData = await regenerateFunction(...args);
            const cacheKey = pattern.replace('*', ''); // Remove wildcard for specific key
            await redis.setex(cacheKey, 3600, JSON.stringify(newData)); // Default 1 hour TTL

            return {
                success: true,
                message: 'Cache berhasil diperbarui',
                pattern,
                newData
            };
        }

        return {
            success: true,
            message:
                'Cache dihapus tapi tidak diperbarui (tidak ada fungsi perbarui)',
            pattern
        };
    } catch (error) {
        console.error('Error perbarui cache:', error);
        return {
            success: false,
            message: 'Gagal memperbarui cache',
            error: error.message,
            pattern
        };
    }
};

// Fungsi untuk mengecek status cache
const getCacheStatus = async (pattern) => {
    try {
        const keys = await scan(pattern);
        const status = {
            pattern,
            exists: keys.length > 0,
            keyCount: keys.length,
            keys: keys
        };

        if (keys.length > 0) {
            const ttls = await Promise.all(keys.map((key) => redis.ttl(key)));
            status.ttls = keys.reduce((acc, key, index) => {
                acc[key] = ttls[index];
                return acc;
            }, {});
        }

        return {
            success: true,
            data: status
        };
    } catch (error) {
        console.error('Error cek status cache:', error);
        return {
            success: false,
            message: 'Gagal cek status cache',
            error: error.message,
            pattern
        };
    }
};

module.exports = {
    invalidateCache,
    invalidateMultipleCache,
    refreshCache,
    getCacheStatus
};
