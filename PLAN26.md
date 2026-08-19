# Plan26 — context for handing to a chat

Everything the /plan26 page is built on. The page itself shows only numbers;
this is the explanation behind them. Generated 2026-08-19.

## What it is

Every live chatfin.ai URL sorted into one of four actions, so the content work
has a defined order: what to protect, what to fix, what to fold together, what
to remove.

| Action | Count | Meaning |
|---|---:|---|
| KEEP | 1,200 | Leave alone. Either earning, or nothing argues against it. |
| UPDATE | 1,000 | Rewrite, improve or differentiate. Has a reason to change. |
| MERGE | 1,000 | Fold into the stronger near-duplicate, then 301. |
| DELETE | 1,339 | Remove. Positive evidence it earns nothing worth keeping. |

Total 4,539 URLs. KEEP, UPDATE and MERGE are fixed quotas; DELETE takes
the remainder, so the four always sum to the live URL count.

## How a page gets its bucket

Each URL gets one score, everything is ranked once, and the quotas fill in
order. The score is measured performance first: clicks, then impressions, then
position. A backlink adds a large bonus. Structural problems subtract, but
**only for pages with no clicks** — once a page earns, a padded slug or a
missing internal link stops counting against it. Without that gate the
penalties pushed earning pages into DELETE.

### Reasons behind each action

**KEEP**

| Reason | Pages |
|---|---:|
| Backlinked and earning clicks | 62 |
| Earns clicks | 268 |
| Position 20 or better, within reach of page one | 612 |
| Unique topic, not yet given a fair trial | 978 |

**UPDATE**

| Reason | Pages |
|---|---:|
| Backlinked but earning nothing — highest-value rewrite | 166 |
| Indexed and served, not converting | 132 |
| Canonical of a duplicate group — absorb the others | 190 |
| Crowded topic neighbourhood, needs differentiation | 960 |

**MERGE**

| Reason | Pages |
|---|---:|
| Near-duplicate of a stronger page, but has signal | 47 |
| Near-duplicate, but its group is unmeasured — review before cutting | 249 |

**DELETE**

| Reason | Pages |
|---|---:|
| Near-duplicate of a page that already earns — it cannot outrank it | 493 |
| Qualifier-padded variant of a shorter page, no signal of its own | 58 |
| Near-duplicate, no signal after a fair trial | 96 |
| No signal at all after a fair trial | 228 |

## The two rules that stop this deleting the site

**Nothing that earns is deleted.** All 887 clicks and all
228 backlinked pages sit in KEEP. This is enforced by
construction, not by scoring margin: DELETE is filled from the *bottom* of the
ranking, skipping any page with backlinks or clicks, so a protected page cannot
land there however badly it scores. Verified by removing the backlink bonus
entirely — backlinked pages then scatter across KEEP/UPDATE/MERGE but still
none reach DELETE.

**Absence of traffic is not evidence.** An earlier cut marked 3,255 URLs for
deletion for drawing no Search Console impressions. That was wrong twice over:

1. The GSC export stops at 1,000 rows and the weakest page in each export had
   1–2 impressions, so "zero" often means "below the cut".
2. 2,989 pages with no GSC row were published or modified
   inside the two-week window being measured. They had not had time to rank.

So removal needs positive evidence: a near-duplicate of a page that already
earns, or nothing after a genuine fair trial (90 days).

## Duplicate detection

Jaccard similarity over normalised slug tokens, union-found into groups.

- Tight (>= 0.6): 367 groups covering 1,456 URLs. True near-duplicates.
- Loose (>= 0.35, groups of 3+): 2,970 URLs in crowded topic neighbourhoods, which need differentiating rather than removing.
- Padded variants: 344 pages whose slug tokens are a strict superset of a shorter page's, e.g. `accrual-automation-software-for-month-end-close` off `accrual-automation-software`. Jaccard misses these because the padding drags similarity down.

A backlinked member always takes the canonical slot in its group.

Slug similarity is a proxy. The real test is body-text hashing, which is what
the SAP B1 audit used and what found 13 URLs sharing one article.

## Watchlist

1,526 pages carry no measured signal and at least one structural
strike, but were produced too recently to judge. They stay inside UPDATE and
MERGE so they keep getting worked on. Each has a review date 90 days
from its last modification; the first falls due 2026-10-04. Re-run the
generator after that: still nothing and they become the next DELETE batch,
started ranking and they stay.

## Sources

| Source | Contributes | State |
|---|---|---|
| Search Console | Clicks, impressions, position. Decides KEEP and the ranking. | In use |
| Ahrefs best-by-links + referring-domain tables | 228 URLs with external links. A backlinked page is never deleted. | In use |
| Ahrefs Site Audit crawl | 1,676 reachable pages; the other 2,863 are orphans with no internal links in, ranked below reachable pages of equal strength. | In use |
| Sitemap | The URL set and lastmod, which establishes fair trial. | In use |
| Google Analytics | Sessions, engagement, conversions per landing page. Would separate pages that get clicks but bounce from pages that convert. | **Not supplied** |

`REVIVED-LINKS.txt` is deliberately not a source. It records the August redirect
job rather than current link evidence. All 68 URLs in it are listed by Ahrefs
independently, so they stay protected on that basis.

## Known limits

- The Ahrefs export on disk is page 1. A full sweep will add to the protect list.
- No GA export exists, so nothing is decided on engagement or conversion. The one
  behavioural file has no landing-page column and cannot attribute a lead to a page.
- The redirect export holds 25 rows, not the ~1,800 live in the plugin. Redirect
  work is blocked until a full export exists.
- The GSC window is two weeks, which understates seasonal pages. Pull 16 months
  before acting on a borderline URL.

## Rebuilding

```
python3 scripts/build_plan26.py
```

Reads the sitemap, GSC exports, Ahrefs files. Writes `data/plan26.json`. It
writes to `data/` because `scripts/ingest.py` wipes `content/` on every run. It
asserts its invariants before writing, so a plan that would delete a backlinked
or earning page fails loudly instead of shipping.
