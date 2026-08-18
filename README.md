# Compass

A markdown-first SEO rank tracker for [ChatFin](https://chatfin.ai). Every tracked
page is a markdown file in a nested folder tree that mirrors the site hierarchy.
Each file carries a **time-series of Search Console snapshots** in its
frontmatter, so rankings, clicks, impressions and CTR are tracked **over time**
at three levels:

- **main** — the whole-site pillar (`content/_root.md`)
- **cluster** — each section, e.g. blog / guide / glossary (`content/<cluster>/_cluster.md`)
- **sub** — individual pages (`content/<cluster>/<slug>.md`)

Because the data lives in git-tracked markdown, history is diffable and the notes
on each page are hand-editable.

## Update tracker

Compass also records **which page changed on what date**. Every ingest folds the
new window into a persistent ledger (`data/history.json`), which survives the
content rebuild, and writes:

- **per page** — `first_seen`, `last_updated`, `update_count` and a full
  `updates:` list in that page's own frontmatter, rendered as a timeline on the
  page's detail view.
- **site-wide** — `content/_updates.md`, a dated digest (added / improved /
  declined counts plus that date's biggest movers), shown at `/updates`.

A date is the close of a Search Console window, so an entry means the page's
tracked metrics changed as of that date. Movement in position is the headline
signal; entries fall back to `changed` when only click or impression volume moved.

## How it works

```
data/source/*.xlsx      ──▶  scripts/ingest.py  ──▶  content/**/*.md   ──▶  Next.js app
(GSC + keyword exports)                              data/*.json
```

1. Drop Google Search Console exports (Pages / Queries / Chart / Filters) and the
   keyword-rank workbook into `data/source/`.
2. Run the ingest. It reads every `*Performance-on-Search*.xlsx`, uses each
   file's date filter as a **snapshot window**, and rebuilds the content tree —
   appending the new window as another snapshot on every page, cluster and the
   site pillar. Overlapping days are de-duplicated (later export wins).
3. The app reads the markdown tree at build/request time.

```bash
npm run ingest    # rebuild content/ from data/source/
```

## The app

| Route            | What it shows                                                     |
| ---------------- | ---------------------------------------------------------------- |
| `/`              | Site pillar: totals + WoW deltas, daily chart, cluster table, movers |
| `/clusters`      | All clusters with trend sparklines                               |
| `/c/[cluster]`   | One cluster: totals over time + searchable/sortable page table   |
| `/pages`         | Every tracked page, filter by cluster, sort any column           |
| `/p/[...slug]`   | One page: stat cards, snapshot table, trend sparklines, notes    |
| `/keywords`      | Target keyword rankings and the pages that surface for them      |
| `/content`       | Raw markdown tree browser (frontmatter + rendered body)          |
| `/api/content`   | JSON: directory listing or parsed markdown file                  |

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

## Adding next week's data

1. Export the new GSC week + keyword workbook into `data/source/`.
2. `npm run ingest`
3. Commit. The diff shows exactly which pages moved.

## Tech

Next.js (App Router) · TypeScript · Tailwind · gray-matter · react-markdown.
Charts are dependency-free inline SVG.
