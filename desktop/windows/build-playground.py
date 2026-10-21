"""Package only the cat playground; no records, Firebase, or network scripts."""
from pathlib import Path
import json

root = Path(__file__).resolve().parents[2]
source = (root / 'index.html').read_text()
css_start = source.index('  #cats {')
css_end = source.index('  .empty {', css_start)
cat_css = source[css_start:css_end]
js_start = source.index('// ---------- 돌아다니는 고양이 ----------')
js_end = source.index('function renderAll()', js_start)
cat_js = source[js_start:js_end]
pets = [dict(id='p'+str(i+1), name=name, color=color) for i, (name, color) in enumerate(zip(
    ['호야', '보리', '건빵', '살구', '로이', '삼식', '삼순'],
    ['#E4572E', '#2E86AB', '#F5A623', '#E8739B', '#6A994E', '#7D5BA6', '#2A9D8F']))]
html = '''<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>호리빵구 · 작은 친구들</title><style>
:root { color-scheme: light; --ink:#514c43; --bg:#fbf4e7; --muted:#8c8170; }
* { box-sizing:border-box; } body { margin:0; font:14px system-ui,'Malgun Gothic',sans-serif; color:var(--ink); background:var(--bg); overflow:hidden; }
.room { position:fixed; inset:0; background:linear-gradient(#fbf4e7 0%,#f8efdf 61%,#d9c3a4 61%,#e9d7bb 62%,#f0e0c6 100%); }
.window { position:absolute; top:19%; left:calc(50% - 92px); width:184px; height:180px; border:9px solid #fffaf0; border-radius:90px 90px 16px 16px; background:linear-gradient(#b9d8dd,#e8f2e6); box-shadow:0 8px 0 #dfc8a7,0 12px 25px #a28a6220; overflow:hidden; }
.window::before { content:''; position:absolute; left:34px; top:28px; width:35px; height:35px; border-radius:50%; background:#fff4c8; box-shadow:80px 65px 0 9px #f7fbf3,-22px 85px 0 14px #f7fbf3; }
.window::after { content:''; position:absolute; left:calc(50% - 3px); top:0; bottom:0; width:6px; background:#fffaf0; }
header { position:fixed; z-index:20; top:18px; left:22px; right:22px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
h1 { margin:0; font-size:20px; letter-spacing:-.5px; } .subtitle { margin-top:5px; font-size:12px; color:#958772; }
nav { display:flex; gap:6px; flex-wrap:wrap; } button { font:inherit; font-size:12px; color:var(--ink); border:1px solid #d8cbb7; background:#fffaf0dd; border-radius:18px; padding:9px 12px; cursor:pointer; }
button:hover { background:#fff; border-color:#b7a182; } button:focus-visible { outline:2px solid #9cae91; outline-offset:3px; }
#status { position:fixed; z-index:10; left:16px; right:16px; bottom:8px; text-align:center; font-size:11px; color:#8c7d66; pointer-events:none; }
'''+cat_css+'''
@media(max-width:560px) { header { top:12px; left:14px; right:14px; } h1 { font-size:18px; } .window { top:24%; width:150px; height:155px; left:calc(50% - 75px); } }
</style></head><body><div class="room"><div class="window"></div></div>
<header><div><h1>🐾 호리빵구 작은 친구들</h1><div class="subtitle">각자 좋아하는 자리에서, 오늘도 함께</div></div><nav aria-label="놀이터 조작">
<button id="restBtn">쉬는 시간</button><button id="wingsBtn">날개 친구들</button><button id="catBtn">고양이 숨기기</button></nav></header>
<div id="cats" aria-label="고양이 놀이터"><div id="props"></div></div>
<div id="status" role="status">고양이를 클릭해서 쓰다듬어 보세요.</div><script>
const KEY='horibbangu:standalone-playground:v1';
const $=id=>document.getElementById(id);
const state={pets:'''+json.dumps(pets,ensure_ascii=False)+'''};
function selectPet(id) { const p=state.pets.find(p=>p.id===id); if(p) $('status').textContent=p.name+'에게 쓰담쓰담 · 골골골~'; }
'''+cat_js+'''
renderCats();
$('catBtn').addEventListener('click',()=>{$('catBtn').textContent=catsOn?'고양이 숨기기':'고양이 보이기';});
$('restBtn').onclick=()=>{const t=performance.now();cats.forEach(c=>{if(!c.air&&c.mode!=='angel'){leave(c,t);if(!chooseFavorite(c,t))sleepNow(c,t);}});$('status').textContent='폭신한 자리로 가서 잠깐 쉬어요.';};
$('wingsBtn').onclick=()=>{const t=performance.now();cats.filter(c=>['로이','동글이'].includes(c.name)).forEach(c=>{c.angelAfter=0;c.restUntil=0;if(!c.air)startAngelFlight(c,t);});$('status').textContent='로이와 동글이, 오늘도 함께 ♡';};
</script></body></html>'''
assert 'firebase' not in html.lower()
assert 'state.records' not in html
assert '<script src=' not in html
assert 'horibbangu.web.app' not in html
(root / 'desktop/windows/playground.html').write_text(html)
print('Offline cat-only playground generated; no Firebase, record data, or network scripts.')
