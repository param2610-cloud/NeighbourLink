import { OlaMaps } from "olamaps-web-sdk";

export const OlaMapsInit = new OlaMaps({
    apiKey: import.meta.env.VITE_OLA_MAP_APIKEY ,
});

export const initMap = (containerId: string, center: [number, number] = [77.61648476788898, 12.931423492103944], zoom: number = 15) => {
    return OlaMapsInit.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: containerId,
        center: center,
        zoom: zoom,
    });
};