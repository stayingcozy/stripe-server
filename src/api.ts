import express, {NextFunction, Request, Response} from 'express';

export const app = express();

// all input will be string converts to javascript object
// app.use( express.json() ) // middleware

import cors from 'cors';
// allows server and front end code to run different ports
app.use( cors({ origin: true }));

// Sets rawbody for webhook handling
app.use(
    express.json({
      verify: (req, res, buffer) => (req['rawBody'] = buffer),
    })
);


app.post('/test', (req: Request, res: Response) => {

    const amount = req.body.amount;

    res.status(200).send({ with_tax: amount * 7 });

});

import { createStripeCheckoutSession } from './checkout';
import { createPaymentIntent } from './payments';
import { handleStripeWebhook } from './webhooks';

// Catch async errors when awaiting promises
function runAsync(callback: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        callback(req, res, next).catch(next);
    };
}

// Checkouts
app.post(
    '/checkouts/', 
    runAsync( async ({ body }: Request, res: Response) => {
        res.send(
            await createStripeCheckoutSession(body.line_items)
        );
    })
);

// Payment intents API
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