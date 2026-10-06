<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Agents

- Plants are stored once and linked to categories/tags via join tables (plant_categories, plant_tags); categories nest via parent_id. Why: a plant must appear in many folders without duplication.
- Catalog writes are allowed only for users with the `admin` role in `user_roles` (RLS via `has_role`); everyone can read. Why: regular users must never modify the catalog.
- Plant images are bundled assets keyed by `plants.image_key` (src/lib/catalog.ts). Why: seed images ship with the app.
