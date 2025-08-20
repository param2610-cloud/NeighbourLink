export interface Pandal {
  name: string;
  description: string;
  location: string;
  image?: string;
  avatar: string;
}

export const pandalData: Pandal[] = [
  {
    name: "Shree Durga Pandal",
    description: "Traditional Durga Puja pandal with authentic Bengali decorations and cultural programs. Experience the divine atmosphere with daily aarti and bhajan sessions.",
    location: "Salt Lake, Kolkata",
    avatar: "S"
  },
  {
    name: "Kali Bari Pandal", 
    description: "Historic pandal known for its grand celebrations and community feast. Features traditional clay idols and heritage architectural elements.",
    location: "Kalighat, Kolkata",
    avatar: "K"
  },
  {
    name: "Bagbazar Sarbojonin",
    description: "One of the oldest community pujas in the city with over 100 years of tradition. Known for its eco-friendly initiatives and cultural performances.",
    location: "Bagbazar, Kolkata",
    avatar: "B"
  },
  {
    name: "Park Street Pandal",
    description: "Modern themed pandal attracting thousands of visitors daily. Features innovative lighting and contemporary art installations.",
    location: "Park Street, Kolkata",
    avatar: "P"
  },
  {
    name: "Hindustan Club",
    description: "Premium pandal with elegant decorations and exclusive cultural programs. Known for its sophisticated ambiance and quality arrangements.",
    location: "Chowringhee, Kolkata", 
    avatar: "H"
  },
  {
    name: "Rashbehari Pandal",
    description: "Community pandal focusing on traditional values and social service. Organizes blood donation camps and charity drives during the festival.",
    location: "Rashbehari Avenue, Kolkata",
    avatar: "R"
  }
];
