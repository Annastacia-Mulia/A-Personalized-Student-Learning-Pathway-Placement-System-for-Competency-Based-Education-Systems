import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzzbeyr3OszM0cIph2_Z8ValUzTprVbbU",
  authDomain: "pathguider-89eb9.firebaseapp.com",
  projectId: "pathguider-89eb9",
  storageBucket: "pathguider-89eb9.appspot.com",
  messagingSenderId: "674580122487",
  appId: "1:674580122487:web:df9ce81fbe850191106f72",
  measurementId: "G-555X22NZ2G",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app); // <-- Add this
export const googleProvider = new GoogleAuthProvider();
