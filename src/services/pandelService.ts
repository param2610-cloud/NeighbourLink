import { Pandel } from '../interface/main';

const API_BASE_URL = 'http://127.0.0.1:8000';

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
    static async getAllPandels(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/pandel/`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        return (await PandelService.handleResponse(res)) ?? [];
    }

    // Get pandel by ID -> GET /pandel/{id}
    static async getPandelById(id: number): Promise<any | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/pandel/${id}`);
            return await this.handleResponse(response);
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
    ): Promise<any[]> {
        const url = `${API_BASE_URL}/pandel/location/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}?radius=${encodeURIComponent(radius)}`;
        const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
        return (await PandelService.handleResponse(res)) ?? [];
    }

    // Get pandels by district -> GET /pandel/district/{district}
    static async getPandelsByDistrict(district: string): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/pandel/district/${encodeURIComponent(district)}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        return (await PandelService.handleResponse(res)) ?? [];
    }

    // Search pandels -> GET /pandel/search/?query=...
    static async searchPandels(query: string): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/pandel/search/?query=${encodeURIComponent(query)}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
        return (await PandelService.handleResponse(res)) ?? [];
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

    // Convert backend Pandel to frontend Pandal format
    static convertToLegacyFormat(serverItem: any): any {
        // backend uses coordinates: { lat, long }
        const lat = serverItem.lat ?? serverItem.coordinates?.lat ?? serverItem.coordinates?.latitude ?? null;
        const lng = serverItem.lng ?? serverItem.coordinates?.long ?? serverItem.coordinates?.longitude ?? null;

        return {
            id: serverItem.id ?? serverItem._id ?? serverItem.uuid ?? null,
            name: serverItem.name ?? serverItem.title ?? 'Unknown',
            location: serverItem.address ?? serverItem.location ?? '',
            lat,
            lng,
            coordinates: (lat != null && lng != null) ? { lat: Number(lat), lng: Number(lng) } : null,
            district: serverItem.district ?? serverItem.region ?? '',
            description: serverItem.description ?? '',
            popularity: serverItem.popularity ?? serverItem.score ?? 0,
            avatar: serverItem.avatar_image ?? serverItem.avatar ?? serverItem.banner_image ?? '/assets/default-pandal.png',
            image: serverItem.banner_image ?? serverItem.image ?? '',
            banner_image: serverItem.banner_image ?? '',
            category: serverItem.category ?? 'General',
            images: serverItem.images ?? [],
            average_rating: serverItem.average_rating ?? 0,
            reviews: serverItem.reviews ?? [],
            created_at: serverItem.created_at ?? '',
            updated_at: serverItem.updated_at ?? '',
            address: serverItem.address ?? '',
            _raw: serverItem
        } as unknown as Pandel; // cast via unknown to avoid strict structural mismatch errors
    }
}
