"""Exercise actual fullscreen, preview parenting, configuration, and input exit on Windows."""
from pathlib import Path
import ctypes as C,ctypes.wintypes as W,json,os,subprocess,time,shutil,faulthandler
from PIL import ImageGrab
import sys
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'desktop/windows'))
from editions import edition_config
edition=edition_config(os.environ.get('HORIBBANGU_EDITION','default'))
os.chdir(ROOT)
OUT=edition['verification'];OUT.mkdir(parents=True,exist_ok=True)
faulthandler.dump_traceback_later(180,exit=True)
u=C.WinDLL('user32',use_last_error=True)
u.FindWindowW.argtypes=[W.LPCWSTR,W.LPCWSTR];u.FindWindowW.restype=W.HWND
u.GetParent.argtypes=[W.HWND];u.GetParent.restype=W.HWND
u.GetPropW.argtypes=[W.HWND,W.LPCWSTR];u.GetPropW.restype=W.HANDLE
u.GetWindowLongPtrW.argtypes=[W.HWND,C.c_int];u.GetWindowLongPtrW.restype=C.c_ssize_t
u.GetWindowRect.argtypes=[W.HWND,C.POINTER(W.RECT)]
u.GetClientRect.argtypes=[W.HWND,C.POINTER(W.RECT)]
u.IsWindowVisible.argtypes=[W.HWND];u.IsWindowVisible.restype=W.BOOL
u.DestroyWindow.argtypes=[W.HWND]
u.PostMessageW.argtypes=[W.HWND,W.UINT,W.WPARAM,W.LPARAM]
u.MoveWindow.argtypes=[W.HWND,C.c_int,C.c_int,C.c_int,C.c_int,W.BOOL]
u.CreateWindowExW.argtypes=[W.DWORD,W.LPCWSTR,W.LPCWSTR,W.DWORD,C.c_int,C.c_int,C.c_int,C.c_int,W.HWND,W.HMENU,W.HINSTANCE,W.LPVOID];u.CreateWindowExW.restype=W.HWND
apps=[];parent=None
def pump(seconds):
 end=time.time()+seconds;msg=W.MSG()
 while time.time()<end:
  while u.PeekMessageW(C.byref(msg),None,0,0,1):u.TranslateMessage(C.byref(msg));u.DispatchMessageW(C.byref(msg))
  time.sleep(.02)
def launch(*args):
 p=subprocess.Popen([str(ROOT/'candidate.exe'),*args]);apps.append(p);return p
def visible(p,cls,title=None):
 end=time.time()+60
 while time.time()<end:
  assert p.poll() is None,'Screensaver exited before its first visible frame'
  if cls==edition['window_class']+'View':
   control=u.FindWindowW(edition['window_class'],None)
   h=u.GetPropW(control,'HoribbanguVisual') if control else None
  else:h=u.FindWindowW(cls,title)
  if h and u.IsWindowVisible(h):return h
  pump(.1)
 raise AssertionError('Screensaver readiness timeout')
def evaluate(expression):
 r=subprocess.run(['node','desktop/windows/native/evaluate.cjs'],input=json.dumps(expression)+'\n',text=True,capture_output=True,timeout=20)
 assert r.returncode==0,r.stderr
 result=json.loads(r.stdout);assert result['ok'],result
 return result['result']
