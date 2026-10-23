"""Embed the same cat-only room, with no records navigation or external assets."""
from pathlib import Path
import runpy
import re
root=Path(__file__).resolve().parents[2]
runpy.run_path(str(root/'scripts/build-room.py'))
html=(root/'index.html').read_text()
html=html.replace('<a class="login-link" id="recordsLink" href="records.html">로그인 · 체중 기록 ↗</a>','')
html=re.sub(r'<a id="windowsDownload"[^>]*>.*?</a>','',html)
# Remove the lake, sky, floor and room lighting from the Windows overlay only.
html=re.sub(r'<div class="window-frame balcony-opening">.*?<div class="balcony-step"[^>]*></div>','',html,flags=re.S)
html=html.replace('<div class="floor"></div><div class="sunbeam"></div>','')
html=re.sub(r'<title>.*?</title>','<title>호리빵구 · 바탕화면 친구들</title>',html)
html=html.replace('<body class="room-page">','<body class="room-page desktop-overlay">')
html=html.replace('</style>', '\n'+(root/'desktop/windows/overlay.css').read_text()+'\n</style>',1)
html=html.replace('const roomMode = true;', 'const roomMode = true; const desktopOverlay = true;')
html=html.replace('initRoom();','initRoom();\n'+(root/'desktop/windows/overlay.js').read_text())
assert 'firebase' not in html.lower() and 'state.records' not in html and '<script src=' not in html
(root/'desktop/windows/playground.html').write_text(html)
assert 'id="landscape"' not in html and 'data:image/webp' not in html
print('Generated transparent, object-only desktop playground.')
