"""Physical input checks for the explicit topmost mode; no global mouse hooks."""
from pathlib import Path
import ctypes as C,ctypes.wintypes as W,json,os,subprocess,time,sys,faulthandler
from PIL import ImageGrab
ROOT=Path(__file__).resolve().parents[3];sys.path.insert(0,str(ROOT/'desktop/windows'))
from editions import edition_config
edition=edition_config(os.environ.get('HORIBBANGU_EDITION','default'));os.chdir(ROOT)
OUT=edition['verification'];OUT.mkdir(parents=True,exist_ok=True)
faulthandler.dump_traceback_later(180,exit=True)
u=C.WinDLL('user32',use_last_error=True)
u.FindWindowW.argtypes=[W.LPCWSTR,W.LPCWSTR];u.FindWindowW.restype=W.HWND
u.GetPropW.argtypes=[W.HWND,W.LPCWSTR];u.GetPropW.restype=W.HANDLE
u.GetParent.argtypes=[W.HWND];u.GetParent.restype=W.HWND
u.GetWindowLongPtrW.argtypes=[W.HWND,C.c_int];u.GetWindowLongPtrW.restype=C.c_ssize_t
u.GetWindowRect.argtypes=[W.HWND,C.POINTER(W.RECT)]
u.IsWindowVisible.argtypes=[W.HWND];u.IsWindowVisible.restype=W.BOOL
u.PostMessageW.argtypes=[W.HWND,W.UINT,W.WPARAM,W.LPARAM]
u.SendMessageW.argtypes=[W.HWND,W.UINT,W.WPARAM,W.LPARAM];u.SendMessageW.restype=C.c_ssize_t
u.GetDlgItem.argtypes=[W.HWND,C.c_int];u.GetDlgItem.restype=W.HWND
u.SetWindowPos.argtypes=[W.HWND,W.HWND,C.c_int,C.c_int,C.c_int,C.c_int,W.UINT]
u.CreateWindowExW.argtypes=[W.DWORD,W.LPCWSTR,W.LPCWSTR,W.DWORD,C.c_int,C.c_int,C.c_int,C.c_int,W.HWND,W.HMENU,W.HINSTANCE,W.LPVOID];u.CreateWindowExW.restype=W.HWND
u.DestroyWindow.argtypes=[W.HWND]
u.WindowFromPoint.argtypes=[W.POINT];u.WindowFromPoint.restype=W.HWND
u.GetClassNameW.argtypes=[W.HWND,W.LPWSTR,C.c_int]
u.SetWindowLongPtrW.argtypes=[W.HWND,C.c_int,C.c_ssize_t];u.SetWindowLongPtrW.restype=C.c_ssize_t
u.SetLayeredWindowAttributes.argtypes=[W.HWND,W.DWORD,W.BYTE,W.DWORD]
u.DefWindowProcW.argtypes=[W.HWND,W.UINT,W.WPARAM,W.LPARAM];u.DefWindowProcW.restype=C.c_ssize_t
WNDPROC=C.WINFUNCTYPE(C.c_ssize_t,W.HWND,W.UINT,W.WPARAM,W.LPARAM)
class WNDCLASS(C.Structure):
 _fields_=[('style',W.UINT),('proc',WNDPROC),('extra',C.c_int),('windowExtra',C.c_int),('instance',W.HINSTANCE),('icon',W.HANDLE),('cursor',W.HANDLE),('brush',W.HANDLE),('menu',W.LPCWSTR),('name',W.LPCWSTR)]
probe_proc=WNDPROC(lambda h,m,w,l:u.DefWindowProcW(h,m,w,l))
kernel=C.WinDLL('kernel32');kernel.GetModuleHandleW.argtypes=[W.LPCWSTR];kernel.GetModuleHandleW.restype=W.HINSTANCE
instance=kernel.GetModuleHandleW(None)
probe_class=WNDCLASS();probe_class.proc=probe_proc;probe_class.instance=instance;probe_class.brush=6;probe_class.name='HoribbanguInputProbe'
u.RegisterClassW.argtypes=[C.POINTER(WNDCLASS)];assert u.RegisterClassW(C.byref(probe_class))
apps=[];rpc=None;under=None
def pump(seconds):
 end=time.time()+seconds;msg=W.MSG()
 while time.time()<end:
  while u.PeekMessageW(C.byref(msg),None,0,0,1):u.TranslateMessage(C.byref(msg));u.DispatchMessageW(C.byref(msg))
  time.sleep(.015)
