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

- Catalog is generic: `items` (with `item_types` and flexible `attributes` jsonb of {label,value}) linked to nested `categories` and `tags` via `item_categories`/`item_tags`; extra pictures in `item_images`. Why: one record per entry, any kind of entry, many folders without duplication.
- Catalog is read-only for all app clients (public SELECT policies only, no write grants); content is managed directly in the backend. Why: no admin system in the app by user request.
- Images are referenced by `image_key`: a bundled asset key or a full https URL (src/lib/catalog.ts). Why: user manages images themselves.
- Visual style lives entirely in src/styles.css tokens (square corners, bevelled `glass` panel utility). Why: keep redesigns token-only.
