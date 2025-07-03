import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";
dotenv.config();

// Cargar las credenciales de Firebase desde el archivo firebase.json
const serviceAccountPath = resolve(process.cwd(), "../firebase.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const storage = admin.storage();

export { db, storage }; 