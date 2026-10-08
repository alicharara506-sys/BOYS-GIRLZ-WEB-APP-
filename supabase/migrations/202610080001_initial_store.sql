-- Boys & Girlz draft schema. Apply only to the approved Supabase project.
create extension if not exists pgcrypto;

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  published boolean not null default false
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  published boolean not null default false
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  brand_id uuid references public.brands(id),
  gender text check (gender in ('boys', 'girls', 'unisex') or gender is null),
  age_group text check (age_group in ('newborn', 'baby', 'toddler', 'kids', 'adult') or age_group is null),
  product_type text not null,
  condition text not null default 'new' check (condition in ('new', 'like-new')),
  condition_grade text,
  base_price_cents integer not null check (base_price_cents >= 0),
  compare_at_cents integer check (compare_at_cents > base_price_cents),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((condition = 'like-new' and condition_grade is not null) or
         (condition = 'new' and condition_grade is null))
);
create index products_public_browse_idx on public.products (published, gender, age_group, product_type, condition);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text,
  color text,
  stock integer not null default 0 check (stock >= 0),
  price_override_cents integer check (price_override_cents >= 0),
  published boolean not null default false,
  unique (product_id, size, color) nulls not distinct
);
create index product_variants_product_idx on public.product_variants(product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  url text not null,
  alt_text text not null,
  width integer check (width > 0),
  height integer check (height > 0),
  position integer not null default 0,
  published boolean not null default false
);
create index product_images_product_position_idx on public.product_images(product_id, position);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  mobile text not null,
  email text,
  governorate text not null,
  city_area text not null,
  street_building text not null,
  landmark text,
  delivery_notes text,
  created_at timestamptz not null default now()
);

create sequence public.order_number_seq;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('BG-' || lpad(nextval('public.order_number_seq')::text, 7, '0')),
  customer_id uuid not null references public.customers(id),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'packed', 'delivered', 'cancelled')),
  payment_method text not null default 'cash_on_delivery' check (payment_method = 'cash_on_delivery'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  promo_code text,
  created_at timestamptz not null default now()
);
create index orders_created_at_idx on public.orders(created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  product_name text not null,
  sku text not null,
  size text,
  color text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 10)
);

create table public.order_email_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('customer', 'shop')),
  recipient text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (order_id, kind)
);

create table public.promo_codes (
  code text primary key,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  amount integer not null check (amount > 0),
  check (discount_type <> 'percent' or amount <= 100),
  min_subtotal_cents integer not null default 0,
  usage_limit integer,
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz,
  active boolean not null default false
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.form_attempts (
  id bigint generated always as identity primary key,
  scope text not null,
  subject_hash text not null,
  created_at timestamptz not null default now()
);
create index form_attempts_lookup_idx on public.form_attempts(scope, subject_hash, created_at desc);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Supabase defaults can grant broad access to public tables. Remove it explicitly.
revoke all on public.brands, public.categories, public.products, public.product_categories,
  public.product_variants, public.product_images, public.customers, public.orders,
  public.order_items, public.order_email_outbox, public.promo_codes, public.newsletter_subscribers,
  public.contact_messages, public.form_attempts, public.admin_users from anon, authenticated;
revoke all on sequence public.order_number_seq from anon, authenticated;

alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_email_outbox enable row level security;
alter table public.promo_codes enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.form_attempts enable row level security;
alter table public.admin_users enable row level security;

grant select on public.brands, public.categories, public.products,
  public.product_categories, public.product_variants, public.product_images to anon, authenticated;

create policy "Public reads published brands" on public.brands
  for select to anon, authenticated using (published);
create policy "Public reads published categories" on public.categories
  for select to anon, authenticated using (published);
create policy "Public reads published products" on public.products
  for select to anon, authenticated using (published);
create policy "Public reads published product categories" on public.product_categories
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.published)
    and exists (select 1 from public.categories c where c.id = category_id and c.published)
  );
create policy "Public reads published variants" on public.product_variants
  for select to anon, authenticated using (
    published and exists (select 1 from public.products p where p.id = product_id and p.published)
  );
create policy "Public reads published images" on public.product_images
  for select to anon, authenticated using (
    published and exists (select 1 from public.products p where p.id = product_id and p.published)
  );
