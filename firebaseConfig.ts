// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOO53JZT3QYO5Kiv-VXNHrdnxVb_118sA",
  authDomain: "schoolbell0409-9e994.firebaseapp.com",
  projectId: "schoolbell0409-9e994",
  storageBucket: "schoolbell0409-9e994.appspot.com", // 수정됨 (.app → .appspot.com)
  messagingSenderId: "190388755626",
  appId: "1:190388755626:web:2060f0abb0ef90872484d3",
  measurementId: "G-J9R797G4W9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
