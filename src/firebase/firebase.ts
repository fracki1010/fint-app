// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPx1KLsH2Rqbljt-WZUPrWXHb61Z8UZa4",
  authDomain: "fint-guard.firebaseapp.com",
  projectId: "fint-guard",
  storageBucket: "fint-guard.firebasestorage.app",
  messagingSenderId: "278124006688",
  appId: "1:278124006688:web:ed854f7e49e907493b1b45",
  measurementId: "G-WXDLS69E3Z",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
