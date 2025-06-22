import { storage } from '../lib/firebase/config';
import { ref, uploadBytes } from 'firebase/storage';
import fs from 'fs';
import path from 'path';

async function uploadVenueConfig() {
  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), 'data', 'seats-data-palenque-victoria.json');
    const fileContent = fs.readFileSync(filePath);

    // Create a reference to the file in Firebase Storage
    const fileRef = ref(storage, 'seats-data-palenque-victoria.json');

    // Upload the file
    await uploadBytes(fileRef, fileContent, {
      contentType: 'application/json',
    });

    console.log('Venue configuration uploaded successfully to Firebase Storage!');
  } catch (error) {
    console.error('Error uploading venue configuration:', error);
  }
}

uploadVenueConfig();
