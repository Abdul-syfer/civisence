import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAKLQcvWg08ByNSzlziar1v3M6r6lge_KM",
    authDomain: "civicsense-ac448.firebaseapp.com",
    databaseURL: "https://civicsense-ac448-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "civicsense-ac448",
    storageBucket: "civicsense-ac448.firebasestorage.app",
    messagingSenderId: "1007984168247",
    appId: "1:1007984168247:web:2183d042704623f34edeb2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
