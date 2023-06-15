import { stripe } from './';
import Stripe from 'stripe';
import { Request, Response } from 'express';
import { db } from './firebase';
import { firestore } from 'firebase-admin';

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
    'checkout.session.completed': async (data: Stripe.Event.Data) => {
        // more logic
    },
    'customer.subscription.deleted': async (data: Stripe.Subscription) => {
        // more logic
    },
    'customer.subscription.created': async (data: Stripe.Subscription) => {
      // once become customer update Stripe account and Firebase membership status
      const customer = await stripe.customers.retrieve( data.customer as string ) as Stripe.Customer;
      const userId = customer.metadata.firebaseUID;
      const userRef = db.collection('users').doc(userId);

        await userRef
            .update({
              activePlans: firestore.FieldValue.arrayUnion(data.id),
            })
    },
    'invoice.payment_succeeded': async (data: Stripe.Invoice) => {
      // more logic
    },
    'invoice.payment_failed': async (data: Stripe.Invoice) => {
      // if subscription payment failed need to notify user they need to update payment info
      const customer = await stripe.customers.retrieve( data.customer as string ) as Stripe.Customer;
      const userSnapshot = await db.collection('users').doc(customer.metadata.firebaseUID).get();
      await userSnapshot.ref.update({ status: 'PAST_DUE' });
      // front end to notify user that they need to update payment info otherwise their membership will be canceled
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