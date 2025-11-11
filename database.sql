-- 数据库表结构设计
-- 用于Supabase

-- 用户表
create table public.users (
  id uuid default gen_random_uuid() primary key,
  username text not null unique,
  avatar text not null,
  display_name text not null,
  created_at timestamp with time zone default now()
);

-- 对话表
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  title text not null default 'New Conversation',
  model text not null default 'gpt-4-0125-preview',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 消息表
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  model text,
  created_at timestamp with time zone default now()
);

-- 预设用户数据
insert into public.users (username, avatar, display_name) values
  ('alice', '👩‍💻', 'Alice'),
  ('bob', '👨‍🎨', 'Bob'),
  ('charlie', '👨‍🔬', 'Charlie'),
  ('diana', '👩‍🎓', 'Diana'),
  ('eve', '👩‍🎤', 'Eve');

-- RLS 策略 (Row Level Security)
alter table public.users enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- 允许所有用户读取users表
create policy "Allow all users to read users" on public.users
  for select using (true);

-- 允许用户查看和操作自己的对话
create policy "Users can view their own conversations" on public.conversations
  for all using (true);

-- 允许用户查看和操作自己对话的消息
create policy "Users can view their own messages" on public.messages
  for all using (true);