import json
import re
import traceback

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

try:
    match = re.search(r'<script type="__bundler/template">(.*?)</script>', html, re.DOTALL)
    if not match:
        print("Template script not found!")
    else:
        template_str = match.group(1)
        # Try parsing it
        data = json.loads(template_str)
        print("JSON is valid. Length of data:", len(data))
except Exception as e:
    print("Error parsing JSON:")
    traceback.print_exc()
