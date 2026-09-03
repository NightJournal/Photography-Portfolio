#!/usr/bin/env python3
"""
Add new photos to the site: build both image tiers and update the gallery pages.

Usage:
    ./add-photos.sh              process every region inbox
    ./add-photos.sh europe       process one region
    ./add-photos.sh --check      verify existing tiers, change nothing
    ./add-photos.sh --fix-counts recount section headings only

Drop photos into photos/_inbox/<region>/ and list them in that folder's
captions.txt, one per line:

    IMG_0922.jpg | switzerland | Matterhorn, Zermatt 2024
      filename   |  section id |  caption (used for alt and figcaption)

Tiers written (see tools/README.md):
    photos/full/<region>/  3200px long edge, quality 96   -> lightbox
    photos/web/<region>/   1800px long edge, quality 94   -> inline on page
"""

import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FULL_PX, FULL_Q = 3200, 96
WEB_PX, WEB_Q = 1800, 94

REGION_PAGE = {
    "asia": "gallery-asia.html",
    "europe": "gallery-europe.html",
    "north-america": "gallery-northamerica.html",
    "south-africa": "gallery-southafrica.html",
    "astrophotography": "gallery-astrophotography.html",
}

INBOX = os.path.join(ROOT, "photos", "_inbox")
PROCESSED = os.path.join(INBOX, "_processed")
EXTS = (".jpg", ".jpeg", ".JPG", ".JPEG")


# ---------------------------------------------------------------- image tools

def _which(*names):
    for n in names:
        p = shutil.which(n)
        if p:
            return n
    return None


IM = _which("magick", "convert")
SIPS = _which("sips")


def dimensions(path):
    """(width, height) or None."""
    if IM:
        ident = "magick" if IM == "magick" else "identify"
        if shutil.which(ident) is None:
            ident = IM
        try:
            args = [ident, "identify"] if ident == "magick" else [ident]
            out = subprocess.run(args + ["-format", "%w %h", path],
                                 capture_output=True, text=True, timeout=60)
            w, h = out.stdout.split()[:2]
            return int(w), int(h)
        except Exception:
            pass
    if SIPS:
        try:
            out = subprocess.run([SIPS, "-g", "pixelWidth", "-g", "pixelHeight", path],
                                 capture_output=True, text=True, timeout=60)
            w = h = None
            for line in out.stdout.splitlines():
                if "pixelWidth:" in line:
                    w = int(line.split(":")[1])
                elif "pixelHeight:" in line:
                    h = int(line.split(":")[1])
            if w and h:
                return w, h
        except Exception:
            pass
    return None


def resize(src, dst, px, quality):
    """Downscale src into dst. Never upscales. Returns True on success."""
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + ".tmp"
    try:
        if IM:
            # VERIFIED path.
            subprocess.run([IM, src, "-filter", "Lanczos",
                            "-resize", f"{px}x{px}>", "-quality", str(quality), tmp],
                           check=True, capture_output=True, timeout=300)
        elif SIPS:
            # UNTESTED fallback for a Mac without ImageMagick.
            shutil.copy2(src, tmp)
            subprocess.run([SIPS, "-Z", str(px), "-s", "format", "jpeg",
                            "-s", "formatOptions", str(quality), tmp],
                           check=True, capture_output=True, timeout=300)
        else:
            die("Need ImageMagick or sips. Install with: brew install imagemagick")

        # Sanity guard: a low-quality source can grow when re-encoded higher.
        if os.path.getsize(tmp) >= os.path.getsize(src):
            d = dimensions(src)
            if d and max(d) <= px:
                shutil.copy2(src, dst)
                os.remove(tmp)
                print(f"      kept original (re-encoding would enlarge it)")
                return True
        os.replace(tmp, dst)
        return True
    except subprocess.CalledProcessError as e:
        if os.path.exists(tmp):
            os.remove(tmp)
        print(f"      FAILED: {e.stderr.decode()[:200] if e.stderr else e}")
        return False


# ---------------------------------------------------------------- html editing

