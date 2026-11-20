-- LUNA database. Paste into Supabase → SQL Editor → Run.
-- Shops & products are public (customers browse them). Only the shop owner can change them.
-- Anyone can place an order; prices and totals are recalculated here, never trusted from the browser.

create table if not exists shops (
  slug        text primary key,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 60),
  city        text not null,
  role        text not null default 'Seller',
  ecocash     text not null,
  color       text not null default '#F5B700',
  settings    jsonb not null default '{}'::jsonb,   -- social links, post queue, reminder, auto mode
  created_at  timestamptz not null default now()
);

create table if not exists products (
  id          text primary key,
  shop_slug   text not null references shops(slug) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  price       numeric(10,2) not null check (price > 0),
  was         numeric(10,2) not null default 0,
  stock       int not null default 0 check (stock >= 0),
  img         text not null,
  descr       text not null default '',
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists orders (
  id          text primary key,
  shop_slug   text not null references shops(slug) on delete cascade,
  customer    text not null check (char_length(customer) between 1 and 60),
  phone       text not null,
  area        text not null default '',
  items       jsonb not null,            -- [{pid, qty}] in; [{pid, name, qty, price}] stored
  total       numeric(10,2) not null default 0,
  method      text not null check (method in ('ecocash','cod','paynow')),
  ref         text not null default '',
  status      text not null default 'awaiting'
              check (status in ('awaiting','cod','pending_paynow','paid','delivered','payment_failed')),
  paynow_poll text,
  created_at  timestamptz not null default now()
);

create table if not exists views (
  id bigserial primary key,
  shop_slug text not null references shops(slug) on delete cascade,
  at timestamptz not null default now()
);

create table if not exists withdrawals (
  id bigserial primary key,
  shop_slug text not null references shops(slug) on delete cascade,
  amt numeric(10,2) not null check (amt > 0),
  at timestamptz not null default now()
);

create index if not exists products_shop on products(shop_slug);
create index if not exists orders_shop on orders(shop_slug, created_at desc);
create index if not exists views_shop on views(shop_slug, at desc);

-- Price every new order from the products table and take the stock.
create or replace function luna_price_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare it jsonb; p products%rowtype; q int; priced jsonb := '[]'::jsonb; sum numeric := 0;
begin
  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 or jsonb_array_length(new.items) > 20 then
    raise exception 'Order needs 1 to 20 items';
  end if;
  for it in select * from jsonb_array_elements(new.items) loop
    q := coalesce((it->>'qty')::int, 0);
    if q < 1 or q > 50 then raise exception 'Bad quantity'; end if;
    select * into p from products where id = it->>'pid' and shop_slug = new.shop_slug for update;
    if not found then raise exception 'Product not found'; end if;
    if p.stock < q then raise exception 'Only % left of %', p.stock, p.name; end if;
    update products set stock = stock - q where id = p.id;
    priced := priced || jsonb_build_object('pid', p.id, 'name', p.name, 'qty', q, 'price', p.price);
    sum := sum + p.price * q;
  end loop;
  new.items := priced;
  new.total := sum;
  new.created_at := now();
  new.paynow_poll := null;
  -- customers can only create unpaid orders
  if new.method = 'paynow' then new.status := 'pending_paynow';
  elsif new.method = 'cod' then new.status := 'cod';
  else new.status := 'awaiting'; end if;
  return new;
end $$;

drop trigger if exists luna_price_order on orders;
create trigger luna_price_order before insert on orders for each row execute function luna_price_order();

-- Row Level Security
alter table shops enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table views enable row level security;
alter table withdrawals enable row level security;

create or replace function luna_owns(s text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from shops where slug = s and owner = auth.uid())
$$;

drop policy if exists "shops public read" on shops;
create policy "shops public read" on shops for select using (true);
drop policy if exists "shops owner insert" on shops;
create policy "shops owner insert" on shops for insert to authenticated with check (owner = auth.uid());
drop policy if exists "shops owner update" on shops;
create policy "shops owner update" on shops for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "products public read" on products;
create policy "products public read" on products for select using (true);
drop policy if exists "products owner write" on products;
create policy "products owner write" on products for all to authenticated using (luna_owns(shop_slug)) with check (luna_owns(shop_slug));

drop policy if exists "orders anyone create" on orders;
create policy "orders anyone create" on orders for insert to anon, authenticated with check (true);
drop policy if exists "orders owner read" on orders;
create policy "orders owner read" on orders for select to authenticated using (luna_owns(shop_slug));
drop policy if exists "orders owner update" on orders;
create policy "orders owner update" on orders for update to authenticated using (luna_owns(shop_slug)) with check (luna_owns(shop_slug));

drop policy if exists "views anyone add" on views;
create policy "views anyone add" on views for insert to anon, authenticated with check (true);
drop policy if exists "views owner read" on views;
create policy "views owner read" on views for select to authenticated using (luna_owns(shop_slug));

drop policy if exists "withdrawals owner" on withdrawals;
create policy "withdrawals owner" on withdrawals for all to authenticated using (luna_owns(shop_slug)) with check (luna_owns(shop_slug));

-- Sellers can't edit an order's money fields, only its status.
revoke update on orders from authenticated;
grant update (status) on orders to authenticated;
