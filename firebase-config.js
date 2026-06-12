// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBoZuT4PTq8a8VLUINCRpCZJ2U7MHcnduQ",
  authDomain: "tic-tac-toe-arena-5bd9c.firebaseapp.com",
  projectId: "tic-tac-toe-arena-5bd9c",
  storageBucket: "tic-tac-toe-arena-5bd9c.firebasestorage.app",
  messagingSenderId: "761598195073",
  appId: "1:761598195073:web:c0a0d30b0ce20173ba2480",
  measurementId: "G-6H5Q2YMBKH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);