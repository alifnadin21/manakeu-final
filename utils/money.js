// Sum decimal currency in integer cents to avoid cumulative binary float errors.
function cents(value) {
    const text = String(value ?? 0);
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(text))
        throw new TypeError('Invalid decimal money');
    const negative = text.startsWith('-');
    const [whole, fraction = ''] = text.replace('-', '').split('.');
    const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
    return negative ? -amount : amount;
}
function decimal(value) {
    const negative = value < 0n;
    const amount = negative ? -value : value;
    return (
        (negative ? '-' : '') +
        String(amount / 100n) +
        '.' +
        String(amount % 100n).padStart(2, '0')
    );
}
const sum = (values) =>
    decimal(values.reduce((total, value) => total + cents(value), 0n));
const subtract = (left, right) => decimal(cents(left) - cents(right));
module.exports = { sum, subtract };
