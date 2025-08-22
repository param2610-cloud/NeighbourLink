import { Pandel } from '../interface/main';

const API_BASE_URL = 'http://127.0.0.1:8001';

export class PandelService {
    // Centralized single-read response handler
    static async handleResponse(response: Response) {
        // read body once as text and parse only once
        const text = await response.text();
        // If empty body (204 etc) return null
        if (!text) {
            if (!response.ok) {
                throw new Error(response.statusText || 'Request failed');
            }
            return null;
        }

        let data: any = null;
        try {
            data = JSON.parse(text);
        } catch {
            // not JSON — return raw text
            data = text;
        }

        if (!response.ok) {
            const msg = (data && data.message) ? data.message : response.statusText || 'Request failed';
            throw new Error(msg);
        }

        return data;
    }

    // Get all pandels -> GET /pandel/
    static async getAllPandels(): Promise<Pandel[]> {
        const res = await fetch(`${API_BASE_URL}/pandel/`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        const data = (await PandelService.handleResponse(res)) ?? [];
        return data.map((item: any) => this.convertToPandel(item));
    }

    // Get pandel by ID -> GET /pandel/{id}
    static async getPandelById(id: number): Promise<Pandel | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/pandel/${id}`);
            const data = await this.handleResponse(response);
            return data ? this.convertToPandel(data) : null;
        } catch (error) {
            console.error('Error fetching pandel:', error);
            return null;
        }
    }

    // Get pandels by location -> GET /pandel/location/{lat}/{long}?radius=...
    static async getPandelsByLocation(
        lat: number,
        lng: number,
        radius: number = 1.0
    ): Promise<Pandel[]> {
        const url = `${API_BASE_URL}/pandel/location/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}?radius=${encodeURIComponent(radius)}`;
        const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
        const data = (await PandelService.handleResponse(res)) ?? [];
        return data.map((item: any) => this.convertToPandel(item));
    }

    // Get pandels by district -> GET /pandel/district/{district}
    static async getPandelsByDistrict(district: string): Promise<Pandel[]> {
        const res = await fetch(`${API_BASE_URL}/pandel/district/${encodeURIComponent(district)}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        const data = (await PandelService.handleResponse(res)) ?? [];
        return data.map((item: any) => this.convertToPandel(item));
    }

    // Search pandels -> GET /pandel/search/?query=...
    static async searchPandels(query: string): Promise<Pandel[]> {
        const res = await fetch(`${API_BASE_URL}/pandel/search/?query=${encodeURIComponent(query)}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        const data = (await PandelService.handleResponse(res)) ?? [];
        return data.map((item: any) => this.convertToPandel(item));
    }

    // Update pandel address -> PATCH /pandel/{id}/address
    static async updatePandelAddress(id: number, address: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/pandel/${id}/address`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address }),
            });
            await this.handleResponse(response);
            return true;
        } catch (error) {
            console.error('Error updating pandel address:', error);
            return false;
        }
    }

    // Convert backend data to frontend Pandel type
    static convertToPandel(serverItem: any): Pandel {
        // Handle coordinates conversion
        let coordinates = { lat: 0, lng: 0 };
        if (serverItem.coordinates) {
            if (typeof serverItem.coordinates === 'object') {
                coordinates = {
                    lat: serverItem.coordinates.lat || serverItem.coordinates.latitude || 0,
                    lng: serverItem.coordinates.lng || serverItem.coordinates.long || serverItem.coordinates.longitude || 0
                };
            }
        }

        return {
            id: Number(serverItem.id) || 0,
            name: serverItem.name || 'Unknown',
            description: serverItem.description || '',
            average_rating: Number(serverItem.average_rating) || 0,
            coordinates,
            banner_image: serverItem.banner_image || '',
            created_at: serverItem.created_at || '',
            updated_at: serverItem.updated_at || '',
            images: Array.isArray(serverItem.images) ? serverItem.images : [],
            category: serverItem.category || 'traditional',
            popularity: Number(serverItem.popularity) || 0,
            avatar_image: serverItem.avatar_image || '',
            address: serverItem.address || '',
            reviews: Array.isArray(serverItem.reviews) ? serverItem.reviews : []
        };
    }

    // Convert Pandel to legacy Pandal format for backward compatibility
    static convertToLegacyFormat(pandel: Pandel): any {
        return {
            id: String(pandel.id),
            name: pandel.name,
            description: pandel.description,
            location: pandel.address,
            district: pandel.address ? pandel.address.split(',').pop()?.trim() : '',
            coordinates: pandel.coordinates,
            avatar: pandel.avatar_image ? pandel.avatar_image.charAt(0).toUpperCase() : pandel.name.charAt(0).toUpperCase(),
            popularity: pandel.popularity,
            category: pandel.category as any,
            average_rating: pandel.average_rating,
            banner_image: pandel.banner_image,
            created_at: pandel.created_at,
            updated_at: pandel.updated_at,
            images: pandel.images,
            address: pandel.address,
            reviews: pandel.reviews,
            // Add legacy fields
            image: pandel.banner_image,
            avatar_image: pandel.avatar_image
        };
    }
}
