export type CompanyStage = 'Idea' | 'Building' | 'Beta' | 'Live' | 'Scaling' | 'Exited';
export type ProjectStatus = 'Idea' | 'Building' | 'Beta' | 'Live' | 'Scaling' | 'Acquired' | 'Closed';
export type PostType = 'update' | 'ship_log' | 'ask' | 'bounty';
export type ReactionType = 'accionable' | 'verified' | 'reforge';
export type AskType = 'Feedback' | 'Intro' | 'Hiring' | 'Advice' | 'Resource';
export type NotificationType = 'reply' | 'mention' | 'offer_help' | 'reaction' | 'follow' | 'project_follow' | 'offer_help_marked_useful';
export type ReputationTier = 'Newcomer' | 'Builder' | 'Operator' | 'Trusted Founder' | 'Forge Verified';

export type NeedOffer =
  | 'Feedback'
  | 'Inversión'
  | 'Clientes'
  | 'Talento'
  | 'Co-founder'
  | 'Aprendizaje'
  | 'Red'
  | 'Intro'
  | 'Mentoría'
  | 'Técnico';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  now_objective: string | null;
  now_needs: NeedOffer[];
  now_offers: NeedOffer[];
  company_stage: CompanyStage | null;
  industry: string | null;
  is_available: boolean;
  open_dms: boolean;
  onboarding_done: boolean;
  onboarding_step: number;
  follower_count: number;
  following_count: number;
  post_count: number;
  impact_score: number;
  reputation_tier: ReputationTier;
  boost_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  url: string | null;
  status: ProjectStatus;
  industry: string | null;
  business_model: string | null;
  is_open_for_collab: boolean;
  follower_count: number;
  post_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  owner?: Profile;
}

export interface Post {
  id: string;
  author_id: string;
  project_id: string | null;
  type: PostType;
  content: string;
  parent_id: string | null;
  root_id: string | null;
  depth: number;
  // Ship Log
  ship_title: string | null;
  ship_proof_url: string | null;
  ship_proof_screenshot: string | null;
  ship_metric: string | null;
  ship_time_days: number | null;
  // Ask
  ask_type: AskType | null;
  ask_title: string | null;
  ask_offering: string | null;
  ask_deadline: string | null;
  // Counters
  accionable_count: number;
  reply_count: number;
  reforge_count: number;
  offer_help_count: number;
  is_public: boolean;
  boosted_until: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  author?: Profile;
  project?: Project;
  // Viewer state
  viewer_reacted?: boolean;
  viewer_offered_help?: boolean;
  // Feed score
  score?: number;
}

export interface OfferHelp {
  id: string;
  post_id: string;
  user_id: string;
  message: string;
  is_useful: boolean | null;
  created_at: string;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string | null;
  post_id: string | null;
  project_id: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
}

export interface FeedPost extends Post {
  author: Profile;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  request_status: 'pending' | 'accepted' | 'rejected';
  requested_by: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  other: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  is_requester: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export type ServiceCategory = 'Desarrollo' | 'Diseño' | 'Marketing' | 'Negocio' | 'Contenido' | 'Datos' | 'Otro';
export type OrderStatus = 'pending_payment' | 'active' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled' | 'disputed';
export type PackageType = 'basic' | 'standard' | 'premium';

export interface Service {
  id: string;
  seller_id: string;
  title: string;
  tagline: string;
  description: string;
  category: ServiceCategory;
  tags: string[];
  price_basic: number;
  price_standard: number | null;
  price_premium: number | null;
  title_basic: string;
  title_standard: string | null;
  title_premium: string | null;
  desc_basic: string;
  desc_standard: string | null;
  desc_premium: string | null;
  delivery_days_basic: number;
  delivery_days_standard: number | null;
  delivery_days_premium: number | null;
  order_count: number;
  rating_avg: number | null;
  rating_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seller?: Profile;
}

export interface Order {
  id: string;
  service_id: string;
  buyer_id: string;
  seller_id: string;
  package_type: PackageType;
  price: number;
  title: string;
  requirements: string | null;
  status: OrderStatus;
  delivery_url: string | null;
  delivery_note: string | null;
  revision_note: string | null;
  due_date: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  service?: Service;
  buyer?: Profile;
  seller?: Profile;
}

export interface Review {
  id: string;
  order_id: string;
  service_id: string;
  reviewer_id: string;
  seller_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
}
