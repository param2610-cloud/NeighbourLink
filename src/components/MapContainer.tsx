import { OlaMaps } from "olamaps-web-sdk";
import { useEffect, useRef, useState } from "react";

interface MapContainerProps {
  center?: [number, number];
  zoom: number;
  scrollWheelZoom: boolean;
  ref?: (a: any) => void;
  showCurrentLocation?: boolean;
  isSelectable?: boolean;
  maximumSelection?: number;
  onPermissionDenied?: () => void;
}

// Kolkata coordinates as fallback
const KOLKATA_COORDINATES: [number, number] = [22.5726, 88.3639];
const MAP_API_KEY = import.meta.env.VITE_OLA_MAP_APIKEY as string;

const olaMaps = new OlaMaps({
  apiKey: MAP_API_KEY,
});

const geolocate = olaMaps.addGeolocateControls({
  positionOptions: {
    enableHighAccuracy: true,
  },
  trackUserLocation: true,
});

export const useOlaMaps = () => {
  type loc = {
    latitude: number;
    longitude: number;
  };
  const [data, setData] = useState<{
    currentLocation: loc;
    currentAddress: string;
    selectedLocations: (loc & {
      address: string;
    })[];
    permissionStatus?: "granted" | "denied" | "prompt";
  } | null>(null);

  const getGoogleMapDirectionUrls = ({
    origin,
    destination,
    mode = "driving",
  }: {
    origin: loc;
    destination: loc;
    mode?: string;
  }) => {
    const originString = `${origin.latitude},${origin.longitude}`;
    const destinationString = `${destination.latitude},${destination.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${originString}&destination=${destinationString}&travelmode=${mode}`;
    return url;
  };

  const getDistanceAndDuration = async ({
    origin,
    destination,
    mode = "driving",
  }: {
    origin: loc;
    destination: loc;
    mode?: string;
  }) => {
    const result = await fetch(
      `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${origin.latitude}%2C${origin.longitude}&destinations=${destination.latitude}%2C${destination.longitude}&mode=${mode}&api_key=${MAP_API_KEY}`
    );
    const resp = await result.json();
    if (resp.rows[0]) {
      const { distance, duration, status } = resp.rows[0].elements[0];
      if (status == "OK")
        return {
          distance,
          duration,
          info: "duration in (seconds) & distance in (meters)",
        };
    }

    return null;
  };

  return {
    ref: setData,
    getGoogleMapDirectionUrls,
    getDistanceAndDuration,
    data,
  };
};