FIGURE = ('<figure class="photo-card">\n'
          '  <img src="photos/web/{region}/{name}" '
          'data-full-src="photos/full/{region}/{name}" '
          'alt="{caption}" loading="lazy" decoding="async">\n'
          '  <figcaption>{caption}</figcaption>\n'
          '</figure>\n')


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def section_span(html, section_id):
    """Return (start, end) char offsets of one country-section, or None."""
    m = re.search(r'<section class="country-section" id="%s">' % re.escape(section_id), html)
    if not m:
        return None
    end = html.find("</section>", m.end())
    if end == -1:
        return None
    return m.start(), end


def insert_figures(page_path, section_id, blocks):
    html = open(page_path, encoding="utf-8").read()
    span = section_span(html, section_id)
    if span is None:
        return False, f'no <section id="{section_id}"> in {os.path.basename(page_path)}'
    start, end = span
    body = html[start:end]
    if 'class="photo-grid"' not in body:
        return False, f'section "{section_id}" has no photo-grid'
    # insert before the </div> that closes the grid (last </div> in the section)
    cut = body.rfind("</div>")
    if cut == -1:
        return False, f'section "{section_id}" markup not understood'
    # step back to the start of that line so we don't steal its indentation
    line_start = body.rfind("\n", 0, cut) + 1
    if body[line_start:cut].strip() == "":
        cut = line_start
    new_body = body[:cut] + "".join(blocks) + body[cut:]
    open(page_path, "w", encoding="utf-8").write(html[:start] + new_body + html[end:])
    return True, None


def fix_counts(verbose=True):
    """Rewrite every <span>N Photos</span> to the real figure count."""
    changed = 0
    for page in sorted(set(REGION_PAGE.values())):
        p = os.path.join(ROOT, page)
        if not os.path.exists(p):
            continue
        html = open(p, encoding="utf-8").read()
        out, pos = [], 0
        for m in re.finditer(r'<section class="country-section" id="([^"]+)">', html):
            sid = m.group(1)
            end = html.find("</section>", m.end())
            body = html[m.start():end]
            actual = body.count('class="photo-card"')
            sm = re.search(r'(<span>)(\d+)(\s*Photos?</span>)', body)
            if sm and int(sm.group(2)) != actual:
                new_body = body[:sm.start()] + sm.group(1) + str(actual) + sm.group(3) + body[sm.end():]
                out.append(html[pos:m.start()]); out.append(new_body); pos = end
                changed += 1
                if verbose:
                    print(f"  {page:32} {sid:18} {sm.group(2)} -> {actual}")
        if out:
            out.append(html[pos:])
            open(p, "w", encoding="utf-8").write("".join(out))
    return changed


# ---------------------------------------------------------------- checking

def check():
    problems = 0
    for region in REGION_PAGE:
        for tier, px in (("full", FULL_PX), ("web", WEB_PX)):
            d = os.path.join(ROOT, "photos", tier, region)
            if not os.path.isdir(d):
                continue
            for fn in sorted(os.listdir(d)):
                if not fn.endswith(EXTS):
                    continue
                path = os.path.join(d, fn)
                dim = dimensions(path)
                if dim and max(dim) > px:
                    print(f"  OVERSIZE photos/{tier}/{region}/{fn}  {dim[0]}x{dim[1]} > {px}px")
                    problems += 1
        # tier pairing
        w = os.path.join(ROOT, "photos", "web", region)
        f = os.path.join(ROOT, "photos", "full", region)
        if os.path.isdir(w) and os.path.isdir(f):
            ws = {x for x in os.listdir(w) if x.endswith(EXTS)}
            fs = {x for x in os.listdir(f) if x.endswith(EXTS)}
            for missing in sorted(ws - fs):
                print(f"  NO FULL  photos/web/{region}/{missing} has no full/ counterpart")
                problems += 1
    # unreferenced photos
    for region, page in REGION_PAGE.items():
        p = os.path.join(ROOT, page)
        w = os.path.join(ROOT, "photos", "web", region)
        if not (os.path.exists(p) and os.path.isdir(w)):
            continue
        html = open(p, encoding="utf-8").read()
        for fn in sorted(os.listdir(w)):
            if fn.endswith(EXTS) and fn not in html:
                print(f"  UNUSED   photos/web/{region}/{fn} is in no gallery page")
                problems += 1
    return problems


