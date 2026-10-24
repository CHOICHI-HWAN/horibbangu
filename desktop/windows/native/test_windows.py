"""Run on an interactive Windows CI desktop, never claim cross-compilation is execution."""
from pathlib import Path
import sys
import ctypes as C,ctypes.wintypes as W,faulthandler,json,os,subprocess,time,urllib.request
faulthandler.dump_traceback_later(180,exit=True)
from PIL import ImageGrab
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'desktop/windows'))
from editions import edition_config
edition=edition_config(os.environ.get('HORIBBANGU_EDITION','default'))
os.chdir(ROOT)
OUT=edition['verification'];OUT.mkdir(parents=True,exist_ok=True)
u=C.WinDLL('user32',use_last_error=True)
u.CreateWindowExW.argtypes=[W.DWORD,W.LPCWSTR,W.LPCWSTR,W.DWORD,C.c_int,C.c_int,C.c_int,C.c_int,W.HWND,W.HMENU,W.HINSTANCE,W.LPVOID];u.CreateWindowExW.restype=W.HWND
u.FindWindowW.argtypes=[W.LPCWSTR,W.LPCWSTR];u.FindWindowW.restype=W.HWND
u.GetPropW.argtypes=[W.HWND,W.LPCWSTR];u.GetPropW.restype=W.HANDLE
u.GetParent.argtypes=[W.HWND];u.GetParent.restype=W.HWND
u.IsWindowEnabled.argtypes=[W.HWND];u.IsWindowEnabled.restype=W.BOOL
u.IsWindowVisible.argtypes=[W.HWND];u.IsWindowVisible.restype=W.BOOL
u.GetWindowLongPtrW.argtypes=[W.HWND,C.c_int];u.GetWindowLongPtrW.restype=C.c_ssize_t
u.SetWindowPos.argtypes=[W.HWND,W.HWND,C.c_int,C.c_int,C.c_int,C.c_int,W.UINT]
u.PostMessageW.argtypes=[W.HWND,W.UINT,W.WPARAM,W.LPARAM]
u.GetDlgItem.argtypes=[W.HWND,C.c_int];u.GetDlgItem.restype=W.HWND
u.SendMessageW.argtypes=[W.HWND,W.UINT,W.WPARAM,W.LPARAM];u.SendMessageW.restype=C.c_ssize_t
u.GetWindowRect.argtypes=[W.HWND,C.POINTER(W.RECT)]
u.SetForegroundWindow.argtypes=[W.HWND]
u.SetFocus.argtypes=[W.HWND]
# The STATIC window paints white under the transparent host. Keep its message queue alive.
width=u.GetSystemMetrics(0);height=u.GetSystemMetrics(1)
under=u.CreateWindowExW(0,'STATIC','Horibbangu CI white underlay',0x90000006,0,0,width,height,None,None,None,None)
assert under
u.ShowWindow(under,5);u.UpdateWindow(under)
def pump(seconds):
 end=time.time()+seconds;msg=W.MSG()
 while time.time()<end:
  while u.PeekMessageW(C.byref(msg),None,0,0,1):u.TranslateMessage(C.byref(msg));u.DispatchMessageW(C.byref(msg))
  time.sleep(.02)
rpc=None
def stop_rpc():
 global rpc
 if rpc:
  rpc.stdin.close();rpc.wait(timeout=10);rpc=None
