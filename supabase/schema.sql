-- ─────────────────────────────────────────────────────────────
-- Duo Player — Supabase Schema & Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to create profile automatically on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Playlists Table
create table if not exists public.playlists (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  cover_url text,
  is_public boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.playlists enable row level security;

create policy "Public playlists are viewable by everyone, private only by owner"
  on public.playlists for select
  using (is_public = true or auth.uid() = owner_id);

create policy "Users can create playlists"
  on public.playlists for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own playlists"
  on public.playlists for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own playlists"
  on public.playlists for delete
  using (auth.uid() = owner_id);

create index if deputy_idx_playlists_owner on public.playlists(owner_id);

-- 3. Playlist Tracks Table
create table if not exists public.playlist_tracks (
  id uuid default gen_random_uuid() primary key,
  playlist_id uuid references public.playlists on delete cascade not null,
  track_ref jsonb not null,
  position integer default 0 not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.playlist_tracks enable row level security;

create policy "Tracks visible if playlist is visible"
  on public.playlist_tracks for select
  using (
    exists (
      select 1 from public.playlists
      where id = playlist_tracks.playlist_id
        and (is_public = true or auth.uid() = owner_id)
    )
  );

create policy "Owners can add tracks to playlists"
  on public.playlist_tracks for insert
  with check (
    exists (
      select 1 from public.playlists
      where id = playlist_tracks.playlist_id
        and auth.uid() = owner_id
    )
  );

create policy "Owners can update playlist tracks"
  on public.playlist_tracks for update
  using (
    exists (
      select 1 from public.playlists
      where id = playlist_tracks.playlist_id
        and auth.uid() = owner_id
    )
  );

create policy "Owners can delete playlist tracks"
  on public.playlist_tracks for delete
  using (
    exists (
      select 1 from public.playlists
      where id = playlist_tracks.playlist_id
        and auth.uid() = owner_id
    )
  );

create index if not exists idx_playlist_tracks_playlist on public.playlist_tracks(playlist_id, position);

-- 4. Liked Tracks Table
create table if not exists public.liked_tracks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  track_id text not null,
  track_ref jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, track_id)
);

alter table public.liked_tracks enable row level security;

create policy "Users can view own liked tracks"
  on public.liked_tracks for select
  using (auth.uid() = user_id);

create policy "Users can like tracks"
  on public.liked_tracks for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike tracks"
  on public.liked_tracks for delete
  using (auth.uid() = user_id);

create index if not exists idx_liked_tracks_user on public.liked_tracks(user_id, created_at desc);

-- 5. Recently Played Table
create table if not exists public.recently_played (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  track_id text not null,
  track_ref jsonb not null,
  played_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, track_id)
);

alter table public.recently_played enable row level security;

create policy "Users can view own recently played"
  on public.recently_played for select
  using (auth.uid() = user_id);

create policy "Users can record recently played"
  on public.recently_played for insert
  with check (auth.uid() = user_id);

create policy "Users can update recently played timestamps"
  on public.recently_played for update
  using (auth.uid() = user_id);

create index if not exists idx_recently_played_user on public.recently_played(user_id, played_at desc);

-- 6. Connected Accounts Table (Phase 7 Playlist Import)
create table if not exists public.connected_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  provider text not null,
  external_account_id text not null,
  status text check (status in ('connected', 'revoked', 'error')) default 'connected' not null,
  connected_at timestamp with time zone default timezone('utc'::text, now()) not null,
  revoked_at timestamp with time zone,
  unique(user_id, provider, external_account_id)
);

alter table public.connected_accounts enable row level security;

create policy "Users can view own connected accounts"
  on public.connected_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own connected accounts"
  on public.connected_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own connected accounts"
  on public.connected_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own connected accounts"
  on public.connected_accounts for delete
  using (auth.uid() = user_id);

create index if not exists idx_connected_accounts_user on public.connected_accounts(user_id, status);

-- 7. Import Transfers Table (Phase 7 Playlist Import)
create table if not exists public.import_transfers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  connected_account_id uuid references public.connected_accounts on delete set null,
  provider_transfer_id text,
  status text check (status in ('pending', 'in_progress', 'completed', 'failed', 'cancelled')) default 'pending' not null,
  source_playlist_name text not null,
  total_items integer default 0 not null,
  imported_items integer default 0 not null,
  failed_items integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.import_transfers enable row level security;

create policy "Users can view own import transfers"
  on public.import_transfers for select
  using (auth.uid() = user_id);

create policy "Users can insert own import transfers"
  on public.import_transfers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own import transfers"
  on public.import_transfers for update
  using (auth.uid() = user_id);

create policy "Users can delete own import transfers"
  on public.import_transfers for delete
  using (auth.uid() = user_id);

create index if not exists idx_import_transfers_user on public.import_transfers(user_id, created_at desc);
create index if not exists idx_import_transfers_provider_id on public.import_transfers(provider_transfer_id);

-- 8. Import Transfer Events Table (Phase 7 Playlist Import Audit Log)
create table if not exists public.import_transfer_events (
  id uuid default gen_random_uuid() primary key,
  transfer_id uuid references public.import_transfers on delete cascade not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.import_transfer_events enable row level security;

create policy "Users can view own transfer events"
  on public.import_transfer_events for select
  using (
    exists (
      select 1 from public.import_transfers
      where id = import_transfer_events.transfer_id
        and user_id = auth.uid()
    )
  );

create policy "Users can insert own transfer events"
  on public.import_transfer_events for insert
  with check (
    exists (
      select 1 from public.import_transfers
      where id = import_transfer_events.transfer_id
        and user_id = auth.uid()
    )
  );

create index if not exists idx_import_transfer_events_transfer on public.import_transfer_events(transfer_id, received_at asc);

