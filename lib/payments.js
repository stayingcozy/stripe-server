"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = void 0;
const _1 = require("./");
// Create payment intent with a specific amount
async function createPaymentIntent(amount) {
    const paymentIntent = await _1.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        // receipt_email: ''
    });
    return paymentIntent;
}
exports.createPaymentIntent = createPaymentIntent;
//# sourceMappingURL=payments.js.map