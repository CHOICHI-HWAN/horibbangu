"""Publish a genuine single-EXE ZIP; never bundle a second browser runtime."""
from pathlib import Path
import hashlib,runpy,shutil,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from editions import requested_edition
from downloads import publish_exe,refresh_download_metadata
edition=requested_edition()
ROOT=Path(__file__).resolve().parents[3]
runpy.run_path(str(Path(__file__).with_name('test_binary.py')))
publish_exe(edition['build']/edition['exe'],edition)
folder=ROOT/'downloads'
shutil.copyfile(edition['renderer']/'사용방법.txt',folder/('사용방법.txt' if edition['key']=='default' else '사용방법-'+edition['label']+'.txt'))
refresh_download_metadata()
files=[folder/edition['download_exe'],folder/edition['archive']]
(folder/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in files))
