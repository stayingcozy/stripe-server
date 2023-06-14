import { stripe } from './';

// Create payment intent with a specific amount
export async function createPaymentIntent(amount: number) {
    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        // receipt_email: ''
    })

    return paymentIntent;
}