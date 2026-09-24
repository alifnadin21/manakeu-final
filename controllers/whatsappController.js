const { sendMessage, client } = require('../config/whatsapp');

// Controller untuk mengirim pesan WhatsApp
exports.sendWhatsAppMessage = async (req, res) => {
    try {
        const { number, message } = req.body;

        // Validasi input
        if (!number || !message) {
            return res.status(400).json({
                success: false,
                message: 'Nomor dan pesan diperlukan'
            });
        }

        // Kirim pesan WhatsApp
        const result = await sendMessage(number, message);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Pesan WhatsApp berhasil dikirim',
                data: result.response
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengirim pesan WhatsApp',
                error: result.error
            });
        }
    } catch (error) {
        console.error(
            'Error in sendWhatsAppMessage controller:',
            error.message
        );
        res.status(500).json({
            success: false,
            message: 'Error',
            error: 'Layanan tidak tersedia'
        });
    }
};

// Controller untuk mendapatkan status koneksi WhatsApp
exports.getWhatsAppStatus = (req, res) => {
    try {
        const isConnected = client.info ? true : false;

        res.status(200).json({
            success: true,
            connected: isConnected,
            info: isConnected ? client.info : null
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error internal server',
            error: 'Layanan tidak tersedia'
        });
    }
};

// Fungsi utilitas untuk customer service
exports.sendCustomerServiceMessage = async (
    customerName,
    customerPhone,
    message
) => {
    try {
        // Nomor WhatsApp CS (ganti dengan nomor CS yang diinginkan)
        const csNumber = process.env.CS_WHATSAPP_NUMBER || '6281234567890';

        // Format pesan untuk CS
        const csMessage = `*MASSAGE DARI CLIENT USER*\n\nNama: ${customerName}\nTelepon: ${customerPhone}\n\nPesan:\n${message}`;

        // Kirim pesan ke CS
        return await sendMessage(csNumber, csMessage);
    } catch (error) {
        console.error('Error saat mengirimkan pesan:', error.message);
        return { success: false, error: 'Layanan tidak tersedia' };
    }
};