try:
 pump(3) # Let the preceding test's WebView browser release its profile/port.
 # The ordinary wallpaper can remain running while the saver uses a separate profile.
 desktop=launch();desktop_hwnd=visible(desktop,edition['window_class']+'View')
 saver=launch('/s');h=visible(saver,edition['window_class']+'Saver');pump(1)
 assert not u.GetParent(h),'Saver was attached to Explorer'
 assert u.GetWindowLongPtrW(h,-20)&8,'Saver is not topmost'
 r=W.RECT();u.GetWindowRect(h,C.byref(r))
 assert (r.left,r.top,r.right-r.left,r.bottom-r.top)==tuple(u.GetSystemMetrics(i) for i in [76,77,78,79])
 # The wallpaper owns port 9223 while the saver uses its own profile. Closing it
 # verifies independent lifetime and lets the next launch expose its renderer.
 u.PostMessageW(desktop_hwnd,0x10,0,0);desktop.wait(timeout=15)
 assert saver.poll() is None
 ImageGrab.grab().save(OUT/'screensaver-fullscreen.png')
 u.mouse_event(1,20,0,0,0);saver.wait(timeout=10);assert saver.returncode==0
 pump(1)
 saver=launch('/S');h=visible(saver,edition['window_class']+'Saver');pump(.5)
 assert evaluate('desktopBackground && cats.length>0 && !document.querySelector("#recordsLink")')
 u.keybd_event(0x20,0,0,0);u.keybd_event(0x20,0,2,0);saver.wait(timeout=10);assert saver.returncode==0
 pump(1)
 parent=u.CreateWindowExW(0,'STATIC','Horibbangu saver preview test',0x90000000,50,50,380,260,None,None,None,None)
 assert parent
 preview=launch('/p',str(parent))
 # FindWindowEx because previews are children rather than top-level windows.
 u.FindWindowExW.argtypes=[W.HWND,W.HWND,W.LPCWSTR,W.LPCWSTR];u.FindWindowExW.restype=W.HWND
 end=time.time()+60;child=None
 while time.time()<end:
  assert preview.poll() is None
  child=u.FindWindowExW(parent,None,edition['window_class']+'Preview',None)
  if child and u.IsWindowVisible(child):break
  pump(.1)
 assert child and u.IsWindowVisible(child) and u.GetParent(child)==parent
 u.MoveWindow(parent,50,50,440,300,True);pump(.3)
 client=W.RECT();actual=W.RECT();u.GetClientRect(parent,C.byref(client));u.GetClientRect(child,C.byref(actual))
 assert (actual.right,actual.bottom)==(client.right,client.bottom)
 # Navigation/visibility precedes the first GPU-composited room frame, especially
 # with the default edition's eight cats. Wait for actual pixels, not a fixed delay.
 deadline=time.time()+10;painted=False
 while time.time()<deadline:
  pump(.2);assert preview.poll() is None
  screenshot=ImageGrab.grab();rect=W.RECT();u.GetWindowRect(child,C.byref(rect))
  image=screenshot.crop((rect.left+8,rect.top+25,rect.right-8,rect.bottom-8)).convert('RGB')
  if sum(high-low for low,high in image.getextrema())>90:painted=True;break
 screenshot.save(OUT/'screensaver-preview.png')
 assert painted,'Preview window is blank'
 u.mouse_event(1,5,0,0,0);pump(.3);assert preview.poll() is None,'Preview incorrectly exits on mouse input'
 u.DestroyWindow(parent);parent=None;preview.wait(timeout=15);assert preview.returncode==0
 # A copied .scr is the identical tested PE. No arguments opens configuration.
 scr=OUT/'test-saver.scr';shutil.copyfile(ROOT/'candidate.exe',scr)
 config=subprocess.Popen([str(scr)]);apps.append(config)
 title=edition['title']+' · 화면보호기'
 dialog=visible(config,'#32770',title)
 text=C.create_unicode_buffer(256);u.GetWindowTextW.argtypes=[W.HWND,W.LPWSTR,C.c_int];u.GetWindowTextW(dialog,text,256)
 assert text.value==title,text.value
 u.PostMessageW(dialog,0x10,0,0);config.wait(timeout=10);assert config.returncode==0
 bad=launch('/p:0');bad.wait(timeout=10);assert bad.returncode==2
 (OUT/'screensaver-result.json').write_text(json.dumps({'ok':True,'checks':['same PE renamed .scr','fullscreen virtual desktop','independent wallpaper process and profile','mouse exit','keyboard exit','background and cats','embedded resizable preview','preview survives input and exits with parent','configuration without args','invalid preview handle rejected']},indent=2))
 print('Actual Windows screensaver checks passed.',flush=True)
finally:
 ImageGrab.grab().save(OUT/'screensaver-final.png')
 logs=Path(os.environ['LOCALAPPDATA'])/edition['data']/'Native'
 for folder in [edition['version'],edition['version']+'-Saver',edition['version']+'-Preview']:
  log=logs/folder/'startup.log'
  if log.exists():
   shutil.copyfile(log,OUT/('startup-'+folder+'.log'))
   print(folder,log.read_text(encoding='utf-8')[-6000:],flush=True)
 if parent:u.DestroyWindow(parent)
 for p in apps:
  if p.poll() is None:p.terminate();p.wait(timeout=10)
