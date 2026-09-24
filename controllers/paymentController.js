const crypto = require('crypto');
const db = require('../config/database');
const service = require('../utils/midtransService');
const h = require('../utils/http');
async function payment(orderId, user) {
    const [rows] = await db
        .promise()
        .query(
            'SELECT p.*, t.ID_User FROM Payments p JOIN transaksi t ON p.ID_Transaksi = t.ID_Transaksi WHERE p.Order_ID = ?',
            [orderId]
        );
    if (!rows.length) h.fail(404, 'Order tidak ditemukan');
    if (user) h.own(user, rows[0]);
    return rows[0];
}
async function sync(order, status) {
    if (Number(status.gross_amount) !== Number(order.Amount))
        h.fail(409, 'Jumlah pembayaran tidak cocok');
    const state =
        status.transaction_status === 'capture' &&
        status.fraud_status !== 'accept'
            ? 'pending'
            : status.transaction_status;
    h.choice(state, [
        'pending',
        'capture',
        'settlement',
        'deny',
        'cancel',
        'expire',
        'refund',
        'partial_refund',
        'authorize'
    ]);
    await db
        .promise()
        .query(
            'UPDATE Payments SET Status = ?, Updated_At = NOW() WHERE Order_ID = ?',
            [state, order.Order_ID]
        );
    return state;
}
exports.createPayment = h.wrap(async (req, res) => {
    const transaksiId = h.id(req.body.transaksiId);
    if (req.body.paymentMethod && req.body.paymentMethod !== 'snap')
        h.fail(400, 'Gunakan metode snap');
    if (!process.env.MIDTRANS_SERVER_KEY)
        h.fail(503, 'Midtrans belum dikonfigurasi');
    const order = await h.transaction(async (c) => {
        const [rows] = await c.query(
            'SELECT * FROM transaksi WHERE ID_Transaksi = ? FOR UPDATE',
            [transaksiId]
        );
        const trans = h.own(req.user, rows[0]);
        if (
            !Number.isSafeInteger(Number(trans.Jumlah)) ||
            Number(trans.Jumlah) <= 0
        )
            h.fail(400, 'Midtrans membutuhkan jumlah rupiah bulat positif');
        const [existing] = await c.query(
            "SELECT * FROM Payments WHERE ID_Transaksi = ? AND Status NOT IN ('deny','cancel','expire') ORDER BY ID_Payment DESC LIMIT 1",
            [transaksiId]
        );
        if (existing.length) {
            if (existing[0].Status === 'pending' && existing[0].Payment_Token)
                return existing[0];
            h.fail(409, 'Order sudah ada; periksa status pembayaran');
        }
        const record = {
            ID_Transaksi: transaksiId,
            Order_ID:
                'MK-' +
                transaksiId +
                '-' +
                crypto.randomBytes(10).toString('hex'),
            Payment_Method: 'snap',
            Amount: trans.Jumlah,
            Status: 'creating',
            Created_At: new Date(),
            Updated_At: new Date()
        };
        await c.query('INSERT INTO Payments SET ?', [record]);
        return record;
    });
    if (order.Payment_Token)
        return res.json({
            status: 'success',
            data: {
                orderId: order.Order_ID,
                token: order.Payment_Token,
                redirectUrl: order.Payment_URL,
                amount: order.Amount,
                status: order.Status
            }
        });
    // Persist the order before contacting Midtrans, retaining uncertain attempts for reconciliation.
    const result = await service.createTransaction({
        orderId: order.Order_ID,
        amount: order.Amount,
        firstName: req.body.firstName || req.user.Nama,
        lastName: req.body.lastName,
        email: req.user.Email,
        phone: req.body.phone
    });
    await db
        .promise()
        .query(
            "UPDATE Payments SET Payment_Token = ?, Payment_URL = ?, Status = 'pending', Updated_At = NOW() WHERE Order_ID = ?",
            [result.token, result.redirect_url, order.Order_ID]
        );
    res.status(201).json({
        status: 'success',
        data: {
            orderId: order.Order_ID,
            token: result.token,
            redirectUrl: result.redirect_url,
            amount: order.Amount,
            status: 'pending'
        }
    });
});
exports.checkStatus = h.wrap(async (req, res) => {
    const order = await payment(
        h.text(req.params.orderId, 'Order ID', 100),
        req.user
    );
    const data = await service.getStatus(order.Order_ID);
    const state = await sync(order, data);
    res.json({
        status: 'success',
        data: {
            orderId: order.Order_ID,
            transactionStatus: state,
            paymentType: data.payment_type,
            amount: data.gross_amount,
            time: data.transaction_time
        }
    });
});
exports.handleNotification = h.wrap(async (req, res) => {
    service.verifyNotification(req.body);
    const order = await payment(req.body.order_id);
    const data = await service.getStatus(order.Order_ID);
    await sync(order, data);
    res.json({ status: 'success', message: 'Notification processed' });
});
