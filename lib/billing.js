"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSubscriptions = exports.cancelSubscription = exports.createSubscription = void 0;
const _1 = require("./");
const firebase_1 = require("./firebase");
const customers_1 = require("./customers");
const firebase_admin_1 = require("firebase-admin");
/**
 * Attaches a payment method to the Stripe customer,
 * subscribes to a Stripe plan, and saves the plan to Firestore
 */
async function createSubscription(userId, plan, payment_method) {
    const customer = await (0, customers_1.getOrCreateCustomers)(userId);
    // Attach the payment method to the customer
    await _1.stripe.paymentMethods.attach(payment_method, { customer: customer.id });
    // Set it as the default payment method
    await _1.stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: payment_method },
    });
    const subscription = await _1.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ plan }],
        expand: ['latest_invoice.payment_intent'],
    });
    const invoice = subscription.latest_invoice;
    const payment_intent = invoice.payment_intent;
    // Update the user's status
    if (payment_intent.status == 'succeeded') {
        await firebase_1.db
            .collection('users')
            .doc(userId)
            .set({
            stripeCustomerId: customer.id,
            activePlans: firebase_admin_1.firestore.FieldValue.arrayUnion(plan),
        }, { merge: true });
    }
    return subscription;
}
exports.createSubscription = createSubscription;
/**
 * Cancels an active subscription, syncs the data in Firestore
 */
async function cancelSubscription(userId, subscriptionId) {
    const customer = await (0, customers_1.getOrCreateCustomers)(userId);
    if (customer.metadata.firebaseUID !== userId) {
        throw Error('Firebase UID does not match Stripe Customer');
    }
    //   const subscription = await stripe.subscriptions.del(subscriptionId);
    const subscription = await _1.stripe.subscriptions.cancel(subscriptionId);
    // Cancel at end of period
    // const subscription = stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    // need webhook to watch subscripton and when it ends update stripe & firebase
    if (subscription.status === 'canceled') {
        // Firebase stores as price (subscription.subscription_item.price)
        // list all subscription items
        const subscriptionItems = await _1.stripe.subscriptionItems.list({
            subscription: subscription.id,
        });
        // Should only be one price item
        const priceToRemove = subscriptionItems.data[0].price.id;
        // Remove from firebase
        await firebase_1.db
            .collection('users')
            .doc(userId)
            .update({
            activePlans: firebase_admin_1.firestore.FieldValue.arrayRemove(priceToRemove),
        });
    }
    return subscription;
}
exports.cancelSubscription = cancelSubscription;
/**
 * Returns all the subscriptions linked to a Firebase userID in Stripe
 */
async function listSubscriptions(userId) {
    const customer = await (0, customers_1.getOrCreateCustomers)(userId);
    const subscriptions = await _1.stripe.subscriptions.list({
        customer: customer.id,
    });
    return subscriptions;
}
exports.listSubscriptions = listSubscriptions;
;
//# sourceMappingURL=billing.js.map