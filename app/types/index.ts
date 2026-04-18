export interface User {
  id: string;
  name: string;
  profile_picture: string;
  phone_number: string;
  age: number;
  likes: string;
  dislikes: string;
}

// PostGIS Point format usually comes back as an object or geoJSON string
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface Moment {
  id: string;
  user_id: string;
  event_time: string;
  description: string;
  location: GeoPoint | null; // Typed instead of any
  status?: string; 
}

export interface Match {
  id: string;
  other_user_name: string;
  other_user_phone: string;
  my_moment_description: string;
  their_moment_description: string;
  chat_id: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone_number: string | null;
  age: number | null;
  likes: string | null;
  dislikes: string | null;
}

export interface MatchRecord {
  id: string;
  chat_id: string;
  created_at: string;
  moments_a: { description: string };
  moments_b: { description: string };
  users_a: { name: string; phone_number: string };
  users_b: { name: string; phone_number: string };
}