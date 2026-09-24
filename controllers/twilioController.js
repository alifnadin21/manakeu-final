const twilio = require('twilio');
const { validationResult } = require('express-validator');

// Initialize Twilio client
const initTwilioClient = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured');
    }

    return twilio(accountSid, authToken);
};

// Send SMS message
exports.sendSMS = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        const { to, body } = req.body;
        const client = initTwilioClient();

        const message = await client.messages.create({
            body,
            to,
            from: process.env.TWILIO_PHONE_NUMBER
        });

        res.status(200).json({
            status: 'success',
            data: {
                sid: message.sid,
                status: message.status
            }
        });
    } catch (error) {
        console.error('Twilio SMS error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send SMS',
            error: 'Layanan tidak tersedia'
        });
    }
};

// Make voice call
exports.makeCall = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        const { to, twiml } = req.body;
        const client = initTwilioClient();

        const call = await client.calls.create({
            twiml,
            to,
            from: process.env.TWILIO_PHONE_NUMBER
        });

        res.status(200).json({
            status: 'success',
            data: {
                sid: call.sid,
                status: call.status
            }
        });
    } catch (error) {
        console.error('Twilio call error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to make call',
            error: 'Layanan tidak tersedia'
        });
    }
};

// Get message log
exports.getMessageLogs = async (req, res) => {
    try {
        const client = initTwilioClient();
        const messages = await client.messages.list({
            limit: 20
        });

        res.status(200).json({
            status: 'success',
            data: messages.map((message) => ({
                sid: message.sid,
                to: message.to,
                from: message.from,
                body: message.body,
                status: message.status,
                direction: message.direction,
                date: message.dateCreated
            }))
        });
    } catch (error) {
        console.error('Twilio message logs error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve message logs',
            error: 'Layanan tidak tersedia'
        });
    }
};
