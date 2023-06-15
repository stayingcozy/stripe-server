"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = void 0;
const _1 = require("./");
const firebase_1 = require("./firebase");
const firebase_admin_1 = require("firebase-admin");
/**
 * Business logic for specific webhook event types
 */
const webhookHandlers = {
    'payment_intent.succeeded': async (data) => {
        // Add your business logic here
        // store in db + send confirmation email
    },
    'payment_intent.payment_failed': async (data) => {
        // Add your business logic here
    },
    'payment_intent.created': async (data) => {
        // more logic
    },
    'checkout.session.completed': async (data) => {
        // more logic
    },
    'customer.subscription.deleted': async (data) => {
        // more logic
    },
    'customer.subscription.created': async (data) => {
        // once become customer update Stripe account and Firebase membership status
        const customer = await _1.stripe.customers.retrieve(data.customer);
        const userId = customer.metadata.firebaseUID;
        const userRef = firebase_1.db.collection('users').doc(userId);
        await userRef
            .update({
            activePlans: firebase_admin_1.firestore.FieldValue.arrayUnion(data.id),
        });
    },
    'invoice.payment_succeeded': async (data) => {
        // more logic
    },
    'invoice.payment_failed': async (data) => {
        // if subscription payment failed need to notify user they need to update payment info
        const customer = await _1.stripe.customers.retrieve(data.customer);
        const userSnapshot = await firebase_1.db.collection('users').doc(customer.metadata.firebaseUID).get();
        await userSnapshot.ref.update({ status: 'PAST_DUE' });
        // front end to notify user that they need to update payment info otherwise their membership will be canceled
    },
};
/**
 * Validate the stripe webhook secret, then call the handler for the event type
 */
const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    //   console.log("Req Headers");
    //   console.log(req.headers['stripe-signature']);
    //   console.log("Req Body");
    //   console.log(req['rawBody']);
    //   console.log("Body")
    //   console.log(req['body'])
    const event = _1.stripe.webhooks.constructEvent(req['rawBody'], sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Event type:', event.type);
    console.log('Available event types:', Object.keys(webhookHandlers));
    try {
        await webhookHandlers[event.type](event.data.object);
        res.send({ received: true });
    }
    catch (err) {
        console.error(err);
        res.status(400).send(`Webhook Error: ${err}`);
    }
};
exports.handleStripeWebhook = handleStripeWebhook;
//# sourceMappingURL=webhooks.js.map