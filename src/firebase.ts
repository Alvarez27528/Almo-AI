import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1BS1c3KdV_g9G2k6b1iaMORXMGyNmovE",
  authDomain: "fiducia-ai-6affb.firebaseapp.com",
  databaseURL: "https://fiducia-ai-6affb-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fiducia-ai-6affb",
  storageBucket: "fiducia-ai-6affb.firebasestorage.app",
  messagingSenderId: "245454438689",
  appId: "1:245454438689:web:d91d55b271c2a3d9cc7e60",
  measurementId: "G-NBZBYF7C0Y"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with local persistence so the user stays logged in across browser restarts.
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

export const db = getFirestore(app);
