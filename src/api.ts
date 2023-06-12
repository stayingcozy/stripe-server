import express, {Request, Response} from 'express';
export const app = express();

// all input will be string converts to javascript object
app.use( express.json() ) // middleware

import cors from 'cors';
// allows server and front end code to run different ports
app.use( cors({ origin: true }));

app.post('/test', (req: Request, res: Response) => {

    const amount = req.body.amount;

    res.status(200).send({ with_tax: amount * 7 });

});