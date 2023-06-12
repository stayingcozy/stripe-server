// Environment Variables (Stripe API key)
import { config } from "dotenv";
if (process.env.NODE_ENV !== 'production') {
    config();
}

// Initialize stripe
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET, {
    apiVersion: '2022-11-15',
});

// Start the API with Express
import { app } from './api';
const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`API available on http://localhost:${port}`));
