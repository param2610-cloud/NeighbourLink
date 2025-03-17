import { OlaMaps } from "olamaps-web-sdk";

export const OlaMapsInit = new OlaMaps({
    apiKey: import.meta.env.VITE_OLA_MAP_APIKEY,
})