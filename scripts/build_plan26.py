#!/usr/bin/env python3
"""
Build data/plan26.json — the 2026 prune-and-build plan.

Every live URL gets one of four actions: KEEP, UPDATE, MERGE or DELETE.
Output is nested cluster -> sub-cluster -> page so the UI mirrors the site.

WHY DELETE IS DELIBERATELY SMALL
--------------------------------
An earlier cut of this plan marked 3,255 URLs for deletion on the grounds that
they drew no Search Console impressions. That was wrong, for two reasons that
are properties of the data rather than of the pages:

1. THE EXPORT CAP. GSC's UI export stops at 1,000 rows. The weakest page in
   each weekly export had 1-2 impressions, so the cap bites exactly at the
   bottom of the range. A page absent from the export may have had impressions
   and simply ranked below the cut. "Zero impressions" here means "not in the
   top 1,000", which is not evidence of anything.

2. THE MEASUREMENT WINDOW. 90% of the site carries a Jul/Aug 2026 lastmod, and
   2,989 of the 3,344 pages with no GSC row were published or modified inside
   the two-week window being measured. A page published a fortnight ago has no
   impressions because Google has not ranked it yet.

So absence of traffic is not treated as evidence. DELETE now requires positive
evidence of worthlessness: near-duplicate of a better page, or no signal after
a genuine fair trial. Pages that were never given a chance are kept or worked
on, and re-measured once they have real history.

HOW THE ACTIONS ARE DECIDED
---------------------------
Checked in order, first match wins:

  KEEP    backlinked and earning  |  earns clicks  |  position 20 or better
          |  unique topic with no evidence against it
  UPDATE  backlinked but earning nothing  |  indexed but not converting
          |  canonical of a duplicate group  |  crowded topic needing
             differentiation
  MERGE   near-duplicate of a stronger page, but has signal or is too new
  DELETE  near-duplicate with no signal after a fair trial  |  no signal at
          all after a fair trial

Duplicate detection is Jaccard similarity over normalised slug tokens, union
-found into groups. Tight (>=0.6) marks true duplicates; loose (>=0.35, groups
of 3+) marks crowded topic neighbourhoods. Slug similarity is a proxy — the
real test is body-text hashing, which is what the SAP B1 audit used.

Sources (read-only, outside the repo):
  ~/Downloads/chatfin-all-urls.json                     live sitemap
  ~/Desktop/chatfin/code/cf-platform/*Performance*.xlsx GSC page exports
  ~/Desktop/chatfin/seo/redirects/all-backlinked.txt    Ahrefs backlink set

Writes to data/, NOT content/ — scripts/ingest.py wipes content/ on every run.

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

# A page modified after this has not had time to rank, so it cannot be judged.
FAIR_TRIAL_BEFORE = "2026-06"

TIGHT = 0.6    # near-duplicate
LOOSE = 0.35   # crowded neighbourhood
CROWD_MIN = 3

ACTIONS = {
    "KEEP":   "Leave alone. Either earning, or nothing argues against it.",
    "UPDATE": "Rewrite, improve or differentiate. Has a reason to change.",
    "MERGE":  "Fold into the stronger near-duplicate, then 301.",
    "DELETE": "Remove. Positive evidence it earns nothing worth keeping.",
}

REASONS = {
    "backlinked-earning": "Backlinked and earning clicks",
    "earns-clicks":       "Earns clicks",
    "striking-distance":  "Position 20 or better, within reach of page one",
    "unique-untested":    "Unique topic, not yet given a fair trial",
    "backlinked-idle":    "Backlinked but earning nothing — highest-value rewrite",
    "indexed-weak":       "Indexed and served, not converting",
    "canonical":          "Canonical of a duplicate group — absorb the others",
    "crowded":            "Crowded topic neighbourhood, needs differentiation",
    "dup-signal":         "Near-duplicate of a stronger page, but has signal",
    "dup-untested":       "Near-duplicate, too new to judge — review before cutting",
    "dup-dead":           "Near-duplicate, no signal after a fair trial",
    "dark-after-trial":   "No signal at all after a fair trial",
}

TIERS = [
    ("A", "Has external backlinks",                     "Never delete. Rewrite the ones with no traffic."),
    ("B", "Earns clicks, no backlinks",                 "Never delete. These pay the bills."),
    ("C", "Impressions, average position 20 or better", "Do not delete. Fastest available wins."),
    ("D", "Impressions but position past 20",           "Improve or fold into a stronger sibling."),
    ("E", "No row in the GSC export",                   "Mostly unmeasured, not proven dead. See the note."),
]

STOP = {"the", "a", "an", "for", "to", "and", "of", "in", "with", "your", "how", "what",
        "is", "best", "top", "guide", "complete", "2026", "2025", "edition", "ultimate",
        "ai", "vs", "on", "from"}


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
    small = {"a", "an", "the", "for", "to", "and", "of", "in", "with", "on", "vs"}
    caps = {"ai", "erp", "ap", "ar", "cfo", "cfos", "kpi", "roi", "sap", "b1", "fpa", "dso", "gl"}
    out = []
    for i, w in enumerate(slug.replace("-", " ").split()):
        if w in caps:
            out.append(w.upper())
        elif i and w in small:
            out.append(w)
        else:
            out.append(w[:1].upper() + w[1:])
    return " ".join(out)


def tokens(slug):
    return frozenset(w for w in re.split(r"[-/]", slug)
                     if w and w not in STOP and not w.isdigit())


def group_at(paths, toks, inv, threshold):
    """Union-find over pairs sharing a token, joined when Jaccard >= threshold."""
    par = list(range(len(paths)))

    def find(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x

    seen = set()
    for w, idxs in inv.items():
        if len(idxs) > 400:      # ubiquitous token, tells us nothing
            continue
        for a in range(len(idxs)):
            for b in range(a + 1, len(idxs)):
                i, j = idxs[a], idxs[b]
                if (i, j) in seen:
                    continue
                seen.add((i, j))
                ti, tj = toks[i], toks[j]
                if ti and tj and len(ti & tj) / len(ti | tj) >= threshold:
                    ri, rj = find(i), find(j)
                    if ri != rj:
                        par[rj] = ri
    g = collections.defaultdict(list)
    for i in range(len(paths)):
        g[find(i)].append(i)
    return g


def main():
    urls = json.load(open(SITEMAP))
    meta = {u["path"]: u for u in urls}
    gsc = load_gsc()
    backlinked = {l.strip() for l in open(BACKLINKS)
                  if l.strip() and not l.startswith("#")}

    paths = [u["path"] for u in urls]
    toks = [tokens(u["slug"]) for u in urls]
    inv = collections.defaultdict(list)
    for i, t in enumerate(toks):
        for w in t:
            inv[w].append(i)

    def clicks(p):
        return gsc[p][0] if p in gsc else 0

    def impressions(p):
        return gsc[p][1] if p in gsc else 0

    # ---- duplicate groups, and the canonical of each --------------------------
    tight = {k: v for k, v in group_at(paths, toks, inv, TIGHT).items() if len(v) > 1}
    canonical, non_canonical = set(), set()
    dup_groups = []
    for members in tight.values():
        members.sort(key=lambda i: (-clicks(paths[i]), -impressions(paths[i]),
                                    0 if paths[i] in backlinked else 1, len(paths[i])))
        # a backlinked member always takes the canonical slot
        linked = [i for i in members if paths[i] in backlinked]
        head = linked[0] if linked else members[0]
        canonical.add(paths[head])
        non_canonical.update(paths[i] for i in members if i != head)
        dup_groups.append(len(members))

    loose = group_at(paths, toks, inv, LOOSE)
    crowded = {paths[i] for v in loose.values() if len(v) >= CROWD_MIN for i in v}

    def had_fair_trial(p):
        return (meta[p].get("lastmod") or "")[:7] <= FAIR_TRIAL_BEFORE

    # ---- classify -------------------------------------------------------------
    def decide(p):
        g = gsc.get(p)
        c = g[0] if g else 0
        i = g[1] if g else 0
        position = (sum(g[2]) / len(g[2])) if g and g[2] else None
        old = had_fair_trial(p)

        if p in backlinked:
            return ("KEEP", "backlinked-earning") if c > 0 else ("UPDATE", "backlinked-idle")
        if c > 0:
            return "KEEP", "earns-clicks"
        if i >= 10 and position is not None and position <= 20:
            return "KEEP", "striking-distance"
        if p in non_canonical:
            if i > 0:
                return "MERGE", "dup-signal"
            if not old:
                return "MERGE", "dup-untested"
            return "DELETE", "dup-dead"
        if i > 0:
            return "UPDATE", "indexed-weak"
        if p in canonical:
            return "UPDATE", "canonical"
        if old:
            return "DELETE", "dark-after-trial"
        if p in crowded:
            return "UPDATE", "crowded"
        return "KEEP", "unique-untested"

    def tier_of(p):
        g = gsc.get(p)
        if p in backlinked:
            return "A"
        if g and g[0] > 0:
            return "B"
        if g and g[1] >= 10 and sum(g[2]) / len(g[2]) <= 20:
            return "C"
        if g:
            return "D"
        return "E"

    pages = []
    for u in urls:
        p = u["path"]
        action, reason = decide(p)
        g = gsc.get(p, (0, 0, []))
        parts = [x for x in p.split("/") if x]
        if not parts:
            cluster, sub, slug = "home", None, "home"
        elif len(parts) == 1:
            cluster, sub, slug = "root", None, parts[0]
        elif len(parts) == 2:
            cluster, sub, slug = parts[0], None, parts[1]
        else:
            cluster, sub, slug = parts[0], parts[1], parts[-1]

        pages.append({
            "p": p,
            "t": titleise(slug),
            "s": action,
            "r": reason,
            "k": tier_of(p),
            "c": int(g[0]),
            "i": int(g[1]),
            "o": round(sum(g[2]) / len(g[2]), 1) if g[2] else None,
            "b": 1 if p in backlinked else 0,
            "d": 1 if (p in canonical or p in non_canonical) else 0,
            "_cluster": cluster,
            "_sub": sub,
        })

    # ---- nest -----------------------------------------------------------------
    def blank():
        return {"KEEP": 0, "UPDATE": 0, "MERGE": 0, "DELETE": 0}

    byc = collections.defaultdict(list)
    for pg in pages:
        byc[pg["_cluster"]].append(pg)

    clusters = []
    for cname, cpages in byc.items():
        counts, tiers = blank(), {}
        cl = im = bkl = 0
        subs = collections.defaultdict(list)
        direct = []
        for pg in cpages:
            counts[pg["s"]] += 1
            tiers[pg["k"]] = tiers.get(pg["k"], 0) + 1
            cl += pg["c"]; im += pg["i"]; bkl += pg["b"]
            (subs[pg["_sub"]] if pg["_sub"] else direct).append(pg)

        sub_out = []
        for sname, spages in subs.items():
            sc, st = blank(), {}
            scl = sim = sbk = 0
            for pg in spages:
                sc[pg["s"]] += 1
                st[pg["k"]] = st.get(pg["k"], 0) + 1
                scl += pg["c"]; sim += pg["i"]; sbk += pg["b"]
            sub_out.append({
                "sub": sname, "title": titleise(sname), "urls": len(spages),
                "counts": sc, "tiers": st, "clicks": scl, "impressions": sim,
                "backlinked": sbk,
                "pages": sorted(spages, key=lambda x: (-x["c"], -x["i"], x["p"])),
            })
        sub_out.sort(key=lambda s: -s["urls"])

        clusters.append({
            "cluster": cname, "title": titleise(cname), "urls": len(cpages),
            "counts": counts, "tiers": tiers, "clicks": cl, "impressions": im,
            "backlinked": bkl, "subs": sub_out,
            "pages": sorted(direct, key=lambda x: (-x["c"], -x["i"], x["p"])),
        })
    clusters.sort(key=lambda c: -c["urls"])

    for c in clusters:
        for pg in c["pages"]:
            pg.pop("_cluster", None); pg.pop("_sub", None)
        for s in c["subs"]:
            for pg in s["pages"]:
                pg.pop("_cluster", None); pg.pop("_sub", None)

    # ---- totals ---------------------------------------------------------------
    totals = blank()
    reason_counts = collections.Counter()
    tier_counts, tier_clicks, tier_impr = (collections.Counter() for _ in range(3))
    for pg in pages:
        totals[pg["s"]] += 1
        reason_counts[pg["r"]] += 1
        tier_counts[pg["k"]] += 1
        tier_clicks[pg["k"]] += pg["c"]
        tier_impr[pg["k"]] += pg["i"]

    untested = sum(1 for pg in pages
                   if not had_fair_trial(pg["p"]) and pg["p"] not in gsc)

    doc = {
        "generated": GENERATED,
        "window": WINDOW,
        "method": {
            "fairTrialBefore": FAIR_TRIAL_BEFORE,
            "tight": TIGHT,
            "loose": LOOSE,
            "crowdMin": CROWD_MIN,
            "duplicateGroups": len(dup_groups),
            "duplicateUrls": sum(dup_groups),
            "duplicateSurplus": sum(dup_groups) - len(dup_groups),
            "crowdedUrls": len(crowded),
            "untestedUrls": untested,
        },
        "source": {
            "sitemap": "chatfin-all-urls.json",
            "gsc": "GSC page exports, 1,000-row cap each",
            "backlinks": "Ahrefs best-by-links, page 1",
        },
        "whyDeleteIsSmall": [
            "GSC's export stops at 1,000 rows and the weakest page in each export had "
            "1-2 impressions, so the cap bites at the bottom of the range. A page missing "
            "from the export may simply have ranked below the cut.",
            f"90% of the site carries a Jul/Aug 2026 lastmod, and {untested:,} pages with no "
            "GSC row were published or modified inside the two-week window being measured. "
            "They have not had time to rank.",
            "So absence of traffic is not treated as evidence. DELETE requires positive "
            "evidence: a near-duplicate of a better page, or no signal after a fair trial.",
        ],
        "caveats": [
            "The backlink list is Ahrefs page 1. A full sweep will add to the protect list.",
            "Duplicate detection is slug similarity, a proxy. The real test is body-text "
            "hashing, which is what the SAP B1 audit used and what found 13 URLs sharing "
            "one article.",
            "Re-measure once the untested pages have 90 days of history, then re-run this.",
        ],
        "totals": {
            "urls": len(pages),
            "clicks": sum(p["c"] for p in pages),
            "impressions": sum(p["i"] for p in pages),
            "backlinked": sum(p["b"] for p in pages),
            **totals,
        },
        "actions": ACTIONS,
        "reasons": REASONS,
        "reasonCounts": dict(reason_counts),
        "tiers": [
            {"tier": t, "definition": d, "verdict": v, "urls": tier_counts[t],
             "clicks": tier_clicks[t], "impressions": tier_impr[t]}
            for t, d, v in TIERS
        ],
        "clusters": clusters,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        json.dump(doc, fh, separators=(",", ":"))

    print(f"wrote {OUT} ({os.path.getsize(OUT)/1024:.0f} KB)")
    print(f"  {len(pages)} URLs across {len(clusters)} clusters")
    print("  " + "  ".join(f"{k}={v}" for k, v in totals.items()))
    print(f"  duplicate groups {len(dup_groups)} covering {sum(dup_groups)} URLs")
    print(f"  untested (no fair trial yet) {untested}")


if __name__ == "__main__":
    main()
