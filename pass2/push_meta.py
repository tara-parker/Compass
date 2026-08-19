#!/usr/bin/env python3
"""Pass 2: query-shaped titles + optimised meta descriptions on the 74 Acumatica pages.

Writes three things per page:
  post_title                       -> AIOSEO SEO title (template appends " - ChatFin")
  excerpt                          -> meta description (template path)
  aioseo_meta_data.description     -> meta description (explicit override, authoritative)

The slug and the URL are never touched. The visible H1 lives in the Divi content
and is not touched here either.

Safety: every page is resolved by slug and then its live `link` is compared with the
expected URL from tracker_rows.json. A mismatch aborts that page rather than writing
a title onto the wrong post.

    python3 push_meta.py            dry run, resolves + verifies every page, writes nothing
    python3 push_meta.py --go       live
    python3 push_meta.py --one <slug>
"""
import json, os, sys, time
import wp

DELAY, PAUSE_EVERY, PAUSE_FOR = 8, 15, 45
STATE = "pass2_state.json"

rows = json.load(open("tracker_rows.json"))
state = json.load(open(STATE)) if os.path.exists(STATE) else {}


def slug_of(r):
    return r["path"].rstrip("/").split("/")[-1]


def norm(u):
    return u.replace("https://", "").replace("http://", "").rstrip("/")


def push(r, dry):
    slug = slug_of(r)
    t, p = wp.find_by_slug(slug)
    if not p:
        return "NOT FOUND", None

    # guard: the resolved post must be the URL we meant
    if norm(p["link"]) != norm(r["url"]):
        return f"URL MISMATCH got {norm(p['link'])[:52]}", p["id"]

    cur = wp.call("GET", f"/{t}/{p['id']}",
                  {"context": "edit", "_fields": "id,title,excerpt,aioseo_meta_data"})
    ct = cur["title"]["raw"].strip()
    ce = cur["excerpt"]["raw"].strip()
    ca = (cur.get("aioseo_meta_data") or {}).get("description") or ""
    nt, nm = r["new_title"].strip(), r["new_meta"].strip()

    if ct == nt and ce == nm and ca.strip() == nm:
        return "ALREADY OK", p["id"]
    if dry:
        return f"WOULD UPDATE (title {len(ct)}->{len(nt)})", p["id"]

    wp.call("POST", f"/{t}/{p['id']}", body={
        "title": nt,
        "excerpt": nm,
        "aioseo_meta_data": {"description": nm},
    })
    return "UPDATED", p["id"]


def main():
    dry = "--go" not in sys.argv
    if "--one" in sys.argv:
        target = sys.argv[sys.argv.index("--one") + 1]
        sel = [r for r in rows if slug_of(r) == target]
        if not sel:
            sys.exit("slug not in the set: " + target)
    else:
        sel = [r for r in rows if state.get(slug_of(r)) != "UPDATED"]

    print(f"{'DRY RUN' if dry else 'LIVE'} - {len(sel)} page(s)\n")
    done = problems = 0
    for i, r in enumerate(sel, 1):
        slug = slug_of(r)
        try:
            status, pid = push(r, dry)
        except Exception as e:
            status, pid = f"ERROR {e}"[:90], None
        if status == "UPDATED":
            state[slug] = "UPDATED"
            json.dump(state, open(STATE, "w"), indent=1)
            done += 1
        if "MISMATCH" in status or "ERROR" in status or "NOT FOUND" in status:
            problems += 1
        print(f"  {i:>3}/{len(sel)}  {status:<44} {slug[:58]}", flush=True)
        if "sgcaptcha" in status:
            print("  backing off 90s", flush=True)
            time.sleep(90)
        if not dry and i < len(sel):
            time.sleep(DELAY)
            if i % PAUSE_EVERY == 0:
                print(f"  ... pausing {PAUSE_FOR}s for SiteGround's limiter", flush=True)
                time.sleep(PAUSE_FOR)
    print(f"\nupdated this run: {done}   problems: {problems}   "
          f"recorded: {sum(1 for v in state.values() if v=='UPDATED')}/74")


main()
