"""Build the public, authentication-free room from the shared cat engine."""
from pathlib import Path
import json
import re
import math
import base64
root=Path(__file__).resolve().parents[1]
s=(root/'records.html').read_text()
a=s.index('  #cats {');b=s.index('  .empty {',a)
c=s.index('// ---------- 돌아다니는 고양이 ----------');d=s.index('function renderAll()',c)
pets=[dict(id='p'+str(i+1),name=n,color=color)for i,(n,color)in enumerate(zip(['호야','보리','건빵','살구','로이','삼식','삼순'],['#E4572E','#2E86AB','#F5A623','#E8739B','#6A994E','#7D5BA6','#2A9D8F']))]
# Use the latest built-in measurement as a public default. Only visual ratios are emitted.
names=re.findall(r"'([^']+)'",re.search(r"const SEED_PETS = \[(.*?)\]",s).group(1))
seed=re.search(r"const SEED = `(.*?)`;",s,re.S).group(1)
latest={}
for row in sorted(seed.splitlines(),key=lambda line:line.split('|')[0]):
    if '|' not in row: continue
    for name,value in zip(names,row.split('|')[1].split(',')):
        try:
            weight=float(value.rstrip('?'))
            if math.isfinite(weight) and weight>0: latest[name]=weight
        except ValueError: pass
looks=s[s.index('const LOOKS ='):s.index('const FUR =')]
bases={name:float(value) for name,value in re.findall(r"'([^']+)': \{.*?scale: ([0-9.]+) \}",looks,re.S)}
sizes={name:round(max(.82,min(1.42,bases.get(name,1)*(weight/5)**(1/3))),4) for name,weight in latest.items() if name not in ['로이','동글이']}
html=(root/'room/shell.html').read_text()
for token,text in {'/*ROOM_CSS*/':(root/'room/room.css').read_text(),'/*CAT_CSS*/':s[a:b],'/*EXTRA_CSS*/':(root/'room/cats-extra.css').read_text(),'/*PETS*/':json.dumps(pets,ensure_ascii=False),'/*ROOM_JS*/':(root/'room/room.js').read_text(),'/*CAT_JS*/':s[c:d],'/*ROOM_SIZES*/':json.dumps(sizes,ensure_ascii=False),'/*HALLSTATT_IMAGE*/':'data:image/webp;base64,'+base64.b64encode((root/'room/assets/hallstatt-painted.webp').read_bytes()).decode('ascii')}.items():html=html.replace(token,text)
assert 'state.records' not in html and 'firebase' not in html.lower()
(root/'index.html').write_text(html,newline='\n')
print('Built public cat room (no authentication, weight data, or external requests).')
