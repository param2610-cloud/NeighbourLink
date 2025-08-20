declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
    googleMapsPromise?: Promise<void>;
  }
}

// Keep track of loading state to prevent multiple loads
let isLoading = false;
let loadPromise: Promise<void> | null = null;

// Global cleanup function to prevent multiple API loads
const cleanupExistingScripts = () => {
  const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
  if (existingScripts.length > 1) {
    // Remove duplicate scripts except the first one
    for (let i = 1; i < existingScripts.length; i++) {
      existingScripts[i].remove();
    }
  }
};

// Load Google Maps API script
export const loadGoogleMapsScript = (): Promise<void> => {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Return resolved promise if already loaded
  if (window.google && window.google.maps) {
    cleanupExistingScripts(); // Clean up any duplicate scripts
    return Promise.resolve();
  }

  // Start loading if not already in progress
  if (!isLoading) {
    isLoading = true;
    
    loadPromise = new Promise((resolve, reject) => {
      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // If script exists but maps not loaded, wait for it
        if (window.google && window.google.maps) {
          cleanupExistingScripts();
          resolve();
        } else {
          existingScript.addEventListener('load', () => {
            isLoading = false;
            cleanupExistingScripts();
            resolve();
          });
          existingScript.addEventListener('error', () => {
            isLoading = false;
            loadPromise = null;
            reject(new Error('Failed to load Google Maps'));
          });
        }
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
      if (!apiKey) {
        isLoading = false;
        loadPromise = null;
        reject(new Error('Google Maps API key not found'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script'; // Add ID for easier tracking
      
      script.onload = () => {
        isLoading = false;
        cleanupExistingScripts();
        resolve();
      };
      
      script.onerror = () => {
        isLoading = false;
        loadPromise = null;
        reject(new Error('Failed to load Google Maps'));
      };

      document.head.appendChild(script);
    });
  }

  return loadPromise!;
};

// Initialize Google Map
export const initGoogleMap = async (
  containerId: string, 
  center: [number, number] = [77.61648476788898, 12.931423492103944], 
  zoom: number = 15
) => {
  await loadGoogleMapsScript();
  
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with id '${containerId}' not found`);
  }

  const map = new window.google.maps.Map(container, {
    center: { lat: center[1], lng: center[0] }, // Note: Google Maps uses lat, lng order
    zoom: zoom,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  return map;
};
