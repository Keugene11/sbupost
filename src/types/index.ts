export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  bio: string
  major: string
  second_major: string
  minor: string
  clubs: string
  courses: string
  relationship_status: string
  residence_hall: string
  meal_plan: string
  username: string | null
  username_changed_at: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  media_urls: string[]
  created_at: string
  profiles: Profile
  likes: { user_id: string }[]
  post_impressions: { count: number }[]
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  last_message_at: string
  created_at: string
  user1: Profile
  user2: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}
