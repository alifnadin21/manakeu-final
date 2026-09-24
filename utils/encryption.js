const crypto = require('crypto');
const { logger } = require('./logger');

class Encryption {
    static algorithm = 'aes-256-gcm';
    static #getKey() {
        const value = process.env.ENCRYPTION_KEY || '';
        const key = /^[a-f0-9]{64}$/i.test(value)
            ? Buffer.from(value, 'hex')
            : value.length === 32
              ? Buffer.from(value, 'utf8')
              : Buffer.from(value, 'base64');
        if (key.length !== 32)
            throw new Error('ENCRYPTION_KEY must encode exactly 32 bytes');
        return key;
    }
    static #ivLength = 16;
    static #authTagLength = 16;

    // ENKRIPSI
    static encrypt(text) {
        try {
            const iv = crypto.randomBytes(this.#ivLength);
            const cipher = crypto.createCipheriv(
                this.algorithm,
                this.#getKey(),
                iv
            );
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            // Menggabungkan IV, authTag, dan data terenkripsi
            return Buffer.concat([
                iv,
                authTag,
                Buffer.from(encrypted, 'hex')
            ]).toString('base64');
        } catch (error) {
            logger.error('Encryption error:', error);
            throw new Error('Encryption failed');
        }
    }

    // DEKRIPSI
    static decrypt(encryptedData) {
        try {
            const buffer = Buffer.from(encryptedData, 'base64');
            // Memisahkan IV, authTag, dan data terenkripsi
            const iv = buffer.slice(0, this.#ivLength);
            const authTag = buffer.slice(
                this.#ivLength,
                this.#ivLength + this.#authTagLength
            );
            const encrypted = buffer.slice(
                this.#ivLength + this.#authTagLength
            );
            const decipher = crypto.createDecipheriv(
                this.algorithm,
                this.#getKey(),
                iv
            );
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'binary', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            logger.error('Decryption error:', error);
            throw new Error('Decryption failed');
        }
    }

    // Khusus untuk API keys dan data sensitif lainnya
    static encryptApiKey(apiKey) {
        return this.encrypt(apiKey);
    }
    static decryptApiKey(encryptedApiKey) {
        return this.decrypt(encryptedApiKey);
    }

    // Untuk mengenkripsi objek/data kompleks
    static encryptObject(obj) {
        return this.encrypt(JSON.stringify(obj));
    }
    static decryptObject(encryptedData) {
        const decrypted = this.decrypt(encryptedData);
        return JSON.parse(decrypted);
    }
}

module.exports = Encryption;
