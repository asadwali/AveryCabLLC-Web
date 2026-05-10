import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByI5ajMjJgLmdzDVjFBsgoijP_QXkbpEo",
  authDomain: "avery-cab-llc.firebaseapp.com",
  projectId: "avery-cab-llc",
  storageBucket: "avery-cab-llc.firebasestorage.app",
  messagingSenderId: "86909339188",
  appId: "1:86909339188:web:9fcf13dcb55b8d0c87ac61",
  measurementId: "G-X1EE9KL8XE",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
