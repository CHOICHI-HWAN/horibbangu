"""Validate the final native PE and every embedded resource, independently of its build."""
from pathlib import Path
import hashlib,json,struct,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from editions import requested_edition
edition=requested_edition()
ROOT=Path(__file__).resolve().parents[3]
folder=edition['build'];data=(folder/edition['exe']).read_bytes()
u16=lambda p:struct.unpack_from('<H',data,p)[0]
u32=lambda p:struct.unpack_from('<I',data,p)[0]
assert data[:2]==b'MZ';pe=u32(0x3c);assert data[pe:pe+4]==b'PE\0\0'
assert u16(pe+4)==0x8664 and u16(pe+24)==0x20b and u16(pe+24+68)==2
sections=[];start=pe+24+u16(pe+20)
for n in range(u16(pe+6)):
 p=start+n*40;sections.append((u32(p+12),max(u32(p+8),u32(p+16)),u32(p+20)))
def offset(rva):
 for base,size,raw in sections:
  if base<=rva<base+size:return raw+rva-base
 raise AssertionError(f'Invalid RVA {rva:x}')
resource=offset(u32(pe+24+112+2*8))
def tree(directory):
 p=resource+directory;result={}
 for n in range(u16(p+12)+u16(p+14)):
  key,value=struct.unpack_from('<II',data,p+16+n*8)
  assert not key&0x80000000
  if value&0x80000000:result[key]=tree(value&0x7fffffff)
  else:
   entry=resource+value;rva,size=struct.unpack_from('<II',data,entry)
   result[key]=data[offset(rva):offset(rva)+size]
 return result
resources=tree(0)
manifest=json.loads((folder/'manifest.json').read_text())
source=edition['renderer']
for id,info in manifest['files'].items():
 languages=resources[10][int(id)];assert len(languages)==1
 payload=next(iter(languages.values()))
 assert len(payload)==info['size'] and hashlib.sha256(payload).hexdigest()==info['sha256']
 if info['name'] in ['playground.html','playground.js','사용방법.txt']:assert payload==(source/info['name']).read_bytes()
 for name in ['LICENSE','THIRD_PARTY_NOTICES.md']:
  if info['name']==name:assert payload==(ROOT/name).read_bytes()
appmanifest=next(iter(resources[24][1].values())).decode()
assert 'asInvoker' in appmanifest and 'PerMonitorV2' in appmanifest
html=(source/'playground.html').read_text();js=(source/'playground.js').read_text()
assert 'id="landscape"' in html and 'data:image/webp' in html
assert '<script src="playground.js"></script>' in html and "script-src 'self'" in html
assert all(x not in html for x in ['id="recordsLink"','id="windowsDownload"','id="windowsStandalone"','id="windowsPark"','id="windowsKim"'])
assert 'firebase' not in (html+js).lower() and 'state.records' not in js
assert len(data)<2_000_000,'Native package size regression'
print(f'Verified native x64 GUI PE, embedded offline assets/notices, asInvoker/DPI manifest: {len(data):,} bytes.')

host=(ROOT/'desktop/windows/native/host.cpp').read_text()
input_host=(ROOT/'desktop/windows/native/interactive.h').read_text()
assert 'SetWindowsHookEx' not in host+input_host
assert 'SetWindowRgn' in input_host and 'if(topLayer()&&ready&&composition)' in input_host
assert 'let passive=true' in host and 'WS_EX_NOACTIVATE' in host and 'EnableWindow(windowHandle,FALSE)' in host
