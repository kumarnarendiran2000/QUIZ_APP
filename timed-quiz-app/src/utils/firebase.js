// src/utils/firebase.js
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyC9RDq7evbkgc3YpfWm40t98VdVKys-HYM",
    authDomain: "timed-quiz-app.firebaseapp.com",
    projectId: "timed-quiz-app",
    storageBucket: "timed-quiz-app.firebasestorage.app",
    messagingSenderId: "661163240244",
    appId: "1:661163240244:web:14204b364ae97e040f9361"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)
