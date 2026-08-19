#!/usr/bin/env python3
"""Fetch every live Acumatica page and check the rendered title and meta description
actually match what we pushed. An API 200 is not proof the meta rendered.

Also confirms the URL still resolves 200 with no redirect, i.e. no slug moved.
"""
import json, re, sys, time, urllib.request, urllib.error
from html import unescape as _unesc

rows = json.load(open("tracker_rows.json"))
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ChatFin-SEO/1.0"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.status, r.geturl(), r.read().decode("utf-8", "replace")


def main():
    ok = bad = 0
    problems = []
    for i, r in enumerate(rows, 1):
        url, nt, nm = r["url"], r["new_title"].strip(), r["new_meta"].strip()
        try:
            status, final, html = fetch(url)
        except Exception as e:
            problems.append((url, f"FETCH {e}"))
            bad += 1
            print(f"  {i:>3}/74  FETCH FAIL   {url}", flush=True)
            continue

        t = re.search(r"<title[^>]*>(.*?)</title>", html, re.S)
        d = re.search(r'<meta name="description"\s+content="(.*?)"', html, re.S)
        title = _unesc((t.group(1) if t else "").strip())
        desc = _unesc((d.group(1) if d else "").strip())

        issues = []
        if final.rstrip("/") != url.rstrip("/"):
            issues.append(f"REDIRECTED to {final}")
        # AIOSEO appends " - ChatFin"
        if not title.startswith(nt):
            issues.append(f"TITLE is {title[:70]!r}")
        if desc != nm:
            issues.append(f"META is {desc[:70]!r}")
        if len(title) > 62:
            issues.append(f"TITLE {len(title)} chars")

        if issues:
            bad += 1
            problems.append((url, "; ".join(issues)))
            print(f"  {i:>3}/74  PROBLEM      {url.replace('https://chatfin.ai','')}", flush=True)
            for x in issues:
                print(f"            {x}", flush=True)
        else:
            ok += 1
            print(f"  {i:>3}/74  OK  t={len(title):>2}  m={len(desc):>3}  "
                  f"{url.replace('https://chatfin.ai','')[:60]}", flush=True)
        time.sleep(1.5)

    print(f"\n=== {ok} OK, {bad} with problems, of {len(rows)} ===")
    if problems:
        print("\nPROBLEMS")
        for u, p in problems:
            print(f"  {u}\n     {p}")
    json.dump({"ok": ok, "bad": bad, "problems": problems},
              open("verify_result.json", "w"), indent=1)


main()
