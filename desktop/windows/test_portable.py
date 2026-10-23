"""Inspect the single EXE and round-trip every embedded runtime/app file."""
from pathlib import Path
import hashlib,json,os,shutil,struct,subprocess,tempfile
root=Path(__file__).resolve().parents[2]
source=root/'desktop/windows'
exe=root/'build/windows-portable/호리빵구.exe'
data=exe.read_bytes()
assert data[:2]==b'MZ'
pe=struct.unpack_from('<I',data,0x3c)[0]
assert data[pe:pe+4]==b'PE\0\0'
# NSIS uses a 32-bit GUI bootstrap to start the embedded Windows x64 runtime.
assert struct.unpack_from('<H',data,pe+4)[0]==0x14c
assert struct.unpack_from('<H',data,pe+24+68)[0]==2
assert b'requestedExecutionLevel level="asInvoker"' in data
config=json.loads((source/'portable.json').read_text())
assert config['portable']['requestExecutionLevel']=='user'
assert config['portable']['unpackDirName'] is True
# Pinned builder 26.15.3: true leaves UNPACK_DIR_NAME undefined, using unique
# $PLUGINSDIR per launch. This prevents a second launch deleting a running app.
builder=root/'node_modules/app-builder-lib'
implementation=(builder/'out/targets/nsis/NsisTarget.js').read_text()
assert 'typeof unpackDirName === "string" || !unpackDirName' in implementation
script=(builder/'templates/nsis/portable.nsi').read_text()
assert 'StrCpy $INSTDIR "$PLUGINSDIR\\app"' in script
assert script.index('ExecWait')<script.rindex('RMDir /r $INSTDIR')
node=os.environ.get('NODE_BIN') or shutil.which('node') or str(Path.home()/'.local/node/bin/node')
seven=subprocess.check_output([node,'-e',"require('app-builder-lib/out/toolsets/7zip').getPath7za().then(p=>process.stdout.write(p)).catch(e=>{console.error(e);process.exit(1)})"],cwd=root,text=True).strip()
with tempfile.TemporaryDirectory(prefix='horibbangu-portable-test-') as temp:
    temp=Path(temp);outer=temp/'outer';payload=temp/'payload'
    subprocess.run([seven,'x',str(exe),'-o'+str(outer),'-y'],check=True,stdout=subprocess.DEVNULL)
    archives=list(outer.rglob('app-64.7z'));assert len(archives)==1
    subprocess.run([seven,'x',str(archives[0]),'-o'+str(payload),'-y'],check=True,stdout=subprocess.DEVNULL)
    expected=root/'build/windows-unpacked'
    files={p.relative_to(expected):p for p in expected.rglob('*') if p.is_file()}
    actual={p.relative_to(payload):p for p in payload.rglob('*') if p.is_file()}
    assert files.keys()==actual.keys(),('Embedded file list mismatch',files.keys()^actual.keys())
    for rel,p in files.items():
        assert hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256(actual[rel].read_bytes()).digest(),str(rel)
    print(f'Verified single portable EXE: {len(files)} embedded files round-tripped; user permissions; isolated temporary directory; exit cleanup.')
