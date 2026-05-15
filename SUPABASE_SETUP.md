# Supabase Schema & RLS Setup — Mother's Touch Tiffin

## Tables

### 1. `menu_items`
```sql
create table menu_items (
  id          serial primary key,
  name        text not null,
  description text,
  price       int4 not null,
  category    text,
  is_veg      bool default true,
  emoji       text,
  image_url   text,
  is_active   bool default true,
  created_at  timestamptz default now()
);
```

### 2. `cooks`
```sql
create table cooks (
  id           serial primary key,
  user_id      uuid references auth.users(id),
  name         text not null,
  phone        text,
  zone         text,
  rating       numeric default 0,
  total_orders int4 default 0,
  is_available bool default false,
  created_at   timestamptz default now()
);
```

### 3. `delivery_partners`
```sql
create table delivery_partners (
  id           serial primary key,
  user_id      uuid references auth.users(id),
  name         text not null,
  phone        text,
  zone         text,
  is_available bool default false,
  rating       numeric default 0,
  created_at   timestamptz default now()
);
```

### 4. `profiles`
```sql
create table profiles (
  id         serial primary key,
  user_id    uuid references auth.users(id),
  name       text,
  phone      text,
  zone       text,
  role       text default 'customer',
  mobile_no  text,
  created_at timestamptz default now()
);
```

### 5. `orders`
```sql
create table orders (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid references auth.users(id),
  customer_name       text,
  phone               text,
  address             text,
  zone                text,
  items               jsonb,
  total               int4,
  status              text default 'pending',
  cook_id             int4 references cooks(id),
  delivery_partner_id int4 references delivery_partners(id),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  cook_rating         numeric,
  delivery_rating     numeric
);
```

### 6. `subscriptions`
```sql
create table subscriptions (
  id         serial primary key,
  user_id    uuid references auth.users(id),
  plan       text,
  zone       text,
  start_date date,
  end_date   date,
  is_active  bool default true,
  created_at timestamptz default now()
);
```

---

## RLS Policies

Enable RLS on all tables first:
```sql
alter table menu_items          enable row level security;
alter table cooks               enable row level security;
alter table delivery_partners   enable row level security;
alter table profiles            enable row level security;
alter table orders              enable row level security;
alter table subscriptions       enable row level security;
```

---

### `menu_items` Policies
```sql
-- Anyone can read menu
create policy "anyone can read menu"
on menu_items for select
using (true);
```

---

### `cooks` Policies
```sql
-- Anyone can read cooks (needed for order tracking)
create policy "anyone can read cooks"
on cooks for select
using (true);

-- Admin can read all cooks
create policy "Admin can read all cooks"
on cooks for select
using (true);

-- Cook can read own profile
create policy "cooks can read own profile"
on cooks for select
using (auth.uid() = user_id);

-- Cook can insert own profile
create policy "cooks can insert own profile"
on cooks for insert
with check (auth.uid() = user_id);

-- Cook can update own profile
create policy "cooks can update own profile"
on cooks for update
using (auth.uid() = user_id);

-- Allow rating updates (from delivery/admin flows)
create policy "allow rating update on cooks"
on cooks for update
using (true)
with check (true);
```

---

### `delivery_partners` Policies
```sql
-- Delivery partner can read own profile
create policy "delivery can read own profile"
on delivery_partners for select
using (auth.uid() = user_id);

-- Admin can read all delivery partners
create policy "Admin can read all delivery partners"
on delivery_partners for select
using (true);

-- Delivery partner can insert own profile
create policy "delivery can insert own profile"
on delivery_partners for insert
with check (auth.uid() = user_id);

-- Delivery partner can update own profile
create policy "delivery can update own profile"
on delivery_partners for update
using (auth.uid() = user_id);

-- Allow rating updates
create policy "allow rating update on delivery_partners"
on delivery_partners for update
using (true)
with check (true);
```

---

### `profiles` Policies
```sql
-- Customer can read own profile
create policy "customers can read own profile"
on profiles for select
using (auth.uid() = user_id);

-- Customer can insert own profile
create policy "customers can insert own profile"
on profiles for insert
with check (auth.uid() = user_id);

-- Customer can update own profile
create policy "customers can update own profile"
on profiles for update
using (auth.uid() = user_id);
```

