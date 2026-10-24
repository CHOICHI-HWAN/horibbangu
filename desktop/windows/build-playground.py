"""Embed the same cat-only room, with no records navigation or external assets."""
from pathlib import Path
import runpy
import re
import sys
from editions import requested_edition
edition=requested_edition()
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'))
from compiler import compile_file
root=Path(__file__).resolve().parents[2]
runpy.run_path(str(root/'scripts/build-room.py'))
html=(root/'index.html').read_text()
html=html.replace('<a class="login-link" id="recordsLink" href="records.html">로그인 · 체중 기록 ↗</a>','')
html=re.sub(r'<a id="windows(?:Download|Standalone|Park|Kim)"[^>]*>.*?</a>','',html)
# Keep the painted room embedded; the desktop toggle controls its visibility.
html=re.sub(r'<title>.*?</title>','<title>호리빵구 · 바탕화면 친구들</title>',html)
html=html.replace('<body class="room-page">','<body class="room-page desktop-overlay">')
html=html.replace('</style>', '\n'+(root/'desktop/windows/overlay.css').read_text()+'\n</style>',1)
html=html.replace('const roomMode = true;', 'const roomMode = true; const desktopOverlay = true; let desktopBackground = false;')
html=html.replace('initRoom();','initRoom();\n'+(root/'desktop/windows/overlay.js').read_text())
if edition['cats']:
    import json
    names=edition['cats']
    # Retain the exact existing friend artwork; only this build's resident list changes.
    pets=[]
    for name in names:
        match=re.search(r"\{id:'([^']+)',name:'"+re.escape(name)+r"',color:'([^']+)',guest:true\}",html)
        assert match,name
        pets.append(dict(id=match[1],name=name,color=match[2],guest=True))
    html,n=re.subn(r'const state=\{pets:.*?\};','const state={pets:'+json.dumps(pets,ensure_ascii=False)+'};',html,count=1);assert n==1
    html,n=re.subn(r'  let companions = state\.pets\.some\(.*?;', '  let companions = state.pets;',html,count=1);assert n==1
    for signature in ['function roomGuestPets(){','function inviteRoomFriends(t=performance.now()){','function tickRoomGuests(t,dt){']:
        assert signature in html
        html=html.replace(signature,signature+(' return [];' if 'roomGuestPets' in signature else ' return;'),1)
    html,n=re.subn(r'    c\.el\.title = p\.guest .*?;', '    c.el.title = p.name;',html,count=1);assert n==1
    html=html.replace('보리 &amp; 건빵',' &amp; '.join(names)).replace('호야의 방','아늑한 쉼터')
    html=html.replace('바탕화면의 작은 친구들',edition['title'])
    html=html.replace('<title>호리빵구 · 바탕화면 친구들</title>','<title>'+edition['title']+'</title>')
    html=html.replace("setRoomControls(false);updateDesktopHit();", "$('friendsBtn').hidden=true;$('wingsBtn').hidden=true;setRoomControls(false);updateDesktopHit();")
output=edition['renderer'];output.mkdir(parents=True,exist_ok=True)
assert 'firebase' not in html.lower() and 'state.records' not in html and '<script src=' not in html
# Compile the renderer into a local script so Chromium can reuse its code cache.
match=re.search(r'<script>(.*?)</script>',html,re.S);assert match
script=root/'build'/('desktop-source-'+edition['key']+'.js');script.parent.mkdir(exist_ok=True);script.write_text(match.group(1))
compile_file(script,output/'playground.js','browser')
html=html[:match.start()]+'<script src="playground.js"></script>'+html[match.end():]
html=html.replace("script-src 'unsafe-inline'", "script-src 'self'")
(output/'playground.html').write_text(html,newline='\n')
if edition['cats']:
    guide=(root/'desktop/windows/사용방법.txt').read_text()
    guide=guide.replace('호리빵구 · 바탕화면 친구들 '+edition['version'],edition['title']+' '+edition['version'])
    guide=guide.replace('「호리빵구.exe」','「'+edition['download_exe']+'」')
    guide=re.sub(r'런타임 설치를 원하지 않으면 별도 .*?약 101 MB입니다\.\n','',guide,flags=re.S)
    guide=guide.replace('HoribbanguDesktop',edition['data'])
    guide+='\n이 버전에는 '+', '.join(edition['cats'])+'만 처음부터 계속 함께합니다. 다른 친구는 방문하지 않습니다.\n기본판 및 다른 개별판과 실행·설정 폴더가 분리되어 있습니다.\n'
    (output/'사용방법.txt').write_text(guide,newline='\n')
assert 'id="landscape"' in html and 'data:image/webp' in html
print('Generated desktop playground:',edition['title'],output)
