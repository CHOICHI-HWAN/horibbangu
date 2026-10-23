"""Package the verified official Windows runtime with the transparent pet app."""
from pathlib import Path
import hashlib,json,os,shutil,tempfile,urllib.request,zipfile,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'))
from compiler import compile_file
root=Path(__file__).resolve().parents[2]
source=root/'desktop/windows'
lock=json.loads((source/'runtime-lock.json').read_text())
cache=Path(os.environ.get('HORIBBANGU_ELECTRON_CACHE','/tmp/horibbangu-build/electron'))
cache.mkdir(parents=True,exist_ok=True)
archive=cache/lock['archive']
if not archive.exists():
    with urllib.request.urlopen(lock['url'],timeout=120) as response,archive.open('wb') as output:
        shutil.copyfileobj(response,output)
assert hashlib.sha256(archive.read_bytes()).hexdigest()==lock['sha256'],'Official runtime checksum mismatch'
with tempfile.TemporaryDirectory(prefix='horibbangu-desktop-') as temp:
    stage=Path(temp)/'app';stage.mkdir()
    with zipfile.ZipFile(archive) as bundle:
        assert all(not name.startswith('/') and '..' not in Path(name).parts for name in bundle.namelist())
        bundle.extractall(stage)
    (stage/'electron.exe').rename(stage/'호리빵구.exe')
    (stage/'resources/default_app.asar').unlink(missing_ok=True)
    app=stage/'resources/app';app.mkdir()
    for name in ['playground.html','playground.js','tray.png','package.json']:
        shutil.copyfile(source/name,app/name)
    for name in ['main.cjs','preload.cjs']:compile_file(source/name,app/name,'node')
    shutil.copyfile(source/'사용방법.txt',stage/'사용방법.txt')
    target=root/'build/windows-unpacked'
    if target.exists():shutil.rmtree(target)
    shutil.copytree(stage,target)
print('Packaged borderless transparent desktop app with verified Electron '+lock['version'])
