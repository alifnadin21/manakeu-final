const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Membuat instance WhatsApp client
const client = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Event saat QR code siap untuk di-scan
client.on('qr', (qr) => {
    console.log('QR CODE UNTUK WHATSAPP:');
    qrcode.generate(qr, { small: true });
});

// Event saat client sudah siap
client.on('ready', () => {
    console.log('WhatsApp client siap!');
});

// Inisialisasi koneksi
if (process.env.WHATSAPP_ENABLED === 'true')
    client
        .initialize()
        .catch((error) =>
            console.error('WhatsApp initialization failed:', error.message)
        );

// Fungsi untuk mengirim pesan WhatsApp
const sendMessage = async (number, message) => {
    try {
        if (process.env.WHATSAPP_ENABLED !== 'true' || !client.info)
            return { success: false, error: 'WhatsApp belum terhubung' };
        if (
            typeof number !== 'string' ||
            !/^\+?[1-9]\d{7,14}$/.test(number) ||
            typeof message !== 'string' ||
            !message.trim() ||
            message.length > 4000
        )
            return { success: false, error: 'Nomor atau pesan tidak valid' };
        // Format nomor untuk WhatsApp API (tambahkan kode negara jika belum ada)
        const formattedNumber = number.includes('@c.us')
            ? number
            : `${number.replace(/\D/g, '')}@c.us`;

        // Kirim pesan
        const response = await client.sendMessage(formattedNumber, message);
        return { success: true, response };
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    client,
    sendMessage
};
