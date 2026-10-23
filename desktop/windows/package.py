"""Publish a complete portable desktop folder as a ZIP; no external installer."""
from pathlib import Path
import hashlib,shutil,zipfile
folder=Path(__file__).resolve().parents[2]/'downloads'
app=folder/'호리빵구'
assert (app/'호리빵구.exe').is_file() and (app/'resources/app/playground.html').is_file()
archive=folder/'호리빵구-Windows.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as bundle:
    for file in sorted(app.rglob('*')):
        if file.is_file():bundle.write(file,'호리빵구/'+file.relative_to(app).as_posix())
checksum=hashlib.sha256(archive.read_bytes()).hexdigest()
(folder/'SHA256SUMS.txt').write_text(checksum+'  '+archive.name+'\n')
public=folder.parent/'releases';public.mkdir(exist_ok=True)
public_zip=public/'Horibbangu-Windows.zip';shutil.copyfile(archive,public_zip)
(public/'SHA256SUMS.txt').write_text(checksum+'  '+public_zip.name+'\n')
print(f'Packaged portable Windows ZIP: {archive.stat().st_size:,} bytes; SHA-256: {checksum}')
