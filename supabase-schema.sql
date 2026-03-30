-- ============================================
-- SBUPost Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable storage for images
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true)
on conflict do nothing;

-- Allow authenticated users to upload
create policy "Authenticated users can upload images"
on storage.objects for insert to authenticated
with check (bucket_id = 'post-images');

-- Allow public read
create policy "Public can view images"
on storage.objects for select to public
using (bucket_id = 'post-images');

-- Allow users to delete their own images
create policy "Users can delete own images"
on storage.objects for delete to authenticated
using (bucket_id = 'post-images');

-- ============================================
-- Profiles
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  bio text default '',
  major text default '',
  second_major text default '',
  minor text default '',
  clubs text default '',
  courses text default '',
  relationship_status text default '',
  residence_hall text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
on public.profiles for select to authenticated
using (true);

create policy "Users can update own profile"
on public.profiles for update to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Posts
-- ============================================
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Posts are viewable by authenticated users"
on public.posts for select to authenticated
using (true);

create policy "Users can create posts"
on public.posts for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete own posts"
on public.posts for delete to authenticated
using (auth.uid() = user_id);

-- ============================================
-- Follows
-- ============================================
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by authenticated users"
on public.follows for select to authenticated
using (true);

create policy "Users can follow"
on public.follows for insert to authenticated
with check (auth.uid() = follower_id);

create policy "Users can unfollow"
on public.follows for delete to authenticated
using (auth.uid() = follower_id);

-- ============================================
-- Messages
-- ============================================
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);

alter table public.conversations enable row level security;

create policy "Users can view own conversations"
on public.conversations for select to authenticated
using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can create conversations"
on public.conversations for insert to authenticated
with check (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can update own conversations"
on public.conversations for update to authenticated
using (auth.uid() = user1_id or auth.uid() = user2_id);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can view messages in their conversations"
on public.messages for select to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);

create policy "Users can send messages"
on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);

-- ============================================
-- Likes (bonus)
-- ============================================
create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

alter table public.likes enable row level security;

create policy "Likes viewable by authenticated"
on public.likes for select to authenticated using (true);

create policy "Users can like"
on public.likes for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can unlike"
on public.likes for delete to authenticated
using (auth.uid() = user_id);

-- ============================================
-- Indexes for performance
-- ============================================
create index idx_posts_user_id on public.posts(user_id);
create index idx_posts_created_at on public.posts(created_at desc);
create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);
create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_conversations_users on public.conversations(user1_id, user2_id);
create index idx_likes_post on public.likes(post_id);

-- ============================================
-- Enable Realtime for messages
-- ============================================
alter publication supabase_realtime add table public.messages;