# ---------------------------------------------------------------- main

def die(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def read_captions(region_dir):
    """{filename: (section, caption)} from captions.txt"""
    path = os.path.join(region_dir, "captions.txt")
    if not os.path.exists(path):
        return {}, []
    out, errors = {}, []
    for n, raw in enumerate(open(path, encoding="utf-8"), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) != 3:
            errors.append(f"captions.txt line {n}: expected 'file | section | caption', got: {line}")
            continue
        out[parts[0]] = (parts[1], parts[2])
    return out, errors


def process_region(region):
    region_dir = os.path.join(INBOX, region)
    if not os.path.isdir(region_dir):
        return 0
    photos = sorted(f for f in os.listdir(region_dir) if f.endswith(EXTS))
    if not photos:
        return 0

    print(f"\n{region}: {len(photos)} photo(s) in inbox")
    captions, errors = read_captions(region_dir)
    for e in errors:
        print(f"  ! {e}")

    page = os.path.join(ROOT, REGION_PAGE[region])
    by_section, done = {}, []

    for fn in photos:
        src = os.path.join(region_dir, fn)
        if fn not in captions:
            print(f"  SKIP {fn} - no entry in captions.txt")
            continue
        section, caption = captions[fn]

        full_dst = os.path.join(ROOT, "photos", "full", region, fn)
        web_dst = os.path.join(ROOT, "photos", "web", region, fn)
        if os.path.exists(full_dst) or os.path.exists(web_dst):
            print(f"  SKIP {fn} - already exists in a tier (delete it first to replace)")
            continue

        print(f"  {fn} -> [{section}] {caption}")
        if not resize(src, full_dst, FULL_PX, FULL_Q):
            continue
        if not resize(src, web_dst, WEB_PX, WEB_Q):
            continue
        by_section.setdefault(section, []).append(
            FIGURE.format(region=region, name=fn, caption=esc(caption)))
        done.append(fn)

    for section, blocks in by_section.items():
        ok, err = insert_figures(page, section, blocks)
        if ok:
            print(f"  + {len(blocks)} block(s) into {REGION_PAGE[region]} #{section}")
        else:
            print(f"  ! {err} - images were written, add the blocks by hand")

    if done:
        os.makedirs(PROCESSED, exist_ok=True)
        for fn in done:
            shutil.move(os.path.join(region_dir, fn), os.path.join(PROCESSED, fn))
        print(f"  moved {len(done)} original(s) to photos/_inbox/_processed/")
    return len(done)


def main():
    args = sys.argv[1:]
    if not IM and not SIPS:
        die("no image tool found. Install ImageMagick: brew install imagemagick")

    if "--check" in args:
        print("Checking photo tiers...")
        n = check()
        print(f"\n{n} problem(s)." if n else "\nAll tiers OK.")
        sys.exit(1 if n else 0)

    if "--fix-counts" in args:
        print("Recounting section headings...")
        n = fix_counts()
        print(f"{n} heading(s) updated." if n else "All counts already correct.")
        sys.exit(0)

    regions = [a for a in args if not a.startswith("-")] or list(REGION_PAGE)
    for r in regions:
        if r not in REGION_PAGE:
            die(f"unknown region '{r}'. Known: {', '.join(REGION_PAGE)}")

    total = sum(process_region(r) for r in regions)
    if total:
        print("\nRecounting section headings...")
        fix_counts()
        print(f"\nAdded {total} photo(s). Review with 'git diff', then commit.")
    else:
        print("Nothing to do. Drop photos into photos/_inbox/<region>/ "
              "and list them in that folder's captions.txt.")


if __name__ == "__main__":
    main()
