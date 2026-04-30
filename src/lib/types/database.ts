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

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: "deposit" | "withdrawal" | "vtu_purchase" | "transfer" | "refund";
  amount: number;
  balance_before: number;
  balance_after: number;
  status: "pending" | "success" | "failed";
  reference: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "abandoned";
  payment_reference: string | null;
  squad_transaction_ref: string | null;
  payment_channel: string | null;
  gateway_response: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "wallet_credit" | "wallet_debit" | "vtu_success" | "vtu_failed" | "transfer_received" | "transfer_sent" | "product_sold" | "message_received" | "security_alert" | "system" | "referral_bonus";
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  bonus_amount: number;
  status: "pending" | "completed" | "expired";
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  seller_id: string;
  listing_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}
