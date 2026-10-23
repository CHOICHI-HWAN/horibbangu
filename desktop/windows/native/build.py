"""Build a small Win32 host; the Windows WebView2 runtime is shared, not bundled."""
from pathlib import Path
import hashlib,json,os,re,shutil,subprocess,urllib.request,zipfile
ROOT=Path(__file__).resolve().parents[3]
SOURCE=Path(__file__).resolve().parent
CACHE=Path(os.environ.get('HORIBBANGU_NATIVE_CACHE','/tmp/horibbangu-build'))
SDK_VERSION='1.0.4258.31'
SDK_SHA256='56f7f4b8bf9aee4b8efefbbdd4f67d5f74ebd1b100ed0806da71bf76af481aa9'
sdk=CACHE/'webview2'/SDK_VERSION
package=sdk.parent/(SDK_VERSION+'.nupkg')
if not package.exists():
 package.parent.mkdir(parents=True,exist_ok=True)
 package.write_bytes(urllib.request.urlopen(f'https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/{SDK_VERSION}/microsoft.web.webview2.{SDK_VERSION}.nupkg',timeout=120).read())
assert hashlib.sha256(package.read_bytes()).hexdigest()==SDK_SHA256
if not sdk.exists():
 with zipfile.ZipFile(package) as z:z.extractall(sdk)
BUILD=ROOT/'build/windows-native';BUILD.mkdir(parents=True,exist_ok=True)
header=(sdk/'build/native/include/WebView2.h').read_text()
iids=dict((name,value) for value,name in re.findall(r'MIDL_INTERFACE\("([a-fA-F0-9-]+)"\)\s*(ICore\w+)\s*:',header))
dcomp=(CACHE/'zig-aarch64-macos-0.15.2/lib/libc/include/any-windows-any/dcomp.h').read_text()
iids['IDCompositionDevice']=re.search(r'DECLARE_INTERFACE_IID_\(IDCompositionDevice,IUnknown,"([^"]+)"',dcomp).group(1)
needed=re.findall(r'MY_(\w+)',(SOURCE/'host.cpp').read_text())
needed+=re.findall(r'CALLBACK_BASE\((ICore\w+)\)',(SOURCE/'host.cpp').read_text())
lines=['// IIDs from the pinned official WebView2 SDK and Windows headers.']
for name in sorted(set(needed)):
 if name not in iids:continue
 parts=iids[name].split('-');tail=parts[3]+parts[4]
 lines.append('static const GUID MY_'+name+' = {0x'+parts[0]+',0x'+parts[1]+',0x'+parts[2]+',{'+','.join('0x'+tail[i:i+2] for i in range(0,16,2))+'}};')
(BUILD/'webview-guids.h').write_text('\n'.join(lines)+'\n')
manifest='''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0"><assemblyIdentity version="3.3.0.0" processorArchitecture="amd64" name="Horibbangu.Desktop" type="win32"/><trustInfo xmlns="urn:schemas-microsoft-com:asm.v3"><security><requestedPrivileges><requestedExecutionLevel level="asInvoker" uiAccess="false"/></requestedPrivileges></security></trustInfo><application xmlns="urn:schemas-microsoft-com:asm.v3"><windowsSettings><dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware><dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness></windowsSettings></application></assembly>'''
(BUILD/'app.manifest').write_text(manifest)
files=[ROOT/'desktop/windows/playground.html',ROOT/'desktop/windows/playground.js',sdk/'build/native/x64/WebView2Loader.dll',ROOT/'desktop/windows/사용방법.txt',ROOT/'LICENSE',ROOT/'THIRD_PARTY_NOTICES.md',sdk/'LICENSE.txt',sdk/'NOTICE.txt']
shutil.copyfile(ROOT/'desktop/windows/app.ico',BUILD/'app.ico')
resources=['// Embedded application assets.','#pragma code_page(65001)','1 ICON "app.ico"','1 24 "app.manifest"']
for i,p in enumerate(files):
 shutil.copyfile(p,BUILD/f'asset-{101+i}.bin')
 resources.append(str(101+i)+' RCDATA "asset-'+str(101+i)+'.bin"')
(BUILD/'app.rc').write_text('\n'.join(resources)+'\n')
zig=os.environ.get('ZIG') or str(CACHE/'zig-aarch64-macos-0.15.2/zig')
env={**os.environ,'ZIG_GLOBAL_CACHE_DIR':str(CACHE/'zig-cache'),'ZIG_LOCAL_CACHE_DIR':str(CACHE/'local-cache')}
subprocess.run([zig,'rc','/fo',str(BUILD/'app.res'),str(BUILD/'app.rc')],env=env,check=True,cwd=BUILD)
output=BUILD/'호리빵구.exe'
subprocess.run([zig,'c++','-target','x86_64-windows-gnu','-std=c++17','-Os','-fno-exceptions','-fno-rtti','-municode','-Wl,--subsystem,windows','-I'+str(sdk/'build/native/include'),'-I'+str(BUILD),'-I'+str(SOURCE),str(SOURCE/'host.cpp'),str(BUILD/'app.res'),'-luser32','-lole32','-lshell32','-luuid','-ldwmapi','-ldcomp','-lgdi32','-o',str(output)],env=env,check=True)
(BUILD/'manifest.json').write_text(json.dumps({'sdk':SDK_VERSION,'sdkSHA256':SDK_SHA256,'files':{str(101+i):{'name':p.name,'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for i,p in enumerate(files)}},indent=2)+'\n')
print('Built native WebView2 host:',output.stat().st_size,'bytes')