def evaluate(expression):
 global rpc
 if rpc is None:rpc=subprocess.Popen(['node','desktop/windows/native/evaluate.cjs'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True,bufsize=1)
 rpc.stdin.write(json.dumps(expression)+'\n');rpc.stdin.flush();line=rpc.stdout.readline();assert line,'CDP disconnected'
 result=json.loads(line);assert result['ok'],result;return result['result']
def stop_rpc():
 global rpc
 if rpc:rpc.stdin.close();rpc.wait(timeout=10);rpc=None
def launch():
 p=subprocess.Popen([str(ROOT/'candidate.exe')]);apps.append(p)
 deadline=time.time()+60
 while time.time()<deadline:
  assert p.poll() is None
  control=u.FindWindowW(edition['window_class'],None)
  h=u.GetPropW(control,'HoribbanguVisual') if control else None
  if h and u.IsWindowVisible(h):return p,control,h
  pump(.1)
 raise AssertionError('Interactive host readiness timeout')
def click(x,y):
 u.SetCursorPos(int(x),int(y));pump(.08);u.mouse_event(2,0,0,0,0);pump(.05);u.mouse_event(4,0,0,0,0);pump(.2)
def hit(x,y):
 target=u.WindowFromPoint(W.POINT(x,y));name=C.create_unicode_buffer(128)
 if target:u.GetClassNameW(target,name,128)
 return {'window':target,'class':name.value}
def cat_point(h):
 r=evaluate('(()=>{const r=cats[0].el.getBoundingClientRect();return {x:(r.left+r.width*.65)*devicePixelRatio,y:(r.top+r.height*.55)*devicePixelRatio};})()')
 rect=W.RECT();u.GetWindowRect(h,C.byref(rect));return int(rect.left+r['x']),int(rect.top+r['y'])
try:
 pump(2);app,control,h=launch();assert u.GetParent(h)
 under=u.CreateWindowExW(0,probe_class.name,'Horibbangu click-through probe',0x90000000,0,0,u.GetSystemMetrics(0),u.GetSystemMetrics(1),None,None,instance,None);assert under
 probe=u.CreateWindowExW(0,'BUTTON','Underlying checkbox',0x50000003,40,150,190,45,under,None,None,None);assert probe
 u.SetWindowPos(under,W.HWND(0),0,0,0,0,0x0013);pump(.2)
 click(80,170);assert u.SendMessageW(probe,0xF0,0,0)==1,('Probe precondition',hit(80,170),probe)
 u.SendMessageW(probe,0xF1,0,0)
 # Exercise the actual native checkbox, not a renderer-only flag.
 u.PostMessageW(h,0x111,110,0);pump(.3)
 settings=u.FindWindowW(edition['settings_class'],None);assert settings
 check=u.GetDlgItem(settings,203);assert check
 u.SendMessageW(check,0xF5,0,0);pump(.7)
 assert u.SendMessageW(check,0xF0,0,0)==1
 assert not u.GetParent(h) and u.GetWindowLongPtrW(h,-20)&8,(u.GetParent(h),hex(u.GetWindowLongPtrW(h,-20)))
 slider=u.GetDlgItem(settings,202);u.SendMessageW(slider,0x0405,1,0);u.SendMessageW(settings,0x0114,0,slider)
 u.PostMessageW(settings,0x10,0,0);pump(.2)
 assert evaluate('!desktopHost.passive && !document.body.classList.contains("passive-desktop")')
 evaluate("setDesktopBackground(false);setRoomControls(false);cats.slice(1).forEach(c=>c.el.style.display='none');const c=cats[0];c.cozy=null;c.goal=null;c.edge=null;c.air=false;c.stand=null;c.x=innerWidth*.5;c.y=0;c.mode='watch';c.until=Infinity;renderCatPosition(c);window.topDowns=0;window.topClicks=0;c.el.addEventListener('pointerdown',()=>topDowns++);c.el.addEventListener('click',()=>topClicks++);")
 proxy=u.GetPropW(control,'HoribbanguInput');assert proxy
 deadline=time.time()+5
 while not u.IsWindowVisible(proxy) and time.time()<deadline:pump(.1)
 assert u.IsWindowVisible(proxy)
 u.SetWindowPos(under,W.HWND(0),0,0,0,0,0x0013);pump(.2)
 evaluate("(()=>{const e=document.createElement('div');e.style='position:fixed;right:80px;top:100px;width:24px;height:24px;background:rgb(255,0,255);z-index:9999';document.body.append(e);})()")
 rect=W.RECT();u.GetWindowRect(h,C.byref(rect));painted=False
 for _ in range(50):
  pump(.1)
  if ImageGrab.grab().getpixel((rect.right-90,rect.top+110))[:3]==(255,0,255):painted=True;break
 assert painted,'Topmost composition is not visible above another application'
 # Empty parts of a topmost scene must let a real control in another window work.
 click(80,170);through=u.SendMessageW(probe,0xF0,0,0)==1
 if not through:
  print('Empty-space target:',hit(80,170),'probe:',probe,flush=True)
  original=u.GetWindowLongPtrW(h,-20);u.SetWindowLongPtrW(h,-20,original|0x80000);u.SetLayeredWindowAttributes(h,0,255,2);pump(.25)
  click(80,170)
  print('Layered top-level diagnostic:',{'click':u.SendMessageW(probe,0xF0,0,0),'pixel':ImageGrab.grab().getpixel((rect.right-90,rect.top+110))[:3]},flush=True)
  u.SetWindowLongPtrW(h,-20,original)
 assert through,('Topmost empty-space click-through',hit(80,170))
 x,y=cat_point(h);click(x,y);assert evaluate('topDowns>0 && topClicks>0'),evaluate('({downs:topDowns,clicks:topClicks,mode:cats[0].mode})')
 x,y=cat_point(h);u.SetCursorPos(x,y);pump(.1);u.mouse_event(2,0,0,0,0);pump(.08)
 for i in range(1,11):u.SetCursorPos(x+i*10,y-i*8);pump(.035)
 assert evaluate('cats[0].mode==="bubble" && cats[0].el.classList.contains("in-bubble")')
 ImageGrab.grab().save(OUT/'topmost-drag.png')
 u.mouse_event(4,0,0,0,0);pump(.2);assert evaluate('cats[0].mode!=="bubble"')
 # Switch to background during a second drag: it must release capture and input.
 x,y=cat_point(h);u.SetCursorPos(x,y);pump(.1);u.mouse_event(2,0,0,0,0);pump(.1);u.SetCursorPos(x+45,y-40);pump(.15)
 u.PostMessageW(h,0x111,115,0);pump(.6);u.mouse_event(4,0,0,0,0)
 assert u.GetParent(h) and not (u.GetWindowLongPtrW(h,-20)&8)
 assert not u.IsWindowVisible(proxy)
 assert evaluate('desktopHost.passive && cats[0].mode!=="bubble"')
 click(80,170);assert u.SendMessageW(probe,0xF0,0,0)==0
 # The tray command restores topmost interaction, and the explicit choice persists.
 u.PostMessageW(h,0x111,114,0);pump(.6);assert not u.GetParent(h)
 assert evaluate('!desktopHost.passive')
 stop_rpc();u.PostMessageW(h,0x10,0,0);app.wait(timeout=15);pump(2)
 app,control,h=launch();assert not u.GetParent(h) and u.GetWindowLongPtrW(h,-20)&8
 assert evaluate('!desktopHost.passive')
 u.PostMessageW(h,0x111,115,0);pump(.5);assert u.GetParent(h)
 stop_rpc();u.PostMessageW(h,0x10,0,0);app.wait(timeout=15)
 (OUT/'interactive-result.json').write_text(json.dumps({'ok':True,'checks':['native always-on-top checkbox','topmost detached visual','empty-space physical click-through','physical cat click','physical bubble drag and release','background switch during capture','passive background and hidden input proxy','tray mode switch','explicit topmost preference persists']},indent=2))
 print('Actual topmost interaction and background click-through checks passed.',flush=True)
finally:
 ImageGrab.grab().save(OUT/'topmost-final.png')
 if rpc:stop_rpc()
 if under:u.DestroyWindow(under)
 for p in apps:
  if p.poll() is None:p.terminate();p.wait(timeout=10)
