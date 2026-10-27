"""Build a small Win32 host; the Windows WebView2 runtime is shared, not bundled."""
from pathlib import Path
import hashlib,json,os,re,shutil,subprocess,sys,urllib.request,zipfile
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from editions import requested_edition
edition=requested_edition()
ROOT=Path(__file__).resolve().parents[3]
SOURCE=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'scripts'))
from about import about_text
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
zig=os.environ.get('ZIG') or str(CACHE/'zig-aarch64-macos-0.15.2/zig')
BUILD=edition['build'];BUILD.mkdir(parents=True,exist_ok=True)
(BUILD/'about.h').write_text('#define APP_ABOUT L'+json.dumps(about_text(),ensure_ascii=False)+'\n',encoding='utf-8')
config={'APP_VERSION':edition['version'],'APP_TITLE':edition['title'],'APP_DATA_DIR':edition['data'],'APP_WINDOW_CLASS':edition['window_class'],'APP_SETTINGS_CLASS':edition['settings_class'],'APP_MUTEX':edition['mutex']}
(BUILD/'edition.h').write_text('\n'.join('#define '+key+' L'+json.dumps(value,ensure_ascii=False) for key,value in config.items())+'\n#define APP_HAS_GUESTS '+str(int(edition['cats'] is None))+'\n',encoding='utf-8')
header=(sdk/'build/native/include/WebView2.h').read_text()
iids=dict((name,value) for value,name in re.findall(r'MIDL_INTERFACE\("([a-fA-F0-9-]+)"\)\s*(ICore\w+)\s*:',header))
dcomp=(Path(zig).parent/'lib/libc/include/any-windows-any/dcomp.h').read_text()
iids['IDCompositionDevice']=re.search(r'DECLARE_INTERFACE_IID_\(IDCompositionDevice,IUnknown,"([^"]+)"',dcomp).group(1)
needed=re.findall(r'MY_(\w+)',(SOURCE/'host.cpp').read_text())
needed+=re.findall(r'CALLBACK_BASE\((ICore\w+)\)',(SOURCE/'host.cpp').read_text())
lines=['// IIDs from the pinned official WebView2 SDK and Windows headers.']
for name in sorted(set(needed)):
 if name not in iids:continue
 parts=iids[name].split('-');tail=parts[3]+parts[4]
 lines.append('static const GUID MY_'+name+' = {0x'+parts[0]+',0x'+parts[1]+',0x'+parts[2]+',{'+','.join('0x'+tail[i:i+2] for i in range(0,16,2))+'}};')
(BUILD/'webview-guids.h').write_text('\n'.join(lines)+'\n')
manifest='''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0"><assemblyIdentity version="3.3.1.0" processorArchitecture="amd64" name="Horibbangu.Desktop" type="win32"/><trustInfo xmlns="urn:schemas-microsoft-com:asm.v3"><security><requestedPrivileges><requestedExecutionLevel level="asInvoker" uiAccess="false"/></requestedPrivileges></security></trustInfo><application xmlns="urn:schemas-microsoft-com:asm.v3"><windowsSettings><dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware><dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness></windowsSettings></application></assembly>'''
(BUILD/'app.manifest').write_text(manifest.replace('3.3.1.0',edition['version']+'.0').replace('Horibbangu.Desktop','Horibbangu.Desktop'+edition['suffix']))
files=[edition['renderer']/'playground.html',edition['renderer']/'playground.js',sdk/'build/native/x64/WebView2Loader.dll',edition['renderer']/'사용방법.txt',ROOT/'LICENSE',ROOT/'THIRD_PARTY_NOTICES.md',sdk/'LICENSE.txt',sdk/'NOTICE.txt',ROOT/'legal/third-party/NativeRuntime-LICENSES.txt']
shutil.copyfile(ROOT/'desktop/windows/app.ico',BUILD/'app.ico')
resources=['// Embedded application assets.','#pragma code_page(65001)','1 ICON "app.ico"','1 24 "app.manifest"']
for i,p in enumerate(files):
 shutil.copyfile(p,BUILD/f'asset-{101+i}.bin')
 resources.append(str(101+i)+' RCDATA "asset-'+str(101+i)+'.bin"')
(BUILD/'app.rc').write_text('\n'.join(resources)+'\n')
env={**os.environ,'ZIG_GLOBAL_CACHE_DIR':str(CACHE/'zig-cache'),'ZIG_LOCAL_CACHE_DIR':str(CACHE/'local-cache')}
subprocess.run([zig,'rc','/fo',str(BUILD/'app.res'),str(BUILD/'app.rc')],env=env,check=True,cwd=BUILD)
output=BUILD/edition['exe']
subprocess.run([zig,'c++','-target','x86_64-windows-gnu','-std=c++17','-Os','-fno-exceptions','-fno-rtti','-municode','-Wl,--subsystem,windows','-I'+str(sdk/'build/native/include'),'-I'+str(BUILD),'-I'+str(SOURCE),str(SOURCE/'host.cpp'),str(BUILD/'app.res'),'-luser32','-lole32','-lshell32','-luuid','-ldwmapi','-ldcomp','-lgdi32','-lcomctl32','-o',str(output)],env=env,check=True)
(BUILD/'manifest.json').write_text(json.dumps({'edition':edition['key'],'exe':edition['exe'],'sdk':SDK_VERSION,'sdkSHA256':SDK_SHA256,'files':{str(101+i):{'name':p.name,'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for i,p in enumerate(files)}},indent=2)+'\n')
print('Built native WebView2 host:',output.stat().st_size,'bytes')
if os.environ.get('HORIBBANGU_NATIVE_TEST_BUILD')=='1':
 subprocess.run([zig,'c++','-target','x86_64-windows-gnu','-std=c++17','-Os','-municode',str(SOURCE/'test_desktop_probe.cpp'),'-lole32','-loleaut32','-lshell32','-lshlwapi','-luuid','-o',str(BUILD/'desktop-probe.exe')],env=env,check=True)
