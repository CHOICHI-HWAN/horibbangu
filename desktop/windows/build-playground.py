"""Embed the same cat-only room, with no records navigation or external assets."""
from pathlib import Path
import runpy
root=Path(__file__).resolve().parents[2]
runpy.run_path(str(root/'scripts/build-room.py'))
html=(root/'index.html').read_text()
html=html.replace('<a class="login-link" id="recordsLink" href="records.html">로그인 · 체중 기록 ↗</a>','')
assert 'firebase' not in html.lower() and 'state.records' not in html and '<script src=' not in html
(root/'desktop/windows/playground.html').write_text(html)
print('Generated standalone offline room.')
