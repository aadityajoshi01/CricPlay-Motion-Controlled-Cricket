import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3unFWOWWEaW5QrcuFuXV7XrJqH7iUg7Y",
  authDomain: "cricplay-2e372.firebaseapp.com",
  databaseURL: "https://cricplay-2e372-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cricplay-2e372",
  storageBucket: "cricplay-2e372.firebasestorage.app",
  messagingSenderId: "964560274030",
  appId: "1:964560274030:web:56a094dd0d8ab1955c9c7f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, onValue };