const MapContainer = ({
  showCurrentLocation,
  center = KOLKATA_COORDINATES, // Default to Kolkata
  zoom = 15,
  scrollWheelZoom = true,
  ref = () => {},
  isSelectable = false,
  maximumSelection = 1,
  onPermissionDenied,
}: MapContainerProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [selectedLocations, setSelectedLocations] = useState<
    {
      latitude: number;
      longitude: number;
      address: string;
    }[]
  >([]);

  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "prompt" | "checking"
  >("checking");
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(
    false
  );
  const [makers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    // Check permission status on component mount
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermissionStatus(result.state as "granted" | "denied" | "prompt");
        setShowPermissionBanner(result.state === "denied");

        // Listen for changes to permission status
        result.onchange = () => {
          setPermissionStatus(result.state as "granted" | "denied" | "prompt");
          setShowPermissionBanner(result.state === "denied");
        };
      });
    }
  }, []);

  useEffect(() => {
    ref({
      selectedLocations,
      currentLocation,
      currentAddress,
      permissionStatus,
    });
  }, [selectedLocations, currentLocation, currentAddress, permissionStatus]);

  const getAddressUrl = (lat: number, lng: number) =>
    `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat}%2C${lng}&api_key=${MAP_API_KEY}`;

  const geoLocationToAddress = async (lat: number, lng: number) => {
    const url = getAddressUrl(lat, lng);
    const response = await fetch(url);
    const data = await response.json();
    const address = data?.results?.[0]?.formatted_address || "Unknown Address";
    return address;
  };

  const requestLocationPermission = () => {
    setShowPermissionBanner(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermissionStatus("granted");
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });

          // If map is already initialized, center it to the user's location
          if (window.map) {
            window.map.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              essential: true,
            });
          }
        },
        (error) => {
          setPermissionStatus("denied");
          setShowPermissionBanner(true);
          if (onPermissionDenied) onPermissionDenied();
        }
      );
    }
  };

  useEffect(() => {
    if (mapContainerRef.current) {
      let myMap = olaMaps.init({
        style:
          "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: mapContainerRef.current || "map",
        zoom,
        scrollWheelZoom,
        center: center
          ? [center[1], center[0]]
          : [KOLKATA_COORDINATES[1], KOLKATA_COORDINATES[0]],
      });

      // Store map instance globally for access in requestLocationPermission
      window.map = myMap;

      myMap.addControl(geolocate);

      myMap.on("load", () => {
        if (showCurrentLocation && permissionStatus === "granted") {
          geolocate.trigger();
        }

        if (center) {
          olaMaps
            .addMarker({ offset: [0, -5], anchor: "bottom" })
            .setLngLat([center[1], center[0]])
            .addTo(myMap);
        }
      });

      if (showCurrentLocation) {
        geolocate.on("geolocate", (event: any) => {
          const { latitude, longitude } = event.coords;
          if (!currentAddress) setCurrentLocation({ latitude, longitude });
          geoLocationToAddress(latitude, longitude).then((address) => {
            setCurrentAddress(address);
          });
          olaMaps
            .addMarker({ offset: [0, -5], anchor: "bottom" })
            .setLngLat([longitude, latitude])
            .addTo(myMap);
        });

        // Handle error events
        geolocate.on("error", (e: any) => {
          setPermissionStatus("denied");
          setShowPermissionBanner(true);
          if (onPermissionDenied) onPermissionDenied();
        });
      }

      const navigationControls = olaMaps.addNavigationControls({
        showCompass: true,
        showZoom: false,
        visualizePitch: false,
      });

      myMap.addControl(navigationControls);

      if (isSelectable) {
        myMap.on(
          "click",
          async ({ lngLat }: { lngLat: { lng: number; lat: number } }) => {
            if (selectedLocations.length <= maximumSelection) {
              const { lng, lat } = lngLat;
              const address = await geoLocationToAddress(lat, lng);
              setSelectedLocations((prev) => {
                if (prev.length >= maximumSelection) return prev;
                const maker = olaMaps
                  .addMarker({
                    offset: [0, -10],
                    anchor: "bottom",
                    color: "red",
                  })
                  .setLngLat([lngLat.lng, lngLat.lat])
                  .addTo(myMap);
                setMarkers((prev) => [...prev, maker]);
                return [...prev, { latitude: lat, longitude: lng, address }];
              });
            }
          }
        );
      }

      return () => {
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = "";
        }
        if (!!myMap) myMap?.remove();
        // Clean up global reference
        if (window.map) {
          window.map = undefined;
        }
      };
    }
  }, [mapContainerRef, showCurrentLocation, center, zoom, permissionStatus]);

  return (
    <div className="w-full h-full relative">
      {showPermissionBanner && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-yellow-500 text-white p-2 text-sm text-center">
          Location access is denied.
          <button
            onClick={requestLocationPermission}
            className="ml-2 underline font-medium hover:text-yellow-100"
          >
            Grant access
          </button>
        </div>
      )}

      {selectedLocations.length + 1 > maximumSelection && (
        <div className="absolute h-full w-full bg-black/20 flex justify-center items-center z-40">
          <button
            onClick={() => {
              setSelectedLocations([]);
              makers.forEach((marker) => {
                marker.remove();
              });
            }}
            className="px-4 py-2 bg-white/90 hover:bg-white rounded-md shadow-lg text-gray-800"
          >
            Reset selection
          </button>
        </div>
      )}
      <div id="map" ref={mapContainerRef} className="w-full !h-full"></div>
    </div>
  );
};

// Add type definition for the window object to include map
declare global {
  interface Window {
    map?: any;
  }
}

export default MapContainer;
