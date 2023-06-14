import { stripe } from './';
import Stripe from 'stripe';
import { Request, Response } from 'express';

/**
 * Business logic for specific webhook event types
 */
const webhookHandlers = {
    'payment_intent.succeeded': async (data: Stripe.PaymentIntent) => {
    // Add your business logic here
        // store in db + send confirmation email
    },
    'payment_intent.payment_failed': async (data: Stripe.PaymentIntent) => {
    // Add your business logic here
    },
    'payment_intent.created': async (data: Stripe.PaymentIntent) => {
        // more logic
    },

};

/**
 * Validate the stripe webhook secret, then call the handler for the event type
 */
export const handleStripeWebhook = async(req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
//   console.log("Req Headers");
//   console.log(req.headers['stripe-signature']);
//   console.log("Req Body");
//   console.log(req['rawBody']);
//   console.log("Body")
//   console.log(req['body'])
  const event = stripe.webhooks.constructEvent(req['rawBody'], sig, process.env.STRIPE_WEBHOOK_SECRET);

  console.log('Event type:', event.type);
  console.log('Available event types:', Object.keys(webhookHandlers));

  try {
    await webhookHandlers[event.type](event.data.object);
    res.send({received: true});
  } catch (err) {
    console.error(err)
    res.status(400).send(`Webhook Error: ${err}`);
  }
}