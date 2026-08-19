#!/usr/bin/env python3
"""
Build data/plan26.json — the 2026 prune-and-build plan.

Every live URL is sorted into a tier by what it actually earns, then given an
action: KEEP, UPDATE, MERGE or DELETE. Output is nested cluster -> sub-cluster
-> page so the UI can mirror the site hierarchy.

Sources (read-only, outside the repo):
  ~/Downloads/chatfin-all-urls.json                     live sitemap
  ~/Desktop/chatfin/code/cf-platform/*Performance*.xlsx GSC page exports
  ~/Desktop/chatfin/seo/redirects/all-backlinked.txt    Ahrefs backlink set

This writes to data/, NOT content/ — scripts/ingest.py wipes content/ on
every run, so anything that must persist lives here.

    python3 scripts/build_plan26.py
"""

import json
import glob
import os
import re
import collections

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(REPO, "data", "plan26.json")

HOME = os.path.expanduser("~")
SITEMAP = os.path.join(HOME, "Downloads", "chatfin-all-urls.json")
GSC_GLOB = os.path.join(HOME, "Desktop", "chatfin", "code", "cf-platform", "*Performance*.xlsx")
BACKLINKS = os.path.join(HOME, "Desktop", "chatfin", "seo", "redirects", "all-backlinked.txt")

GENERATED = "2026-08-19"
WINDOW = "3-17 Aug 2026 (2 weeks)"

# action -> (label, why)
ACTIONS = {
    "KEEP":   "Never touch. Earns clicks or holds backlinks.",
    "UPDATE": "Rewrite or improve. Has signal that is not converting.",
    "MERGE":  "Fold into the strongest sibling, then 301.",
    "DELETE": "Prune pool. Redirect only if a real destination exists.",
}

TIERS = [
    ("A", "Has external backlinks",                      "Never delete. Rewrite the ones with no traffic."),
    ("B", "Earns clicks, no backlinks",                  "Never delete. These pay the bills."),
    ("C", "Impressions, average position 20 or better",  "Do not delete. Fastest available wins."),
    ("D", "Impressions but position past 20",            "Merge into strongest sibling, then 301."),
    ("E", "No impressions at all",                       "The working pool. Most removals come from here."),
]


def load_gsc():
    import openpyxl
    gsc = {}
    for f in glob.glob(GSC_GLOB):
        wb = openpyxl.load_workbook(f, read_only=True)
        for r in list(wb["Pages"].iter_rows(values_only=True))[1:]:
            u = r[0].replace("https://chatfin.ai", "")
            c, i, p = gsc.get(u, (0, 0, []))
            gsc[u] = (c + (r[1] or 0), i + (r[2] or 0), p + [r[4]])
    return gsc


def titleise(slug):
    if not slug or slug == "home":
        return "Homepage"
    words = slug.replace("-", " ").split()
    small = {"a", "an", "the", "for", "to", "and", "of", "in", "with", "on", "vs"}
    out = []
    for i, w in enumerate(words):
        if w in ("ai", "erp", "ap", "ar", "cfo", "cfos", "kpi", "roi", "sap", "b1", "fpa", "dso", "gl"):
            out.append(w.upper())
        elif i and w in small:
            out.append(w)
        else:
            out.append(w[:1].upper() + w[1:])
    return " ".join(out)


def classify(path, gsc, backlinked):
    """Return (tier, action). Order matters: backlinks win over everything."""
    g = gsc.get(path)
    clicks = g[0] if g else 0
    impr = g[1] if g else 0
    position = (sum(g[2]) / len(g[2])) if g and g[2] else None

    if path in backlinked:
        # Link equity already paid for. If it earns nothing, that is the
        # highest-value rewrite on the site, not a deletion candidate.
        return "A", ("KEEP" if clicks > 0 else "UPDATE")
    if clicks > 0:
        return "B", "KEEP"
    if impr >= 10 and position is not None and position <= 20:
        return "C", "UPDATE"
    if g:
        return "D", "MERGE"
    return "E", "DELETE"


def blank_counts():
    return {"KEEP": 0, "UPDATE": 0, "MERGE": 0, "DELETE": 0}


def roll(counts, tiers, action, tier):
    counts[action] += 1
    tiers[tier] = tiers.get(tier, 0) + 1


def main():
    urls = json.load(open(SITEMAP))
    gsc = load_gsc()
    backlinked = {
        l.strip() for l in open(BACKLINKS) if l.strip() and not l.startswith("#")
    }

    # ---- classify every live URL -------------------------------------------
    pages = []
    for u in urls:
        path = u["path"]
        tier, action = classify(path, gsc, backlinked)
        g = gsc.get(path, (0, 0, []))
        position = round(sum(g[2]) / len(g[2]), 1) if g[2] else None

        # cluster / sub-cluster from the path, mirroring the content tree
        parts = [p for p in path.split("/") if p]
        if not parts:
            cluster, sub, slug = "home", None, "home"
        else:
            cluster = parts[0]
            if len(parts) == 1:
                cluster, sub, slug = "root", None, parts[0]
            elif len(parts) == 2:
                sub, slug = None, parts[1]
            else:
                sub, slug = parts[1], parts[-1]

        pages.append({
            "p": path,
            "t": titleise(slug),
            "s": action,
            "k": tier,
            "c": int(g[0]),
            "i": int(g[1]),
            "o": position,
            "b": 1 if path in backlinked else 0,
            "_cluster": cluster,
            "_sub": sub,
        })

    # ---- nest: cluster -> sub -> pages --------------------------------------
    byc = collections.defaultdict(list)
    for pg in pages:
        byc[pg["_cluster"]].append(pg)

    clusters = []
    for cname, cpages in byc.items():
        counts, tiers = blank_counts(), {}
        clicks = impr = backl = 0
        subs = collections.defaultdict(list)
        direct = []
        for pg in cpages:
            roll(counts, tiers, pg["s"], pg["k"])
            clicks += pg["c"]; impr += pg["i"]; backl += pg["b"]
            (subs[pg["_sub"]] if pg["_sub"] else direct).append(pg)

        sub_out = []
        for sname, spages in subs.items():
            scounts, stiers = blank_counts(), {}
            sclicks = simpr = sbackl = 0
            for pg in spages:
                roll(scounts, stiers, pg["s"], pg["k"])
                sclicks += pg["c"]; simpr += pg["i"]; sbackl += pg["b"]
            sub_out.append({
                "sub": sname,
                "title": titleise(sname),
                "urls": len(spages),
                "counts": scounts,
                "tiers": stiers,
                "clicks": sclicks,
                "impressions": simpr,
                "backlinked": sbackl,
                "pages": sorted(spages, key=lambda x: (-x["c"], -x["i"], x["p"])),
            })
        sub_out.sort(key=lambda s: -s["urls"])

        clusters.append({
            "cluster": cname,
            "title": titleise(cname),
            "urls": len(cpages),
            "counts": counts,
            "tiers": tiers,
            "clicks": clicks,
            "impressions": impr,
            "backlinked": backl,
            "subs": sub_out,
            "pages": sorted(direct, key=lambda x: (-x["c"], -x["i"], x["p"])),
        })
    clusters.sort(key=lambda c: -c["urls"])

    for c in clusters:
        for pg in c["pages"]:
            pg.pop("_cluster", None); pg.pop("_sub", None)
        for s in c["subs"]:
            for pg in s["pages"]:
                pg.pop("_cluster", None); pg.pop("_sub", None)

    # ---- totals -------------------------------------------------------------
    totals = blank_counts()
    tier_counts = collections.Counter()
    tier_clicks = collections.Counter()
    tier_impr = collections.Counter()
    for pg in pages:
        totals[pg["s"]] += 1
        tier_counts[pg["k"]] += 1
        tier_clicks[pg["k"]] += pg["c"]
        tier_impr[pg["k"]] += pg["i"]

    doc = {
        "generated": GENERATED,
        "window": WINDOW,
        "source": {
            "sitemap": "chatfin-all-urls.json",
            "gsc": "GSC page exports, 1,000-row cap each",
            "backlinks": "Ahrefs best-by-links, page 1",
        },
        "caveats": [
            "GSC exports cap at 1,000 rows each, so the zero-impression count is a floor.",
            "The backlink list is Ahrefs page 1. A full sweep will add to the protect list.",
            "The window is 2 weeks, which understates seasonal pages. Pull 16 months before "
            "acting on any single borderline URL.",
        ],
        "totals": {
            "urls": len(pages),
            "clicks": sum(p["c"] for p in pages),
            "impressions": sum(p["i"] for p in pages),
            "backlinked": sum(p["b"] for p in pages),
            **totals,
        },
        "actions": ACTIONS,
        "tiers": [
            {
                "tier": t,
                "definition": d,
                "verdict": v,
                "urls": tier_counts[t],
                "clicks": tier_clicks[t],
                "impressions": tier_impr[t],
            }
            for t, d, v in TIERS
        ],
        "clusters": clusters,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        json.dump(doc, fh, separators=(",", ":"))

    kb = os.path.getsize(OUT) / 1024
    print(f"wrote {OUT} ({kb:.0f} KB)")
    print(f"  {len(pages)} URLs across {len(clusters)} clusters")
    print("  " + "  ".join(f"{k}={v}" for k, v in totals.items()))


if __name__ == "__main__":
    main()
