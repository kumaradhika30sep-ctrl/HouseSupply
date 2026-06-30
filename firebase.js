// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDpMzWqCXgnWZOjkfamkz72FJm0ILubb0",
  authDomain: "housesupply-50385.firebaseapp.com",
  projectId: "housesupply-50385",
  storageBucket: "housesupply-50385.firebasestorage.app",
  messagingSenderId: "434327954236",
  appId: "1:434327954236:web:563c3abb1da2b0ed32b439",
  measurementId: "G-ZJ695CZDRL"
};

const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);
