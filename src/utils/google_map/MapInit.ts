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
    console.log('🔄 Google Maps already loading, returning existing promise');
    return loadPromise;
  }

  // Return resolved promise if already loaded
  if (window.google && window.google.maps) {
    console.log('✅ Google Maps already loaded');
    cleanupExistingScripts(); // Clean up any duplicate scripts
    return Promise.resolve();
  }

  // Start loading if not already in progress
  if (!isLoading) {
    console.log('🚀 Starting Google Maps API load');
    isLoading = true;
    
    loadPromise = new Promise((resolve, reject) => {
      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('📜 Found existing Google Maps script');
        // If script exists but maps not loaded, wait for it
        if (window.google && window.google.maps) {
          console.log('✅ Maps already available from existing script');
          cleanupExistingScripts();
          resolve();
        } else {
          console.log('⏳ Waiting for existing script to load');
          existingScript.addEventListener('load', () => {
            console.log('✅ Existing script loaded successfully');
            isLoading = false;
            cleanupExistingScripts();
            resolve();
          });
          existingScript.addEventListener('error', () => {
            console.error('❌ Existing script failed to load');
            isLoading = false;
            loadPromise = null;
            reject(new Error('Failed to load Google Maps'));
          });
        }
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
      console.log('🔑 API Key found:', apiKey ? 'Yes' : 'No');
      
      if (!apiKey) {
        console.error('❌ Google Maps API key not found in environment variables');
        isLoading = false;
        loadPromise = null;
        reject(new Error('Google Maps API key not found'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      
      console.log('📡 Loading Google Maps from:', script.src);
      
      // Set up the callback function
      window.initGoogleMaps = () => {
        console.log('🎉 Google Maps callback fired');
        isLoading = false;
        cleanupExistingScripts();
        
        // Verify that the API loaded correctly
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('✅ Google Maps and Places API loaded successfully');
          resolve();
        } else {
          console.error('❌ Google Maps API loaded but services not available');
          reject(new Error('Google Maps API loaded but services not available'));
        }
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps script:', error);
        isLoading = false;
        loadPromise = null;
        if (window.initGoogleMaps) {
          window.initGoogleMaps = () => {};
        }
        reject(new Error('Failed to load Google Maps'));
      };

      document.head.appendChild(script);
      console.log('📝 Google Maps script added to document head');
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