---

### `orders` Policies
```sql
-- Customers can insert orders
create policy "customers can insert orders"
on orders for insert
with check (auth.uid() = customer_id);

-- Customers can read own orders
create policy "customers can read own orders"
on orders for select
using (auth.uid() = customer_id);

-- Customers can rate their orders
create policy "allow customers to rate their orders"
on orders for update
using (auth.uid() = customer_id)
with check (auth.uid() = customer_id);

-- Cooks can read pool orders (unassigned) + their own assigned orders
create policy "cooks can read assigned orders"
on orders for select
using (
  cook_id is null
  or cook_id in (
    select id from cooks where user_id = auth.uid()
  )
);

-- Cooks can claim unassigned orders and update their own orders
create policy "cooks can update assigned orders"
on orders for update
using (
  cook_id is null
  or cook_id in (
    select id from cooks where user_id = auth.uid()
  )
)
with check (
  cook_id in (
    select id from cooks where user_id = auth.uid()
  )
);

-- Delivery partners can read ready/unassigned orders + their own
create policy "delivery can read available orders"
on orders for select
using (
  ((status = 'ready') and (delivery_partner_id is null))
  or delivery_partner_id in (
    select id from delivery_partners where user_id = auth.uid()
  )
);

-- Delivery partners can claim and update orders
create policy "delivery can update accepted orders"
on orders for update
using (
  delivery_partner_id in (
    select id from delivery_partners where user_id = auth.uid()
  )
  or (status = 'ready' and delivery_partner_id is null)
);

-- Admin can read all orders
create policy "Admin can read all orders"
on orders for select
using (true);
```

---

### `subscriptions` Policies
```sql
-- Users can read own subscriptions
create policy "users can read own subscriptions"
on subscriptions for select
using (auth.uid() = user_id);

-- Users can insert own subscriptions
create policy "users can insert own subscriptions"
on subscriptions for insert
with check (auth.uid() = user_id);
```

---

## Realtime

Enable realtime on the `orders` table and set replica identity to FULL
so zone-based filters work correctly:

```sql
alter table orders replica identity full;
```

Then in Supabase Dashboard → Database → Replication, toggle `orders` table on.

---

## Helper Functions

### Increment cook order count on delivery
```sql
create or replace function increment_cook_orders(cook_id_input int4)
returns void as $$
  update cooks
  set total_orders = total_orders + 1
  where id = cook_id_input;
$$ language sql security definer;
```
```sql
CREATE OR REPLACE FUNCTION sync_phone_from_mobile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NULL AND NEW.mobile_no IS NOT NULL THEN
    NEW.phone := NEW.mobile_no;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_phone_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_phone_from_mobile();
```

---
###  Create the admin user in Supabase Auth

Supabase → Authentication → Users → Add user
Set an email/password (e.g. admin@tiffin.com / something strong)
```sql
UPDATE auth.users
SET raw_user_meta_data = '{"name": "Admin", "role": "admin"}'
WHERE email = 'admin@whatever.com';

CREATE POLICY "Admin can read all orders"
ON orders FOR SELECT
USING (true);

CREATE POLICY "Admin can read all cooks"
ON cooks FOR SELECT
USING (true);

CREATE POLICY "Admin can read all delivery partners"
ON delivery_partners FOR SELECT
USING (true);
```

## Flow Summary

| Event | Who | What happens in DB |
|---|---|---|
| Customer places order | Customer | `orders` INSERT, `cook_id = null`, `status = pending` |
| Cook accepts order | Cook | `orders` UPDATE, `cook_id = cook.id`, `status = preparing` |
| Cook marks ready | Cook | `orders` UPDATE, `status = ready` |
| Delivery accepts | Delivery | `orders` UPDATE, `delivery_partner_id = partner.id`, `status = picked` |
| Delivery completes | Delivery | `orders` UPDATE, `status = delivered` + `increment_cook_orders` RPC |