"""Run on an interactive Windows CI desktop, never claim cross-compilation is execution."""
from pathlib import Path
import ctypes as C,ctypes.wintypes as W,json,os,subprocess,time,urllib.request
from PIL import ImageGrab
ROOT=Path(__file__).resolve().parents[3]
os.chdir(ROOT)
OUT=ROOT/'build/native-verification';OUT.mkdir(parents=True,exist_ok=True)
u=C.WinDLL('user32',use_last_error=True)
u.CreateWindowExW.argtypes=[W.DWORD,W.LPCWSTR,W.LPCWSTR,W.DWORD,C.c_int,C.c_int,C.c_int,C.c_int,W.HWND,W.HMENU,W.HINSTANCE,W.LPVOID];u.CreateWindowExW.restype=W.HWND
u.FindWindowW.argtypes=[W.LPCWSTR,W.LPCWSTR];u.FindWindowW.restype=W.HWND
u.GetWindowLongPtrW.argtypes=[W.HWND,C.c_int];u.GetWindowLongPtrW.restype=C.c_ssize_t
u.SetWindowPos.argtypes=[W.HWND,W.HWND,C.c_int,C.c_int,C.c_int,C.c_int,W.UINT]
u.PostMessageW.argtypes=[W.HWND,W.UINT,W.WPARAM,W.LPARAM]
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
def evaluate(expression):
 # A short separate CDP client avoids dependence on a third-party Python websocket library.
 code="const{chromium}=require('playwright');(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{const p=b.contexts()[0].pages().find(p=>p.url().startsWith('https://horibbangu.local/'));console.log(JSON.stringify(await p.evaluate("+json.dumps(expression)+")));}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});"
 return json.loads(subprocess.check_output(['node','-e',code],text=True).strip())
app=subprocess.Popen([str(ROOT/'candidate.exe')]);print('Native host PID:',app.pid,flush=True)
try:
 deadline=time.time()+60
 print('Starting WebView2 readiness probe',flush=True)
 for _ in range(300):
  if time.time()>deadline:raise AssertionError('WebView2 did not become ready within 60 seconds')
  pump(.2)
  if app.poll() is not None:raise AssertionError(f'Native host exited: {app.returncode}')
  try:
   targets=json.load(urllib.request.urlopen('http://127.0.0.1:9223/json',timeout=1))
   if any(t.get('url','').startswith('https://horibbangu.local/') for t in targets):break
  except OSError:pass
 else:raise AssertionError('WebView2 never became ready')
 hwnd=u.FindWindowW('HoribbanguWebView2Desktop',None);assert hwnd
 # Keep app above white underlay without changing production's non-topmost default.
 u.SetWindowPos(hwnd,0,0,0,0,0,0x13);pump(1)
 style=u.GetWindowLongPtrW(hwnd,-16);extended=u.GetWindowLongPtrW(hwnd,-20)
 assert not(style&0x00C00000),'Title bar unexpectedly present'
 assert extended&0x80000 and extended&0x80,'Layered/tool window missing'
 subprocess.run(['node','desktop/windows/native/test_page.cjs'],check=True)
 pump(.6)
 # Blank middle pixel must show actual white underlay, not black compositor fill.
 screen=ImageGrab.grab();screen.save(OUT/'transparent-desktop.png')
 sample=screen.getpixel((width//2,height//2))[:3]
 assert min(sample)>240,('Transparency failed',sample)
 assert u.GetWindowLongPtrW(hwnd,-20)&0x20,'Empty pixels must pass clicks through'
 box=json.loads((OUT/'cat.json').read_text())
 # The Windows native mouse pump must enable hit testing over a visible cat.
 x=int(box['x']+box['width']/2);y=int(box['y']+box['height']/2)
 u.SetCursorPos(x,y);pump(.5)
 assert not(u.GetWindowLongPtrW(hwnd,-20)&0x20),'Cat did not become interactive'
 u.mouse_event(0x0002,0,0,0,0);pump(.1)
 for step in range(1,9):u.SetCursorPos(x+step*12,y-step*9);pump(.06)
 assert evaluate("cats[0].mode==='bubble'"),'Native drag never entered bubble mode'
 u.mouse_event(0x0004,0,0,0,0);pump(.2)
 assert evaluate("cats[0].mode!=='bubble'")
 # Exercise the actual Win32 hotkey route used by Ctrl+Alt+H.
 u.PostMessageW(hwnd,0x0312,1,0);pump(.3)
 assert evaluate("document.body.classList.contains('controls-visible')")
 evaluate('setDesktopBackground(true)');pump(.5)
 ImageGrab.grab().save(OUT/'painted-desktop.png')
 assert evaluate('desktopBackground && lastLakeFrame>0')
 # Read the current binary's embedded guide and notices after real extraction.
 assets=Path(os.environ['LOCALAPPDATA'])/'HoribbanguDesktop/Native/3.3.0'
 assert (assets/'LICENSE').exists() and (assets/'WebView2-LICENSE.txt').exists()
 # Exit and relaunch from a different location: same profile, same background preference.
 u.PostMessageW(hwnd,0x0010,0,0);app.wait(timeout=15)
 import shutil
 moved=OUT/'relocated';moved.mkdir(exist_ok=True);shutil.copyfile(ROOT/'candidate.exe',moved/'cats.exe')
 app=subprocess.Popen([str(moved/'cats.exe')]);pump(5)
 assert app.poll() is None and evaluate('desktopBackground')
 hwnd=u.FindWindowW('HoribbanguWebView2Desktop',None)
 u.PostMessageW(hwnd,0x0312,2,0);app.wait(timeout=15);assert app.returncode==0
 (OUT/'result.json').write_text(json.dumps({'ok':True,'exeBytes':(ROOT/'candidate.exe').stat().st_size,'transparentPixel':sample,'checks':['real Win32/WebView2 launch','offline renderer','background and lake','persistent settings','transparent compositor','physical mouse click-through and drag','hotkey menu and exit','relocated EXE']},indent=2))
 print('Windows native runtime verification passed.')
finally:
 ImageGrab.grab().save(OUT/'final-desktop.png')
 titles=[]
 callbackType=C.WINFUNCTYPE(W.BOOL,W.HWND,W.LPARAM)
 u.GetWindowTextW.argtypes=[W.HWND,W.LPWSTR,C.c_int]
 def title(h,l):
  text=C.create_unicode_buffer(1024);u.GetWindowTextW(h,text,1024)
  if text.value:titles.append(text.value)
  return True
 callback=callbackType(title);u.EnumWindows(callback,0)
 (OUT/'window-titles.json').write_text(json.dumps(titles,ensure_ascii=False),encoding='utf-8')
 if app.poll() is None:app.terminate();app.wait(timeout=10)
 u.DestroyWindow(under)
