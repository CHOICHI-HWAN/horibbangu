"""Publish versioned filenames without changing the verified executable bytes."""
import hashlib
import json
import shutil
import zipfile
from editions import ROOT,EDITIONS,STANDALONE_VERSION,edition_config,download_archives

def publish_exe(source,edition):
 folder=ROOT/'downloads';folder.mkdir(exist_ok=True)
 public=ROOT/'releases';public.mkdir(exist_ok=True)
 exe=folder/edition['download_exe'];shutil.copyfile(source,exe)
 archive=folder/edition['archive']
 with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:z.write(exe,exe.name)
 with zipfile.ZipFile(archive) as z:assert z.namelist()==[exe.name] and z.read(exe.name)==source.read_bytes()
 for name in [edition['archive'],edition['archive_alias']]:shutil.copyfile(archive,public/name)
 shutil.copyfile(exe,public/edition['archive'].replace('.zip','.exe'))
 alias_exe=public/edition['archive_alias'].replace('.zip','.exe')
 if source.resolve()!=alias_exe.resolve():shutil.copyfile(exe,alias_exe)
 print(archive.name,archive.stat().st_size,'bytes;',exe.name)

def refresh_download_metadata():
 public=ROOT/'releases'
 names=[name for name in download_archives() if (public/name).exists()]
 (public/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256((public/name).read_bytes()).hexdigest()+'  '+name+'\n' for name in names),newline='\n')
 # Older shared URLs also offer a versioned browser filename.
 config=ROOT/'firebase.json';data=json.loads(config.read_text())
 filenames={e['archive_alias']:e['archive'] for e in map(edition_config,EDITIONS)}
 filenames['Horibbangu-Windows-Standalone.zip']='Horibbangu-Windows-Standalone-v'+STANDALONE_VERSION+'.zip'
 for rule in data['hosting']['headers']:
  filename=filenames.get(rule['source'].removeprefix('/releases/'))
  if filename:
   for header in rule['headers']:
    if header['key']=='Content-Disposition':header['value']='attachment; filename="'+filename+'"'
 if not any(rule['source']=='/releases/*-v*.zip' for rule in data['hosting']['headers']):
  data['hosting']['headers'].append({'source':'/releases/*-v*.zip','headers':[{'key':'Content-Type','value':'application/zip'},{'key':'Content-Disposition','value':'attachment'}]})
 config.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':
 # Repackage the already tested release EXEs; no renderer/host rebuild required.
 for key in EDITIONS:
  edition=edition_config(key)
  publish_exe(ROOT/'releases'/edition['archive_alias'].replace('.zip','.exe'),edition)
 legacy=ROOT/'releases/Horibbangu-Windows-Standalone.zip'
 versioned=legacy.with_name('Horibbangu-Windows-Standalone-v'+STANDALONE_VERSION+'.zip')
 with zipfile.ZipFile(legacy) as source:
  assert len(source.infolist())==1
  info=source.infolist()[0];payload=source.read(info.filename)
 with zipfile.ZipFile(versioned,'w',compression=info.compress_type) as target:
  target.writestr('호리빵구-호환판-v'+STANDALONE_VERSION+'.exe',payload)
 with zipfile.ZipFile(versioned) as target:assert target.read(target.namelist()[0])==payload
 shutil.copyfile(versioned,legacy)
 refresh_download_metadata()
