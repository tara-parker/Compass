#!/usr/bin/env python3
"""Fold the blogs/plan27 outputs into data/plan27.json for the /plan26 tab."""
import json, os, csv, collections

SRC = os.path.expanduser("~/Desktop/chatfin/blogs/plan27")
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "plan27.json")
R = lambda f: os.path.join(SRC, f)
def tsv(f):
    with open(R(f)) as fh: return list(csv.DictReader(fh, delimiter="\t"))

pages   = {x["p"]: x for x in json.load(open(R("plan27-pages.json")))}
actions = json.load(open(R("actions-final.json")))
tree    = json.load(open(R("tree-final.json")))
create  = json.load(open(R("create-final.json")))
merges  = tsv("merge-map.tsv")
links   = tsv("link-map.tsv")
removals= tsv("suggested-removals.tsv")

WAVE = {1:"tree nodes, backlinked pages and earners. do first",
        2:"sits on a term that earns clicks, or has real readers",
        3:"weak signal. title and meta only, no body work",
        4:"phantom impressions. confirm the query is real before spending",
        5:"no signal. rewrite onto an intersection or fold under a cluster"}

P=[]
for p, a in actions.items():
    d = pages[p]
    P.append({"p":p, "a":a["action"], "w":a["wave"] or 0, "r":a["role"] or "",
              "pa":a["parent"] or "", "x":a["what"],
              "c":round(d["clicks"]), "i":round(d["impr"]), "o":d["pos"],
              "v":round(d["views"]), "e":round(d["engage"] or 0),
              "b":1 if d["bl"] else 0, "ni":1 if d["ni"] else 0,
              "erp":d["erp"] or "", "cat":d["cat"] or ""})
P.sort(key=lambda x:(x["w"] or 9, -x["c"], -x["i"]))

cnt = collections.Counter(x["a"] for x in P)
waves = [{"w":w, "n":sum(1 for x in P if x["a"]=="UPDATE" and x["w"]==w), "label":WAVE[w]} for w in (1,2,3,4,5)]

erp=[]
for e,n in tree["erp"].items():
    cl=[]
    for c in n["clusters"]:
        cl.append({"url":c["url"], "label":c["label"], "existing":c["existing"],
                   "competing":c["competing"], "sections":c["sections"],
                   "subs":[{"use":s["use"], "url":s["url"], "existing":s["existing"]} for s in c["subs"]]})
    erp.append({"erp":e, "tier":n["tier"], "pillar":n["pillar"],
                "pillarExisting":n["pillar_existing"], "pillarCompeting":n["pillar_competing"],
                "clusters":cl,
                "created":sum(1 for c in cl if not c["existing"])+sum(1 for c in cl for s in c["subs"] if not s["existing"])+(0 if n["pillar_existing"] else 1),
                "promoted":sum(1 for c in cl if c["existing"])+sum(1 for c in cl for s in c["subs"] if s["existing"])+(1 if n["pillar_existing"] else 0)})
TIER_ORDER={"A":0,"B":1,"C":2}
erp.sort(key=lambda x:(TIER_ORDER[x["tier"]], x["erp"]))

DEMAND=[["cfo / finance-leader tooling",67,30],["claude x google sheets",38,29],
 ["competitor alternatives",37,20],["private equity / investment",21,10],
 ["finance ai chat / agents",19,10],["will ai replace X",16,4],
 ["accounts payable",14,12],["fp&a / forecasting",7,7],
 ["internal audit / controls",3,1],["close / reconciliation",2,2]]

FINDINGS=[
 ["Impressions are not demand",
  "The site converts 0.9% of expected clicks at position 3-5. 66 queries sit top-10 with zero clicks, 20% of all impressions. That is AI Overview surface, not traffic you can win."],
 ["83% of clicks are branded",
  "1,548 of 1,862 clicks come from 12 queries containing chatfin. Non-branded demand is 194 queries and 310 clicks in total."],
 ["1,147 pages get traffic Search Console cannot see",
  "They have a GA row and no GSC row at all. The old plan read that as silence."],
 ["The 2,863 orphan figure is retired",
  "Ahrefs reached 37% of the site at every quality tier, and SILENT pages were the most reachable. That is a truncated crawl, not a link graph."],
 ["The ERP side earns 15 clicks, all on comparisons",
  "rillet vs netsuite, netsuite vs rillet, rillet vs intuit. That is why every ERP gets an alternatives cluster."],
]
BLOCKED=[
 ["Full not-indexed export","985 of ~1,540 rows on hand, so 931 live URLs. Roughly 555 refused pages are invisible."],
 ["Full Ahrefs backlink export","Page one only, 242 paths. Nothing may be removed if it carries an external link, so this is the weakest point in the plan."],
 ["GA conversion events","4 key events fire, all on the homepage. No content page can be judged on whether it converts."],
 ["Full redirect export","25 rows on hand, ~1,800 live. The merges cannot ship without it."],
]

data={"generated":"2026-08-20",
 "window":"GSC US 16 months, GA US 18 months, master keyword list",
 "totals":{"urls":len(P),"keep":cnt["KEEP"],"update":cnt["UPDATE"],"merge":cnt["MERGE"],
           "delete":0,"create":len(create),"links":len(links),"removals":len(removals),
           "treeUrls":sum(1+len(n["clusters"])+sum(len(c["subs"]) for c in n["clusters"]) for n in tree["erp"].values())
                      +sum(1+len(n["subs"]) for n in tree["non"]),
           "promoted":sum(x["promoted"] for x in erp)},
 "findings":FINDINGS,"blocked":BLOCKED,"demand":DEMAND,"waves":waves,
 "erpTree":erp,
 "nonTree":[{"url":n["url"],"label":n["label"],"existing":n["existing"],
             "subs":[{"label":s["label"],"url":s["url"],"existing":s["existing"]} for s in n["subs"]]}
            for n in tree["non"]],
 "create":[{"prio":c["prio"],"tree":c["tree"],"level":c["level"],"erp":c["erp"],
            "what":c["cat"],"url":c["url"],"why":c["why"]} for c in create],
 # 30 merge-map rows name pages that were later promoted into tree nodes; those
 # are no longer merges. Only ship rows whose source is actually actioned MERGE.
 "merges":[{"s":m["source"],"t":m["target"],"why":m["why"]} for m in merges
           if actions.get(m["source"],{}).get("action")=="MERGE"],
 "removals":[{"url":r["url"],"core":r["core_term"],"competing":int(r["competing_pages"]),
              "earners":int(r["competing_earners"]),"sibling":r["strongest_sibling"]} for r in removals],
 "pages":P}
json.dump(data, open(OUT,"w"), separators=(",",":"))
print(f"wrote {OUT}  {os.path.getsize(OUT)/1e6:.2f} MB")
print(f"  pages {len(P)}  create {len(create)}  merges {len(merges)}  removals {len(removals)}")
print(f"  tree urls {data['totals']['treeUrls']}  promoted {data['totals']['promoted']}")
