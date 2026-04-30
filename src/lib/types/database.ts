export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  department: string | null;
  level: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  is_admin: boolean;
  share_location: boolean;
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  location: string | null;
  images: string[];
  is_active: boolean;
  is_sold: boolean;
  created_at: string;
  updated_at: string;
  seller?: Profile;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: Profile;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

export interface Comment {
  id: string;
  author_id: string;
  post_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
  other_participant?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface SecurityReport {
  id: string;
  reporter_id: string | null;
  title: string;
  description: string;
  category: "theft" | "burglary" | "harassment" | "suspicious_activity" | "vandalism" | "emergency" | "other";
  severity: "low" | "medium" | "high" | "critical";
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  is_anonymous: boolean;
  image_url: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
}

export interface VtuTransaction {
  id: string;
  user_id: string;
  type: "airtime" | "data" | "electricity" | "cable";
  provider: string;
  phone_number: string | null;
  amount: number;
  status: "pending" | "success" | "failed";
  reference: string | null;
  api_response: Record<string, unknown> | null;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface NewsArticle {
  id: string;
  author_id: string | null;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  category: string;
  read_time: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
}
