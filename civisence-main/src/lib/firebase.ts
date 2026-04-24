import { initializeApp } from "firebase/app";
import { getAuth, browserSessionPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
    apiKey: "AIzaSyDTmSDcorOGfnm2ECO5p4fwnF0rVH7710E",
    authDomain: "datascraping-65680.firebaseapp.com",
    databaseURL: "https://datascraping-65680-default-rtdb.firebaseio.com",
    projectId: "datascraping-65680",
    storageBucket: "datascraping-65680.firebasestorage.app",
    messagingSenderId: "687124722472",
    appId: "1:687124722472:web:54ce3f40a902a22828d61d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use session-scoped persistence so each browser tab has its own login state.
// This allows citizen, authority, and admin to be open in separate tabs simultaneously.
setPersistence(auth, browserSessionPersistence);
export const db = getFirestore(app);
