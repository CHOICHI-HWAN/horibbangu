"""Build a single portable EXE and an optional ZIP containing only that EXE."""
from pathlib import Path
import hashlib,json,os,shutil,subprocess,sys,zipfile
root=Path(__file__).resolve().parents[2]
source=root/'desktop/windows'
node=os.environ.get('NODE_BIN') or shutil.which('node') or str(Path.home()/'.local/node/bin/node')
# NSIS 3.12 + pinned electron-builder. Keep the unpacked runtime in build/ only.
subprocess.run([node,str(root/'node_modules/electron-builder/cli.js'),
    '--projectDir',str(source),'--prepackaged',str(root/'build/windows-unpacked'),
    '--config',str(source/'portable.json'),'--win','portable','--x64','--publish','never'],check=True,cwd=root)
subprocess.run([sys.executable,str(source/'test_portable.py')],check=True,cwd=root)
folder=root/'downloads';folder.mkdir(exist_ok=True)
exe=folder/'호리빵구.exe';shutil.copyfile(root/'build/windows-portable/호리빵구.exe',exe)
shutil.copyfile(source/'사용방법.txt',folder/'사용방법.txt')
archive=folder/'호리빵구-Windows.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_STORED) as bundle:
    bundle.write(exe,exe.name)
public=root/'releases';public.mkdir(exist_ok=True)
checksums=[]
for local,name in [(exe,'Horibbangu-Windows.exe'),(archive,'Horibbangu-Windows.zip')]:
    shutil.copyfile(local,public/name)
    digest=hashlib.sha256(local.read_bytes()).hexdigest()
    if name.endswith('.zip'):checksums.append(digest+'  '+name+'\n')
    print(f'Published {name}: {local.stat().st_size:,} bytes; SHA-256: {digest}')
(public/'SHA256SUMS.txt').write_text(''.join(checksums))
(folder/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in [exe,archive]))
# Remove only the obsolete generated distribution folder after the new file passes.
legacy=folder/'호리빵구'
if (legacy/'resources/app/package.json').exists() and json.loads((legacy/'resources/app/package.json').read_text()).get('name')=='horibbangu-desktop':shutil.rmtree(legacy)
