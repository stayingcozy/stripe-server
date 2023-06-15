import express, {NextFunction, Request, Response} from 'express';
import { auth } from './firebase';

export const app = express();

// all input will be string converts to javascript object
// app.use( express.json() ) // middleware

import cors from 'cors';

/// MIDDLEWARE ///

// allows server and front end code to run different ports
app.use( cors({ origin: true }));

// Sets rawbody for webhook handling
app.use(
    express.json({
      verify: (req, res, buffer) => (req['rawBody'] = buffer),
    })
);

app.use(decodeJWT);

/**
 * Decodes the JSON Web toekn sent via the frontend app
 * Makes the currentUser (firebase) data available on the body.
 */
async function decodeJWT(req: Request, res: Response, next: NextFunction) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];

        try {
            const decodedToken = await auth.verifyIdToken(idToken);
            req['currentUser'] = decodedToken;
        } catch (err) {
            console.log(err)
        }
    }

    next();
}



/// HELPERS ///

import { createStripeCheckoutSession } from './checkout';
import { createPaymentIntent } from './payments';
import { handleStripeWebhook } from './webhooks';
import { createSetupIntent, listPaymentMethods } from './customers';
import { cancelSubscription, createSubscription, listSubscriptions } from './billing';


// Catch async errors when awaiting promises
function runAsync(callback: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        callback(req, res, next).catch(next);
    };
}

/**
 * Throws an error if the currentUser does not exist on the request
 *  */ 

function validateUser(req: Request) {
    const user = req['currentUser'];
    if(!user) {
        throw new Error(
            'You must be logged in to make this request. i.e. Authorization: Bearer <token>'
        );
    }

    return user;
}

/// Main API ///

app.post('/test', (req: Request, res: Response) => {

    const amount = req.body.amount;

    res.status(200).send({ with_tax: amount * 7 });

});

/**
 * Checkouts
 */
app.post(
    '/checkouts/', 
    runAsync( async ({ body }: Request, res: Response) => {
        res.send(
            await createStripeCheckoutSession(body.line_items)
        );
    })
);

/**
 * Payment Intents API
 */
app.post(
    '/payments',
    runAsync(async ({body}: Request, res: Response) => {
        res.send(
            await createPaymentIntent(body.amount)
        );
    })
)

/**
 * * Webhooks
 */

// Handle webhooks
app.post('/hooks', runAsync(handleStripeWebhook));

/**
 * Customers and Setup Intents
 */

// Save a card on the customer record with a SetupIntent
app.post(
    '/wallet',
    runAsync(async (req: Request, res: Response) => {
        const user = validateUser(req);
        const setupIntent = await createSetupIntent(user.uid);
        res.send(setupIntent);
    })
);

// Retrieve all cards attached to a customer 
app.get(
    '/wallet',
    runAsync(async (req: Request, res: Response) => {
        const user = validateUser(req);
        
        const wallet = await listPaymentMethods(user.uid);
        res.send(wallet.data);
    })
);


/** 
 * Billing and Recurring Subscriptions
 */

// Create and charge new Subscription
app.post(
    '/subscriptions/',
    runAsync(async (req: Request, res: Response) => {
        const user = validateUser(req);
        const { plan, payment_method } = req.body;
        const subscription = await createSubscription(user.uid, plan, payment_method);
        res.send(subscription); // result send back down to the client
    })
)

// Get all subscriptions for a customer
app.get(
    '/subscriptions/',
    runAsync(async (req: Request, res: Response) => {
        const user = validateUser(req);

        const subscriptions = await listSubscriptions(user.uid);

        res.send(subscriptions.data);
    })
);

// Unsubscribe or cancel a subscription
app.patch(
    '/subscriptions/:id',
    runAsync(async (req: Request, res: Response) => {
      const user = validateUser(req);
      console.log("url stripe id and user")
      console.log(req.params.id)
      console.log(user.uid)
      console.log("id done")
      res.send(await cancelSubscription(user.uid, req.params.id));
    })
  );