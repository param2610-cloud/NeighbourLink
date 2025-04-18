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
}

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
  center,
  zoom = 15,
  scrollWheelZoom = true,
  ref = () => {},
  isSelectable = false,
  maximumSelection = 1,
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

  useEffect(() => {
    ref({ selectedLocations, currentLocation, currentAddress });
  }, [selectedLocations, currentLocation]);

  const [makers, setMarkers] = useState<any[]>([]);

  const getAddressUrl = (lat: number, lng: number) =>
    `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat}%2C${lng}&api_key=${MAP_API_KEY}`;

  const geoLocationToAddress = async (lat: number, lng: number) => {
    const url = getAddressUrl(lat, lng);
    const response = await fetch(url);
    const data = await response.json();
    const address = data?.results?.[0]?.formatted_address || "Unknown Address";
    return address;
  };

  useEffect(() => {
    if (mapContainerRef.current) {
      let myMap = olaMaps.init({
        style:
          "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: mapContainerRef.current || "map",
        zoom,
        scrollWheelZoom,
        center,
      });

      myMap.addControl(geolocate);

      myMap.on("load", () => {
        if (showCurrentLocation) {
          geolocate.trigger();
        }

        olaMaps
          .addMarker({ offset: [0, -5], anchor: "bottom" })
          .setLngLat(center)
          .addTo(myMap);
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
      };
    }
  }, [mapContainerRef, showCurrentLocation, center, zoom]);

  return (
    <div className="w-full h-full relative">
      {selectedLocations.length + 1 > maximumSelection && (
        <div className="absolute h-full w-full bg-black/20 flex justify-center items-center z-50">
          <button
            onClick={() => {
              setSelectedLocations([]);
              makers.forEach((marker) => {
                marker.remove();
              });
            }}
          >
            Click here reset pointer
          </button>
        </div>
      )}
      <div id="map" ref={mapContainerRef} className="w-full !h-full"></div>
    </div>
  );
};

export default MapContainer;

// function App() {
//   const { ref, data, getDistanceAndDuration } = useOlaMaps();

//   if (data && (data?.selectedLocations.length || 0) > 0) {
//     console.log("selectedLocations", data.selectedLocations);
//     console.log("currentLocation", data.currentLocation);

//     getDistanceAndDuration({
//       origin: data.currentLocation,
//       destination: data.selectedLocations[0],
//       mode: "driving",
//     }).then(console.log);
//   }

//   return (
//     <div className="w-[400px] aspect-square">
//       <MapContainer
//         // center={[51.505, -0.09]}
//         ref={ref}
//         showCurrentLocation={true}
//         zoom={13}
//         scrollWheelZoom={false}
//         isSelectable={true}
//         maximumSelection={3}
//       />
//     </div>
//   );
// }
