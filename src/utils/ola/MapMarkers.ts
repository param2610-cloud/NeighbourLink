import { OlaMapsInit } from "./MapInit";

export interface MarkerOptions {
    coordinates: [number, number];
    offset?: [number, number];
    anchor?: string;
    color?: string;
    popup?: {
        content: string;
        closeOnClick?: boolean;
    };
}

export const addMarker = (map: any, options: MarkerOptions) => {
    try {
        // Validate coordinates
        if (!options.coordinates || 
            !Array.isArray(options.coordinates) || 
            options.coordinates.length !== 2 ||
            typeof options.coordinates[0] !== 'number' ||
            typeof options.coordinates[1] !== 'number' ||
            isNaN(options.coordinates[0]) ||
            isNaN(options.coordinates[1])) {
            console.error("Invalid coordinates for marker:", options.coordinates);
            return null;
        }
        
        // Create a custom marker element if color is provided
        let markerElement: HTMLElement | undefined = undefined;
        
        if (options.color) {
            markerElement = document.createElement('div');
            markerElement.className = 'custom-marker';
            markerElement.style.width = '24px';
            markerElement.style.height = '36px';
            markerElement.innerHTML = `
                <svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.383 0 0 5.383 0 12c0 6.192 10.032 22.456 11.36 24.192.672.882 1.608.882 2.278 0C14.968 34.456 24 18.192 24 12c0-6.617-5.383-12-12-12z" 
                        fill="${options.color}"/>
                    <circle cx="12" cy="12" r="6" fill="#ffffff" />
                </svg>
            `;
        }
        
        const marker = OlaMapsInit
            .addMarker({
                offset: options.offset || [0, 0],
                anchor: options.anchor || 'bottom',
                element: markerElement
            })
            .setLngLat(options.coordinates)
            .addTo(map);
        
        if (options.popup) {
            const popup = OlaMapsInit.addPopup({
                closeButton: true,
                closeOnClick: options.popup.closeOnClick !== undefined ? options.popup.closeOnClick : true,
            })
            .setHTML(options.popup.content)
            .addTo(map);
            
            marker.setPopup(popup);
        }
        
        return marker;
    } catch (error) {
        console.error("Error adding marker:", error);
        return null;
    }
};
