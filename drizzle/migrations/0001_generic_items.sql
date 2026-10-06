create table public.item_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle_label text,
  created_at timestamptz not null default now()
);
create table public.items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  type_id uuid not null references public.item_types(id) on delete restrict,
  name text not null,
  subtitle text,
  description text,
  image_key text,
  attributes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table public.item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  image_key text not null,
  caption text,
  position int not null default 0
);
create table public.item_categories (
  item_id uuid not null references public.items(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (item_id, category_id)
);
create table public.item_tags (
  item_id uuid not null references public.items(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (item_id, tag_id)
);
create index on public.items(type_id);
create index on public.item_categories(category_id);
create index on public.item_tags(tag_id);
create index on public.categories(parent_id);

do $$
declare t text;
begin
  foreach t in array array['item_types','items','item_images','item_categories','item_tags'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
  foreach t in array array['categories','plants','tags','plant_categories','plant_tags'] loop
    execute format('drop policy if exists "Admins insert" on public.%I', t);
    execute format('drop policy if exists "Admins update" on public.%I', t);
    execute format('drop policy if exists "Admins delete" on public.%I', t);
    execute format('revoke insert, update, delete on public.%I from authenticated', t);
  end loop;
end $$;

insert into public.item_types (slug, name, subtitle_label) values
 ('planta','Planta','Nombre científico'),
 ('animal','Animal','Nombre científico'),
 ('alimento','Alimento','Origen');

insert into public.items (id, slug, type_id, name, subtitle, description, image_key, attributes)
select p.id, p.slug, (select id from public.item_types where slug='planta'), p.name, p.scientific_name, p.description, p.image_key,
  case when p.family is not null then jsonb_build_array(jsonb_build_object('label','Familia','value',p.family)) else '[]'::jsonb end
from public.plants p;
insert into public.item_categories (item_id, category_id) select plant_id, category_id from public.plant_categories;
insert into public.item_tags (item_id, tag_id) select plant_id, tag_id from public.plant_tags;

comment on table public.plants is 'DEPRECATED: replaced by items';
comment on table public.plant_categories is 'DEPRECATED: replaced by item_categories';
comment on table public.plant_tags is 'DEPRECATED: replaced by item_tags';
comment on table public.user_roles is 'DEPRECATED: admin system removed; catalog is read-only for clients';