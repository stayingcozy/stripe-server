import { stripe } from './';
import Stripe from 'stripe';

// Creates a Stripe Checkout session with line items
export async function createStripeCheckoutSession(
    line_items: Stripe.Checkout.SessionCreateParams.LineItem[]
) {
    // Past Example Item
    // {
    //     name: 'T-shirt',
    //     description: 'Comfortable cotton t-shirt',
    //     images: ['https://example.com/t-shirt.png'],
    //     amount: 500,
    //     currency: 'usd',
    //     quantity: 1,
    // }

    // Current Example Item
    // {
        // price_data: {
        //     currency: 'usd',
        //     unit_amount: 2000,
        //     product_data: {
        //       name: 'T-shirt',
        //       description: 'Comfortable cotton t-shirt',
        //       images: ['https://example.com/t-shirt.png'],
        //     },
        //   },
    //     quantity: 1,
    // }

    const url = process.env.WEBAPP_URL;
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${url}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${url}/failed`,
    });

    return session;
}