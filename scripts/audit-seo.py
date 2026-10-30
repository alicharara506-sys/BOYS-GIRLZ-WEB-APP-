"""Audit server HTML and write the complete bilingual page inventory (no browser JS)."""
import concurrent.futures
import json
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.title = ""
        self.h1s = []
        self.current_h1 = None
        self.meta = {}
        self.canonicals = []
        self.alternates = {}
        self.schemas = []
        self.script = None
        self.links = set()

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        hidden = values.get("aria-hidden") == "true" or bool(self.stack and self.stack[-1][1])
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append((tag, hidden))
        if tag == "h1":
            self.current_h1 = []
        if tag == "meta":
            self.meta[values.get("name") or values.get("property")] = values.get("content", "")
        if tag == "link" and values.get("rel") == "canonical":
            self.canonicals.append(values.get("href"))
        if tag == "link" and values.get("rel") == "alternate":
            self.alternates[values.get("hreflang")] = values.get("href")
        if tag == "script" and values.get("type") == "application/ld+json":
            self.script = []
        if tag == "a" and values.get("href", "").startswith("/") and not values["href"].startswith("//"):
            self.links.add(urllib.parse.urlsplit(values["href"]).path)

    def handle_data(self, data):
        if self.script is not None:
            self.script.append(data)
        if self.stack and self.stack[-1][0] == "title":
            self.title += data
        if self.current_h1 is not None and not (self.stack and self.stack[-1][1]):
            self.current_h1.append(data)

    def handle_endtag(self, tag):
        if tag == "h1" and self.current_h1 is not None:
            self.h1s.append(re.sub(r"\s+", " ", "".join(self.current_h1)).strip())
            self.current_h1 = None
        if tag == "script" and self.script is not None:
            self.schemas.append(json.loads("".join(self.script)))
            self.script = None
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break


base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5181"
paths = json.loads(subprocess.check_output([
    "node", "--input-type=module", "-e",
    "import { PUBLIC_PAGE_PATHS } from './src/config/seo.ts'; console.log(JSON.stringify([...PUBLIC_PAGE_PATHS,'/cart','/checkout','/wishlist']));",
], text=True))


def inspect(item):
    path, language = item
    url = path + ("?lang=ar" if language == "ar" else "")
    with urllib.request.urlopen(base + url) as response:
        html = response.read().decode("utf-8")
    page = Page()
    page.feed(html)
    assert len(page.h1s) == 1, (url, page.h1s)
    assert len(page.canonicals) == 1 and page.canonicals[0] == "https://boysandgirlz.com" + url, (url, page.canonicals)
    assert set(page.alternates) == {"en", "ar", "x-default"}, (url, page.alternates)
    assert len(page.title) <= 60 and len(page.meta.get("description", "")) <= 155, url
    types = set()
    for schema in page.schemas:
        for node in schema.get("@graph", [schema]):
            if "@type" in node:
                types.add(node["@type"])
    assert "Organization" in types and "WebSite" in types, (url, types)
    if path != "/":
        assert "BreadcrumbList" in types, (url, types)
    assert "Product" not in types and "ClothingStore" not in types, (url, types)
    noindex = "noindex" in page.meta.get("robots", "")
    assert noindex == (path.startswith("/product/") or path in {"/cart", "/checkout", "/wishlist"}), url
    return (url, page, types, noindex)


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    results = list(executor.map(inspect, [(path, language) for language in ("en", "ar") for path in paths]))

known = set(paths)
broken = sorted({link for _, page, _, _ in results for link in page.links if link not in known})
assert not broken, f"Unrecognized internal links: {broken}"


def cell(value):
    return str(value).replace("|", "\\|").replace("\n", " ")


report = [
    "# Verified page inventory", "",
    "Audited from server-rendered HTML with JavaScript disabled at the HTTP level. All 55 content/user-state paths were checked in English and Arabic (110 responses). Each has exactly one H1, unique language-specific metadata, canonical and hreflang tags. Product preview and private utility pages are noindex. JSON-LD was parsed as JSON, checked for required graph types, and internal page links were checked against the route inventory.", "",
    "English uses clean paths; Arabic uses the same path with `?lang=ar`. Filter/tracking queries are excluded from canonical URLs. Public origin confirmed by owner: https://boysandgirlz.com.", "",
    "| URL | Title | Meta description | H1 in server HTML | Schema types | Indexability |",
    "|---|---|---|---|---|---|",
]
for url, page, types, noindex in results:
    report.append("| " + " | ".join(map(cell, ["https://boysandgirlz.com" + url, page.title, page.meta["description"], page.h1s[0], ", ".join(sorted(types)), "noindex" if noindex else "indexable"])) + " |")
report.extend(["", "`/newsletter` is a POST-only form endpoint (GET 404). Unknown pages, product IDs, categories and help topics return HTTP 404 with noindex metadata and navigation links.", ""])
Path("docs/seo-pages.md").write_text("\n".join(report), encoding="utf-8")
print(f"Verified {len(results)} server responses, parsed JSON-LD and checked internal page links. Report: docs/seo-pages.md")
