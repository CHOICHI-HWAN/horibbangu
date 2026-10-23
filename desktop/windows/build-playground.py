"""Embed the same cat-only room, with no records navigation or external assets."""
from pathlib import Path
import runpy
import re
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'))
from compiler import compile_file
root=Path(__file__).resolve().parents[2]
runpy.run_path(str(root/'scripts/build-room.py'))
html=(root/'index.html').read_text()
html=html.replace('<a class="login-link" id="recordsLink" href="records.html">로그인 · 체중 기록 ↗</a>','')
html=re.sub(r'<a id="windows(?:Download|Standalone)"[^>]*>.*?</a>','',html)
# Keep the painted room embedded; the desktop toggle controls its visibility.
html=re.sub(r'<title>.*?</title>','<title>호리빵구 · 바탕화면 친구들</title>',html)
html=html.replace('<body class="room-page">','<body class="room-page desktop-overlay">')
html=html.replace('</style>', '\n'+(root/'desktop/windows/overlay.css').read_text()+'\n</style>',1)
html=html.replace('const roomMode = true;', 'const roomMode = true; const desktopOverlay = true; let desktopBackground = false;')
html=html.replace('initRoom();','initRoom();\n'+(root/'desktop/windows/overlay.js').read_text())
assert 'firebase' not in html.lower() and 'state.records' not in html and '<script src=' not in html
# Compile the renderer into a local script so Chromium can reuse its code cache.
match=re.search(r'<script>(.*?)</script>',html,re.S);assert match
script=root/'build/desktop-source.js';script.parent.mkdir(exist_ok=True);script.write_text(match.group(1))
compile_file(script,root/'desktop/windows/playground.js','browser')
html=html[:match.start()]+'<script src="playground.js"></script>'+html[match.end():]
html=html.replace("script-src 'unsafe-inline'", "script-src 'self'")
(root/'desktop/windows/playground.html').write_text(html,newline='\n')
assert 'id="landscape"' in html and 'data:image/webp' in html
print('Generated desktop playground with switchable painted background.')
