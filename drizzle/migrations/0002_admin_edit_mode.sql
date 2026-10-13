-- Read for everyone, write only for admins (RLS enforced server-side)
GRANT SELECT ON public.items, public.categories, public.tags, public.item_types, public.item_categories, public.item_tags, public.item_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.items, public.categories, public.tags, public.item_types, public.item_categories, public.item_tags, public.item_images TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['items','categories','tags','item_types','item_categories','item_tags','item_images'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins delete" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Admins insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Admins update" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Admins delete" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t);
  END LOOP;
END $$;

-- Deleting an entry or folder removes its links automatically (no orphan rows)
ALTER TABLE public.item_categories DROP CONSTRAINT item_categories_item_id_fkey,
  ADD CONSTRAINT item_categories_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;
ALTER TABLE public.item_categories DROP CONSTRAINT item_categories_category_id_fkey,
  ADD CONSTRAINT item_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE public.item_tags DROP CONSTRAINT item_tags_item_id_fkey,
  ADD CONSTRAINT item_tags_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;
ALTER TABLE public.item_tags DROP CONSTRAINT item_tags_tag_id_fkey,
  ADD CONSTRAINT item_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE public.item_images DROP CONSTRAINT item_images_item_id_fkey,
  ADD CONSTRAINT item_images_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;

-- Atomic save of an entry with its folders, tags and gallery. Runs as the caller, so RLS applies.
CREATE OR REPLACE FUNCTION public.admin_save_item(_id uuid, _item jsonb, _category_ids uuid[], _tag_ids uuid[], _images jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF coalesce(trim(_item->>'name'),'') = '' OR coalesce(trim(_item->>'slug'),'') = '' THEN RAISE EXCEPTION 'Nombre y slug son obligatorios'; END IF;
  IF _id IS NULL THEN
    INSERT INTO items(slug, type_id, name, subtitle, description, image_key, attributes)
    VALUES (_item->>'slug', (_item->>'type_id')::uuid, _item->>'name', nullif(_item->>'subtitle',''), nullif(_item->>'description',''), nullif(_item->>'image_key',''), coalesce(_item->'attributes','[]'::jsonb))
    RETURNING id INTO v;
  ELSE
    UPDATE items SET slug=_item->>'slug', type_id=(_item->>'type_id')::uuid, name=_item->>'name', subtitle=nullif(_item->>'subtitle',''),
      description=nullif(_item->>'description',''), image_key=nullif(_item->>'image_key',''), attributes=coalesce(_item->'attributes','[]'::jsonb)
    WHERE id=_id RETURNING id INTO v;
    IF v IS NULL THEN RAISE EXCEPTION 'Entrada no encontrada'; END IF;
  END IF;
  DELETE FROM item_categories WHERE item_id = v;
  INSERT INTO item_categories(item_id, category_id) SELECT DISTINCT v, c FROM unnest(_category_ids) c;
  DELETE FROM item_tags WHERE item_id = v;
  INSERT INTO item_tags(item_id, tag_id) SELECT DISTINCT v, t FROM unnest(_tag_ids) t;
  DELETE FROM item_images WHERE item_id = v;
  INSERT INTO item_images(item_id, image_key, caption, position)
    SELECT v, e->>'image_key', nullif(e->>'caption',''), (ord - 1)::int
    FROM jsonb_array_elements(coalesce(_images,'[]'::jsonb)) WITH ORDINALITY AS x(e, ord)
    WHERE coalesce(e->>'image_key','') <> '';
  RETURN v;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_save_item(uuid, jsonb, uuid[], uuid[], jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_item(uuid, jsonb, uuid[], uuid[], jsonb) TO authenticated;