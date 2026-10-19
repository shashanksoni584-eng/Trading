// Lead capture in Firestore (browser). Web config keys are public by design; protect data with firestore.rules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHlKtCd8OHn9NUUZZaDikI1lW6K2EPJP8",
  authDomain: "trading-d2449.firebaseapp.com",
  projectId: "trading-d2449",
  storageBucket: "trading-d2449.firebasestorage.app",
  messagingSenderId: "988641792205",
  appId: "1:988641792205:web:7b88216961168074a05984"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function saveLead(lead) {          // never blocks payment for more than 2.5s
  return Promise.race([
    addDoc(collection(db, "leads"), { ...lead, status: "initiated", createdAt: serverTimestamp() }),
    new Promise((_, rej) => setTimeout(rej, 2500))
  ]);
}
