import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  try {
    const recipesCol = collection(db, "recipes");
    const q = query(recipesCol, limit(5));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("No recipes found in recipes collection.");
      
      // Let's try 'dishes' collection
      const dishesCol = collection(db, "dishes");
      const dishesSnap = await getDocs(query(dishesCol, limit(5)));
      if (dishesSnap.empty) {
        console.log("No recipes found in dishes collection either.");
      } else {
        dishesSnap.forEach(doc => console.log(JSON.stringify({ id: doc.id, ...doc.data() }, null, 2)));
      }
    } else {
      snapshot.forEach(doc => {
        console.log(JSON.stringify({ id: doc.id, ...doc.data() }, null, 2));
      });
    }
  } catch (error) {
    console.error("Error fetching from Firebase:", error);
  }
}

main();
