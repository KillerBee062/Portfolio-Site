import re
import json

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'<script type="__bundler/template">(.*?)</script>', html, re.DOTALL)
if match:
    template_str = match.group(1).strip()
    template = json.loads(template_str)
    
    exp_idx = template.find('id="experience"')
    end_section_idx = template.find('</section>', exp_idx)
    
    education_html = """
    <div class="section-head" style="margin-top: 6rem;">
      <span class="section-tag">Education</span>
      <h2>Academic Foundation</h2>
    </div>

    <div class="timeline">
      <div class="tl-item">
        <span class="tl-dot"></span>
        <span class="tl-date">Mar 2026 &ndash; Dec 2027</span>
        <h3 class="tl-role">M.S. in Artificial Intelligence and Data Engineering</h3>
        <div class="tl-company">University of Dhaka</div>
      </div>
      <div class="tl-item">
        <span class="tl-dot"></span>
        <span class="tl-date">Jan 2015 &ndash; Mar 2020</span>
        <h3 class="tl-role">Bachelor of Engineering, IPE</h3>
        <div class="tl-company">Shahjalal University of Science and Technology</div>
      </div>
    </div>
"""

    new_template = template[:end_section_idx] + education_html + template[end_section_idx:]
    
    # Dump the json and fix the </script> tag issue which causes the browser parser to break early
    new_template_str = json.dumps(new_template)
    new_template_str = new_template_str.replace("</script>", "<\\/script>")
    
    new_html = html[:match.start(1)] + "\n" + new_template_str + "\n" + html[match.end(1):]
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("Fixed and injected successfully.")
else:
    print("Template not found.")
