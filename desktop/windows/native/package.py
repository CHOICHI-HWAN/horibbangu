"""Publish a genuine single-EXE ZIP; never bundle a second browser runtime."""
from pathlib import Path
import hashlib,runpy,shutil,zipfile
ROOT=Path(__file__).resolve().parents[3]
runpy.run_path(str(Path(__file__).with_name('test_binary.py')))
folder=ROOT/'downloads';folder.mkdir(exist_ok=True)
exe=folder/'호리빵구.exe';shutil.copyfile(ROOT/'build/windows-native/호리빵구.exe',exe)
archive=folder/'호리빵구-Windows.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:z.write(exe,exe.name)
with zipfile.ZipFile(archive) as z:
 assert z.namelist()==[exe.name] and z.read(exe.name)==exe.read_bytes()
shutil.copyfile(ROOT/'desktop/windows/사용방법.txt',folder/'사용방법.txt')
public=ROOT/'releases';public.mkdir(exist_ok=True)
for p,name in [(exe,'Horibbangu-Windows.exe'),(archive,'Horibbangu-Windows.zip')]:
 shutil.copyfile(p,public/name)
 print(name,f'{p.stat().st_size:,} bytes',hashlib.sha256(p.read_bytes()).hexdigest())
zipfiles=[public/'Horibbangu-Windows.zip']
fallback=public/'Horibbangu-Windows-Standalone.zip'
if fallback.exists():zipfiles.append(fallback)
(public/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in zipfiles))
(folder/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in [exe,archive]))
