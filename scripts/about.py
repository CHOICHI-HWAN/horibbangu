"""Shared credits for the room, native host and published About document."""
from pathlib import Path
from html import escape
import json
ROOT=Path(__file__).resolve().parents[1]
ABOUT=json.loads((ROOT/'room/about.json').read_text())
def about_text():
    a=ABOUT
    return '\n\n'.join(['만든이: '+a['maker']+' ('+a['email']+')\n'+a['tools'], '만든 마음\n'+'\n'.join(a['motivation'])+'\n'+a['aside'], '라이선스\n'+a['license']+'\n'+a['permission']])
def about_html():
    a={k:escape(v) if isinstance(v,str) else v for k,v in ABOUT.items()}
    return f'''<dialog id="aboutDialog" class="about-dialog" aria-labelledby="aboutTitle">
<div class="about-mark" aria-hidden="true">♡</div><p class="about-kicker">호리빵구 · 함께 쉬는 작은 방</p><h2 id="aboutTitle">만든이</h2>
<p class="about-maker">{a['maker']}</p><p><a href="mailto:{a['email']}">{a['email']}</a><br><span class="about-tools">{a['tools']}</span></p>
<h3>만든 마음</h3>{''.join('<p>'+escape(p)+'</p>' for p in a['motivation'])}<p class="about-aside">{a['aside']}</p>
<h3>라이선스</h3><p>{a['license']}</p><p class="about-permission">{a['permission']}</p>
<form method="dialog"><button autofocus>고양이들 곁으로</button></form></dialog>'''
def about_markdown():
    a=ABOUT
    return '\n\n'.join(['# 호리빵구 · 만든이', '**만든이: '+a['maker']+'** · ['+a['email']+'](mailto:'+a['email']+')\n\n'+a['tools'], '## 만든 마음', '\n\n'.join(a['motivation']), a['aside'], '## 라이선스', a['license'], a['permission'], '전체 이용 조건은 [LICENSE](LICENSE), 쉬운 설명은 [이용 정책](legal/USAGE_POLICY.md), 외부 구성요소는 [외부 소프트웨어 고지](THIRD_PARTY_NOTICES.md)를 확인하세요.'])+'\n'
