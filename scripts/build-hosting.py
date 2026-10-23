"""Compile a whitelisted Hosting directory; source and runtime folders never ship."""
from pathlib import Path
import json,re,runpy,shutil,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from compiler import compile_file
root=Path(__file__).resolve().parents[1]
runpy.run_path(str(root/'scripts/build-room.py'))
site=root/'site'
if site.exists():shutil.rmtree(site)
site.mkdir()
report={}
for name in ['index.html','records.html']:
    source=root/name;target=site/name;compile_file(source,target)
    scripts=lambda s:sum(len(x.encode()) for x in re.findall(r'<script\b[^>]*>(.*?)</script>',s,re.S))
    report[name]={'javascriptBefore':scripts(source.read_text()),'javascriptAfter':scripts(target.read_text())}
shutil.copyfile(root/'config.js',site/'config.js')
(site/'room').mkdir(exist_ok=True);shutil.copyfile(root/'room/cats-extra.css',site/'room/cats-extra.css')
(site/'releases').mkdir(exist_ok=True)
for name in ['Horibbangu-Windows.zip','Horibbangu-Windows-Standalone.zip','Horibbangu-Park-Windows.zip','Horibbangu-Kim-Windows.zip','SHA256SUMS.txt']:
    assert (root/'releases'/name).is_file(),'Build the portable desktop EXE first'
    shutil.copyfile(root/'releases'/name,site/'releases'/name)
(root/'build').mkdir(exist_ok=True);(root/'build/compile-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('Compiled Hosting JavaScript:',json.dumps(report))
