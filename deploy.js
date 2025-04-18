import { exec as execCallback } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const exec = promisify(execCallback);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the service worker is copied correctly
const serviceWorkerSrc = path.join(__dirname, 'public', 'firebase-messaging-sw.js');
const serviceWorkerDest = path.join(__dirname, 'dist', 'firebase-messaging-sw.js');

async function deploy() {
  try {
    // Read the service worker file
    let serviceWorkerContent = fs.readFileSync(serviceWorkerSrc, 'utf8');
    
    // Replace placeholder values with actual environment variables
    serviceWorkerContent = serviceWorkerContent
      .replace('<VITE_FB_API_KEY>', process.env.VITE_FB_API_KEY)
      .replace('<VITE_FB_AUTH_DOMAIN>', process.env.VITE_FB_AUTH_DOMAIN)
      .replace('<VITE_FB_PROJECT_ID>', process.env.VITE_FB_PROJECT_ID)
      .replace('<VITE_FB_STORAGE_BUCKET>', process.env.VITE_FB_STORAGE_BUCKET)
      .replace('<VITE_FB_MESSAGING_SENDER_ID>', process.env.VITE_FB_MESSAGING_SENDER_ID)
      .replace('<VITE_FB_APP_ID>', process.env.VITE_FB_APP_ID);

    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }

    // Write the modified service worker to the dist folder
    fs.writeFileSync(serviceWorkerDest, serviceWorkerContent);

    // Build the project
    console.log('Building the application...');
    const { stdout: buildOutput } = await exec('npm run build');
    console.log('Build completed successfully!');
    console.log(buildOutput);
    
    // Copy the service worker to the dist folder
    try {
      await fs.promises.copyFile(serviceWorkerSrc, serviceWorkerDest);
      console.log('Service worker copied successfully!');
    } catch (err) {
      console.error('Error copying service worker:', err);
      return;
    }
    
    // Deploy to Firebase
    console.log('Deploying to Firebase...');
    const { stdout: deployOutput } = await exec('firebase deploy');
    console.log('Deployment completed successfully!');
    console.log(deployOutput);
  } catch (error) {
    console.error('Error during deployment process:', error);
    process.exit(1);
  }
}

deploy();