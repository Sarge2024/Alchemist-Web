import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Look for a service account key
const files = fs.readdirSync('/mnt/46F84CA3F84C935B/SAGACITAS_SaaS');
const keyFile = files.find(f => f.endsWith('.json') && f.includes('firebase'));

if (keyFile) {
  const serviceAccount = JSON.parse(fs.readFileSync(`/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/${keyFile}`, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();
  
  db.collection('recipes').get().then(snap => {
    console.log(`Found ${snap.size} recipes in Firestore`);
    snap.forEach(doc => {
      if (doc.id.includes("1b0a79b6") || JSON.stringify(doc.data()).includes("Arroz")) {
        console.log(doc.id, doc.data().title);
      }
    });
  }).catch(console.error);
} else {
  console.log("No service account key found");
}
