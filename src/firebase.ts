// Initialize Firebase Admin resources

import * as firebaseAdmin from 'firebase-admin';



// firebaseAdmin.initializeApp();
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
        projectId: process.env.PROJECT_ID,
        clientEmail: process.env.CLIENT_EMAIL,
        privateKey: process.env.PRIVATE_KEY, 
    })
});

export const db = firebaseAdmin.firestore();
export const auth = firebaseAdmin.auth();