#!/usr/bin/env python3
"""Thin WP REST helper for the Acumatica cluster updates.

Auth comes from the macOS Keychain exactly as push_dropped21.py does, so no
credential ever appears in a command or in this file.
"""
import base64, json, os, subprocess, sys, urllib.request, urllib.error, urllib.parse

WP_SITE, WP_USER = "https://chatfin.ai", "ChatFin_Admin"
KEYCHAIN_SERVICE = "chatfin-wp-app-password"
API = WP_SITE + "/wp-json/wp/v2"

def _pw():
    p = os.environ.get("WP_APP_PASS", "").strip()
    if p:
        return p
    r = subprocess.run(["security", "find-generic-password", "-s", KEYCHAIN_SERVICE,
                        "-a", WP_USER, "-w"], capture_output=True, text=True, timeout=10)
    return r.stdout.strip() if r.returncode == 0 else ""

AUTH = "Basic " + base64.b64encode(f"{WP_USER}:{_pw()}".encode()).decode()

def call(method, path, params=None, body=None):
    url = API + path + ("?" + urllib.parse.urlencode(params) if params else "")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", AUTH)
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0 (Macintosh) ChatFin-SEO/1.0")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode("utf-8", "replace")
            if r.status == 202 or "sgcaptcha" in raw[:400]:
                raise RuntimeError("HTTP 202 SiteGround sgcaptcha, slow down")
            return json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} {method} {path}: {e.read().decode('utf-8','replace')[:250]}")

def find_by_slug(slug):
    for t in ("pages", "posts"):
        r = call("GET", f"/{t}", {"slug": slug, "status": "publish",
                                  "_fields": "id,slug,title,excerpt,link,type"})
        if r:
            return t, r[0]
    return None, None

if __name__ == "__main__":
    me = call("GET", "/users/me", {"_fields": "id,name,slug"})
    print("authenticated as:", me)
    t, p = find_by_slug(sys.argv[1] if len(sys.argv) > 1 else "chatfin-vs-claude-for-acumatica")
    print("type:", t, " id:", p["id"])
    print("title:", p["title"]["rendered"])
    print("excerpt:", (p["excerpt"]["rendered"] or "")[:180])
    print("link:", p["link"])
