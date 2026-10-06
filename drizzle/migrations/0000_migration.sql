create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  parent_id uuid references public.categories(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.plants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  scientific_name text,
  family text,
  description text,
  image_key text,
  created_at timestamptz not null default now()
);
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);
create table public.plant_categories (
  plant_id uuid not null references public.plants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (plant_id, category_id)
);
create table public.plant_tags (
  plant_id uuid not null references public.plants(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (plant_id, tag_id)
);

do $$
declare t text;
begin
  foreach t in array array['categories','plants','tags','plant_categories','plant_tags'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "Admins insert" on public.%I for insert to authenticated with check (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "Admins update" on public.%I for update to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "Admins delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
  end loop;
end $$;

insert into public.categories (slug, name, description) values
 ('frutas','Frutas','Plantas cultivadas por sus frutos comestibles.'),
 ('bayas','Bayas','Frutos carnosos con semillas en la pulpa.'),
 ('arboles','Árboles','Plantas leñosas de tronco único.'),
 ('aromaticas','Hierbas aromáticas','Plantas de hoja fragante usadas en cocina.');
insert into public.categories (slug, name, description, parent_id) values
 ('frutas-dulces','Frutas dulces','Frutos de sabor dulce.', (select id from public.categories where slug='frutas')),
 ('frutas-acidas','Frutas ácidas','Frutos de sabor ácido o cítrico.', (select id from public.categories where slug='frutas')),
 ('frutales','Frutales','Árboles que dan fruto.', (select id from public.categories where slug='arboles'));

insert into public.tags (slug, name) values
 ('dulce','Dulce'),('comestible','Comestible'),('verano','Verano'),('tropical','Tropical'),
 ('sol','Sol pleno'),('perenne','Perenne'),('citrico','Cítrico'),('culinaria','Culinaria');

insert into public.plants (slug, name, scientific_name, family, description, image_key) values
 ('sandia','Sandía','Citrullus lanatus','Cucurbitaceae','Planta rastrera anual originaria de África. Su fruto, botánicamente una baya, es grande, de pulpa roja, jugosa y dulce, ideal para el verano.','sandia'),
 ('mango','Mango','Mangifera indica','Anacardiaceae','Árbol perenne originario del sur de Asia. Se cultiva en regiones tropicales por su fruto dulce y su follaje persistente.','mango'),
 ('fresa','Fresa','Fragaria × ananassa','Rosaceae','Planta herbácea de porte bajo cuyo fruto rojo y aromático es uno de los más apreciados en repostería.','fresa'),
 ('limon','Limonero','Citrus × limon','Rutaceae','Árbol pequeño de hojas perennes y flores perfumadas. Su fruto ácido es base de innumerables recetas.','limon'),
 ('higo','Higuera','Ficus carica','Moraceae','Árbol mediterráneo de hojas lobuladas. Sus higos son dulces y se consumen frescos o secos.','higo'),
 ('albahaca','Albahaca','Ocimum basilicum','Lamiaceae','Hierba aromática anual de hojas tiernas, esencial en la cocina mediterránea.','albahaca');

insert into public.plant_categories (plant_id, category_id)
select p.id, c.id from (values
 ('sandia','frutas'),('sandia','frutas-dulces'),('sandia','bayas'),
 ('mango','frutas'),('mango','frutas-dulces'),('mango','arboles'),('mango','frutales'),
 ('fresa','frutas'),('fresa','frutas-dulces'),
 ('limon','frutas'),('limon','frutas-acidas'),('limon','arboles'),('limon','frutales'),
 ('higo','frutas'),('higo','frutas-dulces'),('higo','arboles'),('higo','frutales'),
 ('albahaca','aromaticas')
) v(ps, cs) join public.plants p on p.slug=v.ps join public.categories c on c.slug=v.cs;

insert into public.plant_tags (plant_id, tag_id)
select p.id, t.id from (values
 ('sandia','dulce'),('sandia','comestible'),('sandia','verano'),
 ('mango','dulce'),('mango','comestible'),('mango','tropical'),('mango','perenne'),
 ('fresa','dulce'),('fresa','comestible'),('fresa','verano'),
 ('limon','citrico'),('limon','comestible'),('limon','perenne'),('limon','sol'),
 ('higo','dulce'),('higo','comestible'),('higo','sol'),
 ('albahaca','culinaria'),('albahaca','verano'),('albahaca','sol')
) v(ps, ts) join public.plants p on p.slug=v.ps join public.tags t on t.slug=v.ts;