"""Validate the portable Windows runtime and its offline app without executing it."""
from pathlib import Path
import hashlib,json,struct,zipfile,os,sys,tempfile
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'))
from compiler import compile_file
root=Path(__file__).resolve().parents[2]
source=root/'desktop/windows';folder=root/'build/windows-unpacked'
exe=folder/'호리빵구.exe';data=exe.read_bytes()
u16=lambda p:struct.unpack_from('<H',data,p)[0]
u32=lambda p:struct.unpack_from('<I',data,p)[0]
assert data[:2]==b'MZ'
pe=u32(0x3c);assert data[pe:pe+4]==b'PE\0\0'
assert u16(pe+4)==0x8664 and u16(pe+24)==0x20b and u16(pe+24+68)==2
lock=json.loads((source/'runtime-lock.json').read_text())
cache=Path(os.environ.get('HORIBBANGU_ELECTRON_CACHE','/tmp/horibbangu-build/electron'))/lock['archive']
assert hashlib.sha256(cache.read_bytes()).hexdigest()==lock['sha256']
with zipfile.ZipFile(cache) as z:assert data==z.read('electron.exe'),'Runtime executable was modified'
for name in ['resources.pak','icudtl.dat','electron_wer.dll','ffmpeg.dll','dxcompiler.dll','d3dcompiler_47.dll','v8_context_snapshot.bin']:
    assert (folder/name).is_file(),name
for name in ['playground.html','playground.js','package.json','tray.png']:
    assert (folder/'resources/app'/name).read_bytes()==(source/name).read_bytes(),name
with tempfile.TemporaryDirectory() as temp:
    for name in ['main.cjs','preload.cjs']:
        target=Path(temp)/name;compile_file(source/name,target,'node')
        assert (folder/'resources/app'/name).read_bytes()==target.read_bytes(),name
html=(source/'playground.html').read_text()
script=(source/'playground.js').read_text()
assert 'id="landscape"' in html and 'id="weatherCanvas"' in html
assert 'data:image/webp' in html and 'desktop-overlay' in html
assert 'state.records' not in script and 'firebase' not in (html+script).lower()
assert '<script src="playground.js"></script>' in html and "script-src 'self'" in html
assert not (folder/'resources/default_app.asar').exists()
print('Verified: original Windows x64 GUI runtime, complete portable folder, current transparent offline app.')
print('App version:',json.loads((source/'package.json').read_text())['version'])
