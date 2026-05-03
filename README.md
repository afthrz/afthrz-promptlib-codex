# Prompt Desk

A static prompt library for investing and repeatable AI workflows. It runs locally with browser storage and is ready to deploy to Netlify or Vercel as a plain static site.

## What is included

- Search, category filters, favorites, sorting, and "mine only" filtering
- Add, edit, delete, copy, export, and import prompts
- Optional display names so prompts can show who added them
- Open pool mode: anyone with the link can add, edit, and remove prompts when Supabase is configured
- Responsive UI designed for frequent reuse, not a marketing landing page

## Deploy

Upload the folder to Netlify or Vercel as a static site. There is no build command and the publish directory is the project root.

Netlify settings:

- Build command: leave blank
- Publish directory: `.`

Vercel settings:

- Framework preset: Other
- Build command: leave blank
- Output directory: `.`

## Make It Truly Shared

The app is local-first by default. Vercel can host the files, but it cannot share browser storage between friends by itself. To make one shared prompt pool for everyone with the link, connect Supabase in `config.js`.

1. Create a Supabase project.
2. Create a `prompts` table:

```sql
create table prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'investing',
  visibility text not null default 'team',
  tags text[] not null default '{}',
  author text not null,
  author_email text not null,
  favorite boolean not null default false,
  copies integer not null default 0,
  created_at timestamptz not null default now()
);
```

3. Enable row-level security and add open pool policies:

```sql
alter table prompts enable row level security;

create policy "Anyone can read prompts"
on prompts for select
using (true);

create policy "Anyone can create prompts"
on prompts for insert
with check (true);

create policy "Anyone can update prompts"
on prompts for update
using (true)
with check (true);

create policy "Anyone can delete prompts"
on prompts for delete
using (true);
```

4. Add your public Supabase values to `config.js`:

```js
window.PROMPT_DESK_CONFIG = {
  supabaseUrl: "https://your-project.supabase.co",
  supabaseAnonKey: "your-public-anon-key",
};
```

The anon key is designed to be public in browser apps. Keep service role keys out of this project.

Open pool mode is intentionally permissive: anyone with the site link can add, edit, and delete prompts. If you later want moderation or author-only deletes, tighten the RLS policies and reintroduce authentication.
