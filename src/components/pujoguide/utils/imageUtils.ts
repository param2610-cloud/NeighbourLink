// Image utility functions for Puja Guide system

export class PujoImageUtils {
  // Get banner/avatar image URL (use geobums)
  static getBannerImageUrl(imageId: string): string {
    if (!imageId) return 'https://geobums.com/photos/thumbs/l47920220926121122.jpg';
    return `https://geobums.com/photos/thumbs/${imageId}.jpg`;
  }

  // Get avatar image URL with fallback to banner
  static getAvatarImageUrl(avatarImage: string, bannerImage: string): string {
    const imageId = avatarImage || bannerImage || 'l47920220926121122';
    return `https://geobums.com/photos/thumbs/${imageId}.jpg`;
  }

  // Get Cloudinary image URL for gallery images
  static getCloudinaryImageUrl(publicId: string): string {
    if (!publicId) return '';
    return `https://res.cloudinary.com/dqd7ywrxm/image/upload/${publicId}`;
  }

  // Get all gallery image URLs
  static getGalleryImageUrls(images: string[]): string[] {
    return images.map(publicId => this.getCloudinaryImageUrl(publicId)).filter(url => url);
  }

  // Determine image type and return appropriate URL
  static getImageUrl(imageId: string, isGalleryImage: boolean = false): string {
    if (!imageId) {
      return isGalleryImage ? '' : this.getBannerImageUrl('l47920220926121122');
    }

    // If already a full URL, return as is
    if (imageId.startsWith('http')) return imageId;
    
    // For Cloudinary public_ids from the images array (gallery images)
    if (isGalleryImage || (!imageId.includes('/') && !imageId.includes('.') && imageId.length > 10)) {
      return this.getCloudinaryImageUrl(imageId);
    }
    
    // For geobums format (banner/avatar images)
    return this.getBannerImageUrl(imageId);
  }

  // Get fallback image URL
  static getFallbackImageUrl(): string {
    return 'https://geobums.com/photos/thumbs/l47920220926121122.jpg';
  }
}
