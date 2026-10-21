"""Bundle the built executable and keep the download checksums in sync."""
from pathlib import Path
import hashlib
import zipfile

folder = Path(__file__).resolve().parents[2] / 'downloads'
exe = folder / '호리빵구.exe'
archive = folder / '호리빵구-Windows.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    for file in [exe, folder / '사용방법.txt']:
        bundle.write(file, file.name)
(folder / 'SHA256SUMS.txt').write_text(''.join(
    hashlib.sha256(file.read_bytes()).hexdigest()+'  '+file.name+'\n'
    for file in [exe, archive]))
print('Packaged Windows ZIP and updated SHA256SUMS.txt.')
