// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDP7TSGwJs_iIvWQ71F_WlWpr9Sqwn_78Q",
  authDomain: "pharmacy-dashboard-d496a.firebaseapp.com",
  projectId: "pharmacy-dashboard-d496a",
  storageBucket: "pharmacy-dashboard-d496a.firebasestorage.app",
  messagingSenderId: "144808325961",
  appId: "1:144808325961:web:044d29d644c2462b8be098",
  measurementId: "G-M3ZFT1CY63"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);