const axios = require('axios');
const service = require('./midtransService');
function coreRequest(method, path, data) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey)
        return Promise.reject(new Error('Midtrans belum dikonfigurasi'));
    const base =
        process.env.MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
    return axios({
        method,
        url: base + path,
        data,
        auth: { username: serverKey, password: '' },
        timeout: 10000,
        maxRedirects: 0
    }).then((r) => r.data);
}
exports.createMidtransClient = () => ({
    createTransaction: (parameter) =>
        service.createTransaction({
            orderId: parameter.transaction_details.order_id,
            amount: parameter.transaction_details.gross_amount,
            firstName: parameter.customer_details?.first_name,
            lastName: parameter.customer_details?.last_name,
            email: parameter.customer_details?.email,
            phone: parameter.customer_details?.phone
        })
});
exports.createCoreApiClient = () => ({
    charge: (parameter) => coreRequest('POST', '/v2/charge', parameter),
    status: (orderId) => service.getStatus(orderId),
    cardToken: async (parameter) => {
        if (!process.env.MIDTRANS_CLIENT_KEY)
            throw new Error('Midtrans client key belum dikonfigurasi');
        const base =
            process.env.MIDTRANS_IS_PRODUCTION === 'true'
                ? 'https://api.midtrans.com'
                : 'https://api.sandbox.midtrans.com';
        return (
            await axios.get(base + '/v2/token', {
                params: {
                    ...parameter,
                    client_key: process.env.MIDTRANS_CLIENT_KEY
                },
                timeout: 10000,
                maxRedirects: 0
            })
        ).data;
    }
});
