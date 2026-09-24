const axios = require('axios');
const crypto = require('crypto');
const h = require('./http');
function settings() {
    const key = process.env.MIDTRANS_SERVER_KEY;
    if (!key) h.fail(503, 'Midtrans belum dikonfigurasi');
    const production = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    return {
        key,
        snap: production
            ? 'https://app.midtrans.com'
            : 'https://app.sandbox.midtrans.com',
        api: production
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com'
    };
}
async function request(method, url, data, key) {
    try {
        return (
            await axios({
                method,
                url,
                data,
                auth: { username: key, password: '' },
                timeout: 10000,
                headers: { Accept: 'application/json' },
                maxRedirects: 0
            })
        ).data;
    } catch {
        h.fail(
            502,
            'Midtrans tidak tersedia; periksa status order sebelum mencoba kembali'
        );
    }
}
function verifyNotification(body) {
    const { key } = settings();
    if (
        !body ||
        typeof body.order_id !== 'string' ||
        typeof body.status_code !== 'string' ||
        typeof body.gross_amount !== 'string' ||
        !/^[a-f0-9]{128}$/i.test(body.signature_key || '')
    )
        h.fail(401, 'Signature Midtrans tidak valid');
    const expected = crypto
        .createHash('sha512')
        .update(body.order_id + body.status_code + body.gross_amount + key)
        .digest();
    if (
        !crypto.timingSafeEqual(
            expected,
            Buffer.from(body.signature_key, 'hex')
        )
    )
        h.fail(401, 'Signature Midtrans tidak valid');
}
module.exports = {
    async createTransaction(details) {
        const c = settings();
        const amount = Number(details.amount);
        if (!Number.isSafeInteger(amount) || amount <= 0)
            h.fail(400, 'Midtrans membutuhkan jumlah rupiah bulat positif');
        const data = await request(
            'POST',
            c.snap + '/snap/v1/transactions',
            {
                transaction_details: {
                    order_id: details.orderId,
                    gross_amount: amount
                },
                customer_details: {
                    first_name: details.firstName,
                    last_name: details.lastName,
                    email: details.email,
                    phone: details.phone
                }
            },
            c.key
        );
        if (!data.token || !data.redirect_url)
            h.fail(502, 'Respons Midtrans tidak valid');
        return { ...data, orderId: details.orderId };
    },
    async getStatus(orderId) {
        const c = settings();
        const data = await request(
            'GET',
            c.api + '/v2/' + encodeURIComponent(orderId) + '/status',
            undefined,
            c.key
        );
        if (data.order_id !== orderId || !data.transaction_status)
            h.fail(502, 'Status Midtrans tidak valid');
        return data;
    },
    verifyNotification,
    async handleNotification(body) {
        verifyNotification(body);
        return this.getStatus(body.order_id);
    }
};
