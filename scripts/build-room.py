"""Build the public, authentication-free room from the shared cat engine."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
s=(root/'records.html').read_text()
a=s.index('  #cats {');b=s.index('  .empty {',a)
c=s.index('// ---------- 돌아다니는 고양이 ----------');d=s.index('function renderAll()',c)
pets=[dict(id='p'+str(i+1),name=n,color=color)for i,(n,color)in enumerate(zip(['호야','보리','건빵','살구','로이','삼식','삼순'],['#E4572E','#2E86AB','#F5A623','#E8739B','#6A994E','#7D5BA6','#2A9D8F']))]
html=(root/'room/shell.html').read_text()
for token,text in {'/*ROOM_CSS*/':(root/'room/room.css').read_text(),'/*CAT_CSS*/':s[a:b],'/*EXTRA_CSS*/':(root/'room/cats-extra.css').read_text(),'/*PETS*/':json.dumps(pets,ensure_ascii=False),'/*ROOM_JS*/':(root/'room/room.js').read_text(),'/*CAT_JS*/':s[c:d]}.items():html=html.replace(token,text)
assert 'state.records' not in html and 'firebase' not in html.lower()
(root/'index.html').write_text(html)
print('Built public cat room (no authentication, weight data, or external requests).')
