
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA84qlQszxjBbQyaGi5l_lI-ag-TePxj0c",
  authDomain: "gcash-6531a.firebaseapp.com",
  projectId: "gcash-6531a",
  storageBucket: "gcash-6531a.appspot.com",
  messagingSenderId: "121274334390",
  appId: "1:121274334390:web:504e9e767b75e369c43a17",
  measurementId: "G-2D5B2KD8NG"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore=getFirestore(app);
export { app, firestore };
const db = firestore;
export default db;