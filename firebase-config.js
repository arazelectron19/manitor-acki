// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDYP9zfq4qTDM-HGZ0OpQ_xyYwwOr_dfYM",
  authDomain: "android-acki.firebaseapp.com",
  projectId: "android-acki",
  storageBucket: "android-acki.firebasestorage.app",
  messagingSenderId: "908962209785",
  appId: "1:908962209785:web:22a28fc0debc874175a728"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);