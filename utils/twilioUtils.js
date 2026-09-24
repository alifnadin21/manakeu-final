const twilio = require('twilio');
const { logger } = require('./logger');

/**
 * Utility class for Twilio operations
 */
class TwilioUtils {
    /**
     * Get or initialize the Twilio client
     * @returns {Object} Twilio client instance
     */
    static getClient() {
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;

            if (!accountSid || !authToken) {
                throw new Error('Twilio credentials not configured');
            }

            return twilio(accountSid, authToken);
        } catch (error) {
            logger.error(
                `Failed to initialize Twilio client: ${error.message}`,
                {
                    service: 'TwilioUtils',
                    method: 'getClient'
                }
            );
            throw error;
        }
    }

    /**
     * Send SMS notification
     * @param {string} to - Recipient phone number
     * @param {string} body - Message body
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Twilio message response
     */
    static async sendSMS(to, body, options = {}) {
        try {
            const client = this.getClient();
            const messageParams = {
                body,
                to,
                from: options.from || process.env.TWILIO_PHONE_NUMBER,
                ...options
            };

            const message = await client.messages.create(messageParams);
            logger.info(`SMS sent successfully to ${to}`, {
                service: 'TwilioUtils',
                method: 'sendSMS',
                messageSid: message.sid
            });

            return message;
        } catch (error) {
            logger.error(`Failed to send SMS to ${to}: ${error.message}`, {
                service: 'TwilioUtils',
                method: 'sendSMS',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Send bulk SMS to multiple recipients
     * @param {Array<string>} recipients - Array of phone numbers
     * @param {string} body - Message body
     * @returns {Promise<Array>} Array of message results
     */
    static async sendBulkSMS(recipients, body) {
        const results = [];
        const errors = [];

        for (const recipient of recipients) {
            try {
                const message = await this.sendSMS(recipient, body);
                results.push({
                    to: recipient,
                    success: true,
                    sid: message.sid
                });
            } catch (error) {
                results.push({
                    to: recipient,
                    success: false,
                    error: error.message
                });
                errors.push({ to: recipient, error: error.message });
            }
        }

        if (errors.length > 0) {
            logger.warn(`Bulk SMS sent with ${errors.length} errors`, {
                service: 'TwilioUtils',
                method: 'sendBulkSMS',
                totalRecipients: recipients.length,
                successCount: results.length - errors.length,
                errorCount: errors.length
            });
        } else {
            logger.info(
                `Bulk SMS sent successfully to ${recipients.length} recipients`,
                {
                    service: 'TwilioUtils',
                    method: 'sendBulkSMS'
                }
            );
        }

        return results;
    }
}

module.exports = TwilioUtils;
