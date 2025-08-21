export interface Pandal {
  id: string;
  name: string;
  description: string;
  location: string;
  district: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  image?: string;
  avatar: string;
  popularity: number; // 1-10 scale for famous pandals
  category: 'traditional' | 'modern' | 'heritage' | 'community';
}

export const pandalData: Pandal[] = [
  {
    id: "1",
    name: "Shree Durga Pandal",
    description: "Traditional Durga Puja pandal with authentic Bengali decorations and cultural programs. Experience the divine atmosphere with daily aarti and bhajan sessions.",
    location: "Salt Lake, Kolkata",
    district: "Kolkata",
    coordinates: { lat: 22.5726, lng: 88.3639 },
    avatar: "S",
    popularity: 8,
    category: "traditional"
  },
  {
    id: "2",
    name: "Kali Bari Pandal", 
    description: "Historic pandal known for its grand celebrations and community feast. Features traditional clay idols and heritage architectural elements.",
    location: "Kalighat, Kolkata",
    district: "Kolkata",
    coordinates: { lat: 22.5205, lng: 88.3426 },
    avatar: "K",
    popularity: 9,
    category: "heritage"
  },
  {
    id: "3",
    name: "Bagbazar Sarbojonin",
    description: "One of the oldest community pujas in the city with over 100 years of tradition. Known for its eco-friendly initiatives and cultural performances.",
    location: "Bagbazar, Kolkata",
    district: "Kolkata",
    coordinates: { lat: 22.5958, lng: 88.3639 },
    avatar: "B",
    popularity: 10,
    category: "heritage"
  },
  {
    id: "4",
    name: "Park Street Pandal",
    description: "Modern themed pandal attracting thousands of visitors daily. Features innovative lighting and contemporary art installations.",
    location: "Park Street, Kolkata",
    district: "Kolkata",
    coordinates: { lat: 22.5448, lng: 88.3426 },
    avatar: "P",
    popularity: 9,
    category: "modern"
  },
  {
    id: "5",
    name: "Hindustan Club",
    description: "Premium pandal with elegant decorations and exclusive cultural programs. Known for its sophisticated ambiance and quality arrangements.",
    location: "Chowringhee, Kolkata", 
    district: "Kolkata",
    coordinates: { lat: 22.5448, lng: 88.3426 },
    avatar: "H",
    popularity: 8,
    category: "modern"
  },
  {
    id: "6",
    name: "Rashbehari Pandal",
    description: "Community pandal focusing on traditional values and social service. Organizes blood donation camps and charity drives during the festival.",
    location: "Rashbehari Avenue, Kolkata",
    district: "Kolkata",
    coordinates: { lat: 22.5205, lng: 88.3639 },
    avatar: "R",
    popularity: 7,
    category: "community"
  },
  // Adding more pandals for better demonstration
  {
    id: "7",
    name: "Howrah Maidan Pandal",
    description: "Grand community celebration with spectacular light shows and cultural performances. Known for its massive crowd gathering.",
    location: "Howrah Maidan, Howrah",
    district: "Howrah",
    coordinates: { lat: 22.5958, lng: 88.2636 },
    avatar: "H",
    popularity: 8,
    category: "community"
  },
  {
    id: "8",
    name: "Belur Math Pandal",
    description: "Spiritual and serene pandal at the famous Belur Math. Experience divine peace and traditional rituals.",
    location: "Belur, Howrah",
    district: "Howrah",
    coordinates: { lat: 22.6328, lng: 88.2636 },
    avatar: "B",
    popularity: 9,
    category: "traditional"
  },
  {
    id: "9",
    name: "Midnapore Central Pandal",
    description: "Famous pandal in Midnapore known for its authentic rural Bengal theme and traditional folk performances.",
    location: "Midnapore Town, Midnapore",
    district: "Midnapore",
    coordinates: { lat: 22.4250, lng: 87.3119 },
    avatar: "M",
    popularity: 7,
    category: "traditional"
  },
  {
    id: "10",
    name: "Digha Beach Pandal",
    description: "Unique beachside pandal offering a blend of devotion and natural beauty. Perfect for family visits.",
    location: "Digha Beach, Midnapore",
    district: "Midnapore",
    coordinates: { lat: 21.6281, lng: 87.5236 },
    avatar: "D",
    popularity: 6,
    category: "modern"
  },
  {
    id: "11",
    name: "Durgapur Steel City Pandal",
    description: "Modern industrial-themed pandal reflecting the steel city's character. Known for innovative decorations.",
    location: "Durgapur City Center, Burdwan",
    district: "Burdwan",
    coordinates: { lat: 23.5204, lng: 87.3119 },
    avatar: "D",
    popularity: 6,
    category: "modern"
  },
  {
    id: "12",
    name: "Asansol Junction Pandal",
    description: "Railway-themed pandal celebrating the city's connection to Indian Railways. Features train-inspired decorations.",
    location: "Asansol Junction, Burdwan",
    district: "Burdwan",
    coordinates: { lat: 23.6739, lng: 86.9524 },
    avatar: "A",
    popularity: 5,
    category: "community"
  }
];
