// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


const firebaseConfig = {
  apiKey: "AIzaSyDVQNDJWduvm4_oVM3Rqj46jtjeEMmYqmM",
  authDomain: "half-moon-lake-yoga.firebaseapp.com",
  projectId: "half-moon-lake-yoga",
  storageBucket: "half-moon-lake-yoga.firebasestorage.app",
  messagingSenderId: "936895918219",
  appId: "1:936895918219:web:7c35b68c24d54c9faa248e",
  measurementId: "G-FKCNZ5VTF2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));