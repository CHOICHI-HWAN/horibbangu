"""Verify the Windows package on any build host (Python standard library only)."""
from pathlib import Path
import struct
import hashlib

root = Path(__file__).resolve().parents[2]
binary = root / 'downloads' / '호리빵구.exe'
data = binary.read_bytes()
u16 = lambda p: struct.unpack_from('<H', data, p)[0]
u32 = lambda p: struct.unpack_from('<I', data, p)[0]
assert data[:2] == b'MZ', 'Missing DOS header'
pe = u32(0x3C)
assert data[pe:pe+4] == b'PE\0\0', 'Missing PE signature'
assert u16(pe+4) == 0x8664, 'Expected Windows x64'
opt = pe+24
assert u16(opt) == 0x20B, 'Expected PE32+'
assert u16(opt+68) == 2, 'Expected GUI subsystem without a console'
sections = []
for i in range(u16(pe+6)):
    p = opt+u16(pe+20)+40*i
    sections.append((u32(p+12), max(u32(p+8), u32(p+16)), u32(p+20)))

def offset(rva):
    for va, size, raw in sections:
        if va <= rva < va+size:
            return raw+rva-va
    raise AssertionError(f'Unmapped RVA {rva:x}')

base = offset(u32(opt+112+2*8))
resources = {}

def walk(directory, path=()):
    p = base+directory
    for i in range(u16(p+12)+u16(p+14)):
        entry = p+16+8*i
        name, value = u32(entry), u32(entry+4)
        key = name if not name & 0x80000000 else 'named'
        if value & 0x80000000:
            walk(value & 0x7FFFFFFF, path+(key,))
        else:
            d = base+value
            start, size = offset(u32(d)), u32(d+4)
            resources[path+(key,)] = data[start:start+size]

walk(0)
assert {3, 10, 14, 16, 24} <= {key[0] for key in resources}, 'Missing icon, HTML, version, or manifest'
payload = next(value for key, value in resources.items() if key[:2] == (10, 2))
assert payload == (root / 'desktop/windows/playground.html').read_bytes(), 'Embedded playground is stale'
assert b'firebase' not in payload.lower() and b'state.records' not in payload
assert b'<script src=' not in payload
imports = []
p = offset(u32(opt+112+8))
while any(data[p:p+20]):
    name = offset(u32(p+12))
    imports.append(data[name:data.index(b'\0', name)].decode().lower())
    p += 20
system_dlls = {'kernel32.dll', 'msvcrt.dll', 'shell32.dll', 'shlwapi.dll', 'ole32.dll', 'user32.dll'}
assert all(name in system_dlls or (name.startswith('api-ms-win-crt-') and name.endswith('.dll')) for name in imports), imports
print('Verified: Windows x64 GUI, icon, manifest, current offline HTML, and Windows system DLLs only.')
print(f'Size: {len(data):,} bytes; SHA-256: {hashlib.sha256(data).hexdigest()}')
