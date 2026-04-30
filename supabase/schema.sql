-- EKSU Campus Marketplace Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text,
  avatar_url text,
  department text,
  level text,
  phone text,
  bio text,
  location text default 'EKSU Campus',
  is_admin boolean default false,
  share_location boolean default false,
  latitude double precision,
  longitude double precision,
  location_updated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/9.x/initials/svg?seed=' || coalesce(new.raw_user_meta_data->>'full_name', 'NU'))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- PRODUCTS (Marketplace Listings)
-- ============================================
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric not null check (price >= 0),
  category text not null,
  condition text not null,
  location text,
  images text[] default '{}',
  is_active boolean default true,
  is_sold boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select using (true);

create policy "Authenticated users can create products"
  on public.products for insert with check (auth.uid() = seller_id);

create policy "Users can update own products"
  on public.products for update using (auth.uid() = seller_id);

create policy "Admins can update any product"
  on public.products for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Users can delete own products"
  on public.products for delete using (auth.uid() = seller_id);

create policy "Admins can delete any product"
  on public.products for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ============================================
-- POSTS (Social Feed)
-- ============================================
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Authenticated users can create posts"
  on public.posts for insert with check (auth.uid() = author_id);

create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = author_id);

-- ============================================
-- LIKES
-- ============================================
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.likes for select using (true);

create policy "Authenticated users can like"
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.likes for delete using (auth.uid() = user_id);

-- ============================================
-- COMMENTS
-- ============================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

create policy "Authenticated users can comment"
  on public.comments for insert with check (auth.uid() = author_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = author_id);

-- ============================================
-- CONVERSATIONS & MESSAGES
-- ============================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  participant_one uuid references public.profiles(id) on delete cascade not null,
  participant_two uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(participant_one, participant_two)
);

alter table public.conversations enable row level security;

create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = participant_one or auth.uid() = participant_two);

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = participant_one or auth.uid() = participant_two);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can view messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

create policy "Users can send messages in own conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

-- ============================================
-- SECURITY REPORTS (Campus Safety)
-- ============================================
create table public.security_reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  category text not null check (category in ('theft', 'burglary', 'harassment', 'suspicious_activity', 'vandalism', 'emergency', 'other')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  location text not null,
  latitude double precision,
  longitude double precision,
  status text default 'pending' check (status in ('pending', 'investigating', 'resolved', 'dismissed')),
  is_anonymous boolean default false,
  image_url text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.security_reports enable row level security;

create policy "Security reports are viewable by everyone"
  on public.security_reports for select using (true);

create policy "Authenticated users can create reports"
  on public.security_reports for insert with check (auth.uid() = reporter_id or is_anonymous = true);

create policy "Admins can update reports"
  on public.security_reports for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ============================================
-- VTU TRANSACTIONS
-- ============================================
create table public.vtu_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('airtime', 'data', 'electricity', 'cable')),
  provider text not null,
  phone_number text,
  amount numeric not null check (amount > 0),
  status text default 'pending' check (status in ('pending', 'success', 'failed')),
  reference text unique,
  api_response jsonb,
  created_at timestamptz default now()
);

alter table public.vtu_transactions enable row level security;

create policy "Users can view own transactions"
  on public.vtu_transactions for select using (auth.uid() = user_id);

create policy "Users can create transactions"
  on public.vtu_transactions for insert with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.vtu_transactions for update using (auth.uid() = user_id);

-- ============================================
-- SAVED ITEMS
-- ============================================
create table public.saved_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table public.saved_items enable row level security;

create policy "Users can view own saved items"
  on public.saved_items for select using (auth.uid() = user_id);

create policy "Users can save items"
  on public.saved_items for insert with check (auth.uid() = user_id);

create policy "Users can unsave items"
  on public.saved_items for delete using (auth.uid() = user_id);

-- ============================================
-- NEWS ARTICLES (Admin-managed)
-- ============================================
create table public.news_articles (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  excerpt text,
  content text not null,
  image_url text,
  category text not null,
  read_time text,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.news_articles enable row level security;

create policy "Published articles are viewable by everyone"
  on public.news_articles for select using (is_published = true);

create policy "Admins can manage articles"
  on public.news_articles for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
