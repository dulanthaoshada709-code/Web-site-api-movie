import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Firebase web configuration (wa-sendr-bot project)
const firebaseConfig = {
  apiKey: "AIzaSyBEve180MsxdPbrqTUm7kG_oMG2XwnI8qg",
  authDomain: "wa-sendr-bot.firebaseapp.com",
  databaseURL: "https://wa-sendr-bot-default-rtdb.firebaseio.com",
  projectId: "wa-sendr-bot",
  storageBucket: "wa-sendr-bot.firebasestorage.app",
  messagingSenderId: "1093291845916",
  appId: "1:1093291845916:web:0582ff2ec230f7085d72d9",
  measurementId: "G-8BD8KW25TS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
