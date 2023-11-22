import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

import admin from "firebase-admin";
const serviceAccount = require("../../fireBaseAuthServices.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export async function sendNotification(token, title, body, type) {
  const message = {
    token: token, // or topic, condition, tokens, etc.
    notification: {
      title: title,
      body: body,
    },
    data: {
      type: type,

    },
    android: {
      ttl: 3600 * 1000, // time-to-live for Android devices
    },
    apns: {
      headers: {
        "apns-priority": "10", // priority for iOS devices
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent notification message:", response);
    return response;
  } catch (error) {
    console.log("Error sending notification message:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}