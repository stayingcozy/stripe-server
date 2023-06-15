import { stripe } from './';
import { db } from './firebase';
import Stripe from 'stripe';
import { getOrCreateCustomers } from './customers';
import { firestore } from 'firebase-admin';

/** 
 * Attaches a payment method to the Stripe customer,
 * subscribes to a Stripe plan, and saves the plan to Firestore
 */
export async function createSubscription(
    userId: string,
    plan: string,
    payment_method: string 
) {
    const customer = await getOrCreateCustomers(userId);

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(payment_method, { customer: customer.id });

    // Set it as the default payment method
    await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: payment_method },
    });

    const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ plan }],
        expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const payment_intent = invoice.payment_intent as Stripe.PaymentIntent;

    // Update the user's status
    if (payment_intent.status == 'succeeded') {
        await db
            .collection('users')
            .doc(userId)
            .set(
                {
                    stripeCustomerId: customer.id,
                    activePlans: firestore.FieldValue.arrayUnion(plan),
                },
                { merge: true }
            );
    }

    return subscription;
}

/**
 * Cancels an active subscription, syncs the data in Firestore
 */
export async function cancelSubscription(
  userId: string,
  subscriptionId: string
) {
    console.log("cancelSub.. f()")
    console.log(userId)
    console.log(subscriptionId)
    console.log("end cancelSub.. f()")

    const customer = await getOrCreateCustomers(userId);
    if (customer.metadata.firebaseUID !== userId) {
    throw Error('Firebase UID does not match Stripe Customer');
    }

    console.log("checkpoint for stripe del")
    //   const subscription = await stripe.subscriptions.del(subscriptionId);
    // const subscription = await stripe.subscriptionItems.del(subscriptionId);
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    console.log("end checkpoint for stripe del")

    // Cancel at end of period
    // const subscription = stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    // need webhook to watch subscripton and when it ends update stripe & firebase

    if (subscription.status === 'canceled') {
        // Firebase stores as price (subscription.subscription_item.price)
        
        // list all subscription items
        const subscriptionItems = await stripe.subscriptionItems.list({
            subscription: subscription.id,
        });

        // Should only be one price item
        const priceToRemove = subscriptionItems.data[0].price.id;

        // Remove from firebase
        await db
            .collection('users')
            .doc(userId)
            .update({
            activePlans: firestore.FieldValue.arrayRemove(priceToRemove),
            });
    }

    return subscription;
}


/** 
 * Returns all the subscriptions linked to a Firebase userID in Stripe
 */

export async function listSubscriptions(userId: string) {
    const customer = await getOrCreateCustomers(userId);
    const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
    });

    return subscriptions;
};
