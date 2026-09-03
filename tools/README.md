# Photo tooling

Two image tiers, both tracked in Git:

| Tier | Size | Quality | Used for |
|---|---|---|---|
| `photos/full/<region>/` | 3200px long edge | 96 | what the lightbox loads (`data-full-src`) |
| `photos/web/<region>/`  | 1800px long edge | 94 | what the page loads inline (`src`) |

Regions: `asia`, `europe`, `north-america`, `south-africa`, `astrophotography`.

## Adding photos

1. Drop the exports into `photos/_inbox/<region>/`.
2. Add a line per photo to that folder's `captions.txt`:

   ```
   IMG_0922.jpg | switzerland | Matterhorn, Zermatt 2024
   ```

   The valid section ids for that region are listed at the bottom of each
   `captions.txt`. The caption becomes both the `alt` text and the visible
   `<figcaption>`.

3. Run it:

   ```
   ./add-photos.sh
   ```

It writes both tiers, inserts the `<figure>` blocks into the right country
section of the right gallery page, recounts every "N Photos" heading, and moves
the originals to `photos/_inbox/_processed/`. Review with `git diff`, then commit.

## Other commands

```
./add-photos.sh europe        only that region
./add-photos.sh --check       report tier violations and unused photos
./add-photos.sh --fix-counts  recount section headings only
```

## The commit guard

`tools/pre-commit` refuses any commit containing an image over its tier limit.
Git does not track hooks, so after a fresh clone run:

```
bash tools/install-hooks.sh
```

Bypass for one commit with `git commit --no-verify`.

## Requirements

ImageMagick (`brew install imagemagick`) is the tested path. The script falls
back to macOS `sips` if ImageMagick is missing; that fallback is untested.

## Why this exists

`.gitignore` once listed `photos/asia/*` while the real paths were
`photos/full/asia/` and `photos/web/asia/`, so the patterns matched nothing and
55 full-resolution photos (up to 8011x5220, 27MB each) were committed. The
tiers had also drifted: two un-resized originals sat in `photos/web/`, one of
them the homepage's first featured photo at 2.8MB. Resizing by hand is what let
that happen, so it is now a script plus a hook.
