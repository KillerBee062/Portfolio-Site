import json
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'<script type="__bundler/template">(.*?)</script>', html, re.DOTALL)
if match:
    template = json.loads(match.group(1).strip())
    with open('unpacked_stitch.html', 'w', encoding='utf-8') as f:
        f.write(template)
    print("Extracted successfully to unpacked_stitch.html")
