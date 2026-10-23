"""Publish a genuine single-EXE ZIP; never bundle a second browser runtime."""
from pathlib import Path
import hashlib,runpy,shutil,zipfile,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from editions import requested_edition,EDITIONS
edition=requested_edition()
ROOT=Path(__file__).resolve().parents[3]
runpy.run_path(str(Path(__file__).with_name('test_binary.py')))
folder=ROOT/'downloads';folder.mkdir(exist_ok=True)
exe=folder/edition['exe'];shutil.copyfile(edition['build']/edition['exe'],exe)
archive=folder/(exe.stem+'-Windows.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:z.write(exe,exe.name)
with zipfile.ZipFile(archive) as z:
 assert z.namelist()==[exe.name] and z.read(exe.name)==exe.read_bytes()
shutil.copyfile(edition['renderer']/'사용방법.txt',folder/('사용방법.txt' if edition['key']=='default' else '사용방법-'+edition['label']+'.txt'))
public=ROOT/'releases';public.mkdir(exist_ok=True)
for p,name in [(exe,edition['archive'].replace('.zip','.exe')),(archive,edition['archive'])]:
 shutil.copyfile(p,public/name)
 print(name,f'{p.stat().st_size:,} bytes',hashlib.sha256(p.read_bytes()).hexdigest())
zipfiles=[public/e['archive'] for e in EDITIONS.values() if (public/e['archive']).exists()]
fallback=public/'Horibbangu-Windows-Standalone.zip'
if fallback.exists():zipfiles.append(fallback)
(public/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in zipfiles))
(folder/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in [exe,archive]))