def evaluate(expression):
 global rpc
 if rpc is None:rpc=subprocess.Popen(['node','desktop/windows/native/evaluate.cjs'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True,bufsize=1)
 rpc.stdin.write(json.dumps(expression)+'\n');rpc.stdin.flush()
 line=rpc.stdout.readline();assert line,'CDP evaluator exited'
 response=json.loads(line);assert response['ok'],response
 return response['result']
# Deliberately seed an older foreground preference: it must never restore input.
ini=Path(os.environ['LOCALAPPDATA'])/edition['data']/'settings.ini'
ini.parent.mkdir(parents=True,exist_ok=True);ini.write_text('[Desktop]\nLayer=1\nTransparency=0\n')
app=subprocess.Popen([str(ROOT/'candidate.exe')]);print('Passive host PID:',app.pid,flush=True)
try:
 deadline=time.time()+60
 while time.time()<deadline:
  pump(.2)
  assert app.poll() is None,'Native host exited before readiness'
  try:
   targets=json.load(urllib.request.urlopen('http://127.0.0.1:9223/json',timeout=1))
   if any(t.get('url','').startswith('https://horibbangu.local/') for t in targets):break
  except OSError:pass
 else:raise AssertionError('WebView2 readiness timeout')
 control=u.FindWindowW(edition['window_class'],None);assert control
 hwnd=u.GetPropW(control,'HoribbanguVisual');assert hwnd
 deadline=time.time()+30
 while not u.IsWindowVisible(hwnd) and time.time()<deadline:
  assert app.poll() is None,'Host exited before its first visible frame'
  pump(.1)
 assert u.IsWindowVisible(hwnd),'Navigation did not reach the visible-ready state'
 assert u.GetParent(hwnd),'Visible visual was not attached to Explorer'
 def passive_flags():
  flags=u.GetWindowLongPtrW(hwnd,-20)
  assert not u.IsWindowEnabled(hwnd),'Passive wallpaper unexpectedly accepts input'
  assert flags&0x200000 and flags&0x20 and flags&0x08000000 and not(flags&8),hex(flags)
 passive_flags()
 assert 'Layer=2' in ini.read_text(),'Old always-on-top preference was not migrated'
 assert not(u.GetWindowLongPtrW(hwnd,-16)&0x00C00000)
 assert u.GetWindowLongPtrW(hwnd,-16)&0x40000000,'Visual is not attached as a wallpaper child'
 subprocess.run(['node','desktop/windows/native/test_page.cjs'],check=True)
 assert evaluate('desktopHost.passive') is True
 evaluate("window.passiveDowns=0;addEventListener('pointerdown',()=>passiveDowns++);")
 # Expose the real desktop, leaving its icon and wallpaper windows intact.
 def desktop():
  u.ShowWindow(under,0)
  callback_type=C.WINFUNCTYPE(W.BOOL,W.HWND,W.LPARAM)
  u.GetClassNameW.argtypes=[W.HWND,W.LPWSTR,C.c_int]
  def minimize(h,l):
   text=C.create_unicode_buffer(128);u.GetClassNameW(h,text,128)
   if h!=control and not text.value.startswith('Chrome_') and u.IsWindowVisible(h) and text.value not in ['Progman','WorkerW','Shell_TrayWnd','Shell_SecondaryTrayWnd']:u.ShowWindow(h,6)
   return True
  callback=callback_type(minimize);u.EnumWindows(callback,0);pump(.3)
 desktop()
 # Verify actual composition on the real desktop, not only a CDP screenshot.
 evaluate("(()=>{const e=document.createElement('div');e.id='ci-visible';e.style='position:fixed;right:80px;top:100px;width:24px;height:24px;background:rgb(255,0,255);z-index:9999';document.body.append(e);})()")
 visible=False
 for _ in range(50):
  pump(.1)
  pixel=ImageGrab.grab().getpixel((width-90,110))[:3]
  if pixel==(255,0,255):visible=True;break
 if not visible:
  u.GetWindow.argtypes=[W.HWND,W.UINT];u.GetWindow.restype=W.HWND
  def describe(h):
   r=W.RECT();u.GetWindowRect(h,C.byref(r));name=C.create_unicode_buffer(128);u.GetClassNameW(h,name,128)
   return dict(hwnd=int(h or 0),cls=name.value,rect=[r.left,r.top,r.right,r.bottom],style=hex(u.GetWindowLongPtrW(h,-16)),ex=hex(u.GetWindowLongPtrW(h,-20)),visible=bool(u.IsWindowVisible(h)))
  parent=u.GetParent(hwnd)
  print('Wallpaper diagnostic',json.dumps({'visual':describe(hwnd),'parent':describe(parent),'previous':describe(u.GetWindow(hwnd,3)),'next':describe(u.GetWindow(hwnd,2)),'dom':evaluate("({hidden:document.hidden,dpr:devicePixelRatio,width:innerWidth,height:innerHeight,rect:document.getElementById('ci-visible').getBoundingClientRect().toJSON()})")}),flush=True)
  u.SetWindowPos(hwnd,0,0,0,0,0,0x413);pump(.1)
  print('Diagnostic child on top pixel:',ImageGrab.grab().getpixel((width-90,110))[:3],flush=True)
  ImageGrab.grab().save(OUT/'diagnostic-child-top.png')
  saved=u.GetWindowLongPtrW(hwnd,-20)
  u.SetWindowLongPtrW.argtypes=[W.HWND,C.c_int,C.c_ssize_t];u.SetWindowLongPtrW.restype=C.c_ssize_t
  for label,flags in [('no-layered',(saved&~0x80000)|0x200000),('no-layered-no-redirection',saved&~(0x80000|0x200000)),('layered-no-redirection',saved|0x80000|0x200000)]:
   u.SetWindowLongPtrW(hwnd,-20,flags);u.SetWindowPos(hwnd,0,0,0,0,0,0x433);pump(.3)
   print('Diagnostic',label,ImageGrab.grab().getpixel((width-90,110))[:3],flush=True)
   ImageGrab.grab().save(OUT/('diagnostic-'+label+'.png'))
  u.SetWindowLongPtrW(hwnd,-20,saved)
 assert visible,('Wallpaper is hidden behind Explorer',pixel)
 evaluate("document.getElementById('ci-visible').remove()")
 # Transparent mode must reveal the existing wallpaper rather than a black surface.
 u.ShowWindow(hwnd,0);pump(.2);empty=ImageGrab.grab().getpixel((width//2,20))[:3]
 u.ShowWindow(hwnd,4);pump(.3);transparent=ImageGrab.grab().getpixel((width//2,20))[:3]
 assert max(abs(a-b) for a,b in zip(empty,transparent))<8,('Transparent wallpaper changed',empty,transparent)
 ImageGrab.grab().save(OUT/'transparent-desktop.png')
 # Live monitor and opacity controls still work, but no input/layer switch exists.
 u.PostMessageW(hwnd,0x0111,110,0);pump(.3)
 settings=u.FindWindowW(edition['settings_class'],None);assert settings
 assert not u.GetDlgItem(settings,204) and not u.GetDlgItem(settings,205) and not u.GetDlgItem(settings,206)
 combo=u.GetDlgItem(settings,201);slider=u.GetDlgItem(settings,202)
 assert u.SendMessageW(combo,0x0146,0,0)>=1
 u.SendMessageW(combo,0x014e,0,0);u.SendMessageW(settings,0x0111,201|(1<<16),combo)
 # A legacy message requesting foreground mode cannot re-enable it.
 u.SendMessageW(settings,0x0111,205,0);passive_flags()
 evaluate('setDesktopBackground(true)');pump(.1)
 def expose():
  pump(.2)
 u.ShowWindow(hwnd,0);pump(.1);wallpaper=ImageGrab.grab().getpixel((width*3//4,height//2))[:3]
 u.ShowWindow(hwnd,4);expose();base=ImageGrab.grab().getpixel((width*3//4,height//2))[:3]
 u.SendMessageW(slider,0x0405,1,50);u.SendMessageW(settings,0x0114,0,slider);expose()
 faded=ImageGrab.grab().getpixel((width*3//4,height//2))[:3]
 assert sum(abs(a-b) for a,b in zip(faded,wallpaper))+15<sum(abs(a-b) for a,b in zip(base,wallpaper)),('Opacity failed',wallpaper,base,faded)
 ImageGrab.grab().save(OUT/'opacity-50.png')
 u.SendMessageW(slider,0x0405,1,0);u.SendMessageW(settings,0x0114,0,slider)
 u.SendMessageW(settings,0x0010,0,0);pump(.2)
 # Real OS icon controls, stale renderer hit rectangles and queued mouse messages.
 u.ShowWindow(under,5);pump(.1)
 from test_background_input import verify_background_input
 verify_background_input(u,pump,hwnd,under,evaluate,OUT,width,height,edition['settings_class'])
 assert evaluate('passiveDowns')==0
 from test_explorer_input import verify_explorer_input
 verify_explorer_input(u,pump,hwnd,under,evaluate,edition,OUT)
 # Exercise exactly the command handler called by the native tray menu.
 for id,choice in [(121,'clear'),(122,'rain'),(123,'snow'),(124,'hail'),(120,'auto')]:
  u.PostMessageW(hwnd,0x0111,id,0);pump(.15)
  assert evaluate('weatherChoice')==choice
 u.PostMessageW(hwnd,0x0111,111,0);pump(.15)
 assert evaluate("document.getElementById('status').textContent.includes('좋아하는')")
 u.PostMessageW(hwnd,0x0111,112,0);pump(.15)
 for background in [False,True]:
  evaluate('setDesktopBackground('+str(background).lower()+')');pump(.1)
  # No legacy path can arm input, including messages queued by an older host.
  evaluate('desktopHost.setInteractive(true,[0,0,innerWidth,innerHeight])')
  for message in [0x201,0x202,0x200]:u.PostMessageW(hwnd,0x8003,message,(200<<16)|200)
  pump(.1);assert evaluate('passiveDowns')==0;passive_flags()
 for _ in range(50):
  if evaluate('desktopBackground && lastLakeFrame>0'):break
  pump(.1)
 assert evaluate('desktopBackground && lastLakeFrame>0')
 ImageGrab.grab().save(OUT/'passive-desktop.png')
 assets=Path(os.environ['LOCALAPPDATA'])/edition['data']/'Native'/edition['version']
 assert (assets/'LICENSE').exists() and (assets/'WebView2-LICENSE.txt').exists()
 u.PostMessageW(hwnd,0x0312,1,0);pump(.2)
 settings=u.FindWindowW(edition['settings_class'],None);assert settings
 u.SendMessageW(u.GetDlgItem(settings,202),0x0405,1,37);u.SendMessageW(settings,0x0114,0,u.GetDlgItem(settings,202))
 u.SendMessageW(settings,0x0010,0,0);pump(.1)
 stop_rpc();u.PostMessageW(hwnd,0x0010,0,0);app.wait(timeout=15)
 import shutil
 moved=OUT/'relocated';moved.mkdir(exist_ok=True);shutil.copyfile(ROOT/'candidate.exe',moved/'cats.exe')
 app=subprocess.Popen([str(moved/'cats.exe')]);pump(5)
 assert app.poll() is None and evaluate('desktopBackground && desktopHost.passive')
 control=u.FindWindowW(edition['window_class'],None);hwnd=u.GetPropW(control,'HoribbanguVisual');assert u.GetParent(hwnd);passive_flags()
 u.PostMessageW(hwnd,0x0312,1,0);pump(.2)
 settings=u.FindWindowW(edition['settings_class'],None);assert settings
 assert u.SendMessageW(u.GetDlgItem(settings,202),0x0400,0,0)==37
 stop_rpc();u.PostMessageW(hwnd,0x0312,2,0);app.wait(timeout=15);assert app.returncode==0
 (OUT/'result.json').write_text(json.dumps({'ok':True,'exeBytes':(ROOT/'candidate.exe').stat().st_size,'checks':['real passive Win32/WebView2 launch','visible Explorer wallpaper composition','old topmost setting migration','monitor selection and opacity','permanent passive no-activate wallpaper window','no legacy input re-arming','Win32 icon control selection/double-click/right-click/drag','real Explorer icon selection and shortcut launch','tray commands for weather/rest/scenery','offline background and lake','persistent settings and relocated EXE','hotkey settings and exit']},indent=2))
 print('Passive Windows desktop verification passed.',flush=True)
finally:
 if rpc:stop_rpc()
 ImageGrab.grab().save(OUT/'final-desktop.png')
 import shutil
 log=Path(os.environ['LOCALAPPDATA'])/edition['data']/'Native'/edition['version']/'native-diagnostics.txt'
 if log.exists():shutil.copyfile(log,OUT/'native-diagnostics.txt')
 if app.poll() is None:app.terminate();app.wait(timeout=10)
 u.DestroyWindow(under)
