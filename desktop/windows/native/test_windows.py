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
 # Use the actual native settings controls: monitor enumeration, live opacity and stacking.
 evaluate('setDesktopBackground(true)');pump(.4)
 u.PostMessageW(hwnd,0x0111,110,0);pump(.4)
 settings=u.FindWindowW('HoribbanguDesktopSettings',None);assert settings
 ImageGrab.grab().save(OUT/'settings.png')
 combo=u.GetDlgItem(settings,201);slider=u.GetDlgItem(settings,202)
 assert u.SendMessageW(combo,0x0146,0,0)>=1  # CB_GETCOUNT
 u.SendMessageW(combo,0x014E,0,0)  # CB_SETCURSEL
 u.SendMessageW(settings,0x0111,201|(1<<16),combo)
 base=ImageGrab.grab().getpixel((width*3//4,height//2))[:3]
 u.SendMessageW(slider,0x0405,1,50)  # TBM_SETPOS
 u.SendMessageW(settings,0x0114,0,slider);pump(.4)
 faded=ImageGrab.grab().getpixel((width*3//4,height//2))[:3]
 ImageGrab.grab().save(OUT/'opacity-50.png')
 assert sum(faded)>sum(base)+30,('Opacity did not blend with desktop',base,faded)
 ini=Path(os.environ['LOCALAPPDATA'])/'HoribbanguDesktop/settings.ini'
 assert 'Transparency=50' in ini.read_text() and 'Monitor=' in ini.read_text()
 u.SendMessageW(settings,0x0111,205,0);pump(.2)
 assert u.GetWindowLongPtrW(hwnd,-20)&0x8  # WS_EX_TOPMOST
 u.SendMessageW(settings,0x0111,206,0);pump(.2)
 style=u.GetWindowLongPtrW(hwnd,-20)
 assert not(style&0x8) and style&0x08000000  # behind: non-topmost and no activation
 u.SendMessageW(settings,0x0111,204,0);pump(.2)
 assert not(u.GetWindowLongPtrW(hwnd,-20)&(0x8|0x08000000))
 u.SendMessageW(slider,0x0405,1,0);u.SendMessageW(settings,0x0114,0,slider)
 u.PostMessageW(settings,0x0010,0,0);pump(.3)
 evaluate('setDesktopBackground(false)');pump(.3)
 print('Native monitor selection, opacity and top/behind/normal settings verified.',flush=True)
 # Closing a settings window restores the foreground white test application.
 # Explicitly expose the cats before testing their actual clicks.
 u.SetWindowPos(hwnd,0,0,0,0,0,0x13);pump(.5)

 pump(.6)
 # Blank middle pixel must show actual white underlay, not black compositor fill.
 screen=ImageGrab.grab();screen.save(OUT/'transparent-desktop.png')
 assert sum(min(p[:3])<200 for p in screen.getdata())>5000,'Cats and furniture were occluded before the input test'
 sample=screen.getpixel((width//2,height//2))[:3]
 assert min(sample)>240,('Transparency failed',sample)
 assert u.GetWindowLongPtrW(hwnd,-20)&0x20,'Empty pixels must pass clicks through'
 box=evaluate("(()=>{const r=cats[0].el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()")
 evaluate("window.nativeEvents=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','gotpointercapture'])addEventListener(type,e=>window.nativeEvents.push({type,buttons:e.buttons,x:e.clientX,y:e.clientY,cat:e.target.closest?.('.cat')?.dataset?.name}),true);")
 # The Windows native mouse pump must enable hit testing over a visible cat.
 x=int(box['x']+box['width']/2);y=int(box['y']+box['height']/2)
 u.SetCursorPos(x,y);pump(.5)
 pointer=evaluate("JSON.stringify({pointer:lastPointer,cat:{x:cats[0].x,y:cats[0].y,mode:cats[0].mode},target:document.elementFromPoint(lastPointer.x,lastPointer.y)?.className,interactive:lastInteractive})")
 (OUT/'pointer.json').write_text(pointer,encoding='utf-8')
 assert json.loads(pointer)['interactive'],'Cat did not become interactive'
 u.mouse_event(0x0002,0,0,0,0);pump(.1)
 for step in range(1,9):
  # SetCursorPos alone doesn't produce WH_MOUSE_LL movement packets.
  u.mouse_event(0x8001,round((x+step*12)*65535/(width-1)),round((y-step*9)*65535/(height-1)),0,0);pump(.06)
 (OUT/'drag-events.json').write_text(json.dumps(evaluate('({events:window.nativeEvents,mode:cats[0].mode,holding})')),encoding='utf-8')
 assert evaluate("cats[0].mode==='bubble'"),'Native drag never entered bubble mode'
 u.mouse_event(0x0004,0,0,0,0);pump(.2)
 assert evaluate("cats[0].mode!=='bubble'")
 # A real foreground application must retain its click even over a cat's DOM rect.
 evaluate("window.nativeDowns=0;addEventListener('pointerdown',()=>window.nativeDowns++);")
 u.SetWindowPos(under,0,0,0,0,0,0x43);u.SetForegroundWindow(under);pump(.3)
 box=evaluate("(()=>{const r=cats[0].el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()")
 u.SetCursorPos(int(box['x']+box['width']/2),int(box['y']+box['height']/2));pump(.3)
 u.mouse_event(0x0002,0,0,0,0);pump(.1);u.mouse_event(0x0004,0,0,0,0);pump(.1)
 assert evaluate('window.nativeDowns')==0,'A covered cat intercepted foreground input'
 # Background mode must also pass real desktop-icon gestures through. Check
 # after a stale hit rectangle and a shell-style Z-order change, not just styles.
 from test_background_input import verify_background_input
 verify_background_input(u,pump,hwnd,under,evaluate,OUT,width,height)
 u.SetWindowPos(hwnd,0,0,0,0,0,0x13);pump(.2)
 box=evaluate("(()=>{const r=cats[0].el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()")
 x=int(box['x']+box['width']/2);y=int(box['y']+box['height']/2)
 u.SetCursorPos(x,y);pump(.3)
 u.mouse_event(0x0002,0,0,0,0);pump(.05)
 u.mouse_event(0x8001,round((x+25)*65535/(width-1)),round((y-25)*65535/(height-1)),0,0);pump(.1)
 assert evaluate("cats[0].mode==='bubble'"),'Interactive cat drag did not return after background mode'
 # Switching to background during a held drag must release the bubble.
 u.PostMessageW(hwnd,0x0111,110,0);pump(.1)
 settings=u.FindWindowW('HoribbanguDesktopSettings',None);assert settings
 u.SendMessageW(settings,0x0111,206,0);pump(.1)
 u.mouse_event(0x0004,0,0,0,0);pump(.1)
 assert evaluate("cats[0].mode!=='bubble'"),'Entering background mode left a cat captured'
 u.SendMessageW(settings,0x0111,204,0);u.SendMessageW(settings,0x0010,0,0);pump(.1)
 u.SetWindowPos(hwnd,0,0,0,0,0,0x13);pump(.1)
 # Exercise the actual Win32 hotkey route used by Ctrl+Alt+H.
 u.PostMessageW(hwnd,0x0312,1,0);pump(.3)
 assert evaluate("document.body.classList.contains('controls-visible')")
 evaluate('setDesktopBackground(true)');pump(.5)
 ImageGrab.grab().save(OUT/'painted-desktop.png')
 assert evaluate('desktopBackground && lastLakeFrame>0')
 # Read the current binary's embedded guide and notices after real extraction.
 assets=Path(os.environ['LOCALAPPDATA'])/'HoribbanguDesktop/Native/3.3.1'
 assert (assets/'LICENSE').exists() and (assets/'WebView2-LICENSE.txt').exists()
 # Persist non-default native settings as well as the renderer's background choice.
 u.PostMessageW(hwnd,0x0111,110,0);pump(.2)
 settings=u.FindWindowW('HoribbanguDesktopSettings',None);slider=u.GetDlgItem(settings,202)
 u.SendMessageW(slider,0x0405,1,37);u.SendMessageW(settings,0x0114,0,slider)
 u.SendMessageW(settings,0x0111,206,0)
 u.PostMessageW(settings,0x0010,0,0);pump(.2)
 # Exit and relaunch from a different location: same profile and native settings.
 stop_rpc();u.PostMessageW(hwnd,0x0010,0,0);app.wait(timeout=15)
 import shutil
 moved=OUT/'relocated';moved.mkdir(exist_ok=True);shutil.copyfile(ROOT/'candidate.exe',moved/'cats.exe')
 app=subprocess.Popen([str(moved/'cats.exe')]);pump(5)
 assert app.poll() is None and evaluate('desktopBackground')
 hwnd=u.FindWindowW('HoribbanguWebView2Desktop',None)
 assert u.GetWindowLongPtrW(hwnd,-20)&0x08000000
 u.PostMessageW(hwnd,0x0111,110,0);pump(.3)
 settings=u.FindWindowW('HoribbanguDesktopSettings',None)
 assert u.SendMessageW(u.GetDlgItem(settings,202),0x0400,0,0)==37  # TBM_GETPOS
 stop_rpc();u.PostMessageW(hwnd,0x0312,2,0);app.wait(timeout=15);assert app.returncode==0
 (OUT/'result.json').write_text(json.dumps({'ok':True,'exeBytes':(ROOT/'candidate.exe').stat().st_size,'transparentPixel':sample,'checks':['real Win32/WebView2 launch','monitor selection and opacity','top/behind modes','offline renderer','background and lake','persistent settings','transparent compositor','physical mouse click-through and drag','background icon selection/double-click/right-click/drag','interactive mode restoration and held-drag release','hotkey menu and exit','relocated EXE']},indent=2))
 print('Windows native runtime verification passed.')
finally:
 if rpc:stop_rpc()
 ImageGrab.grab().save(OUT/'final-desktop.png')
 import shutil
 log=Path(os.environ['LOCALAPPDATA'])/'HoribbanguDesktop/Native/3.3.1/native-diagnostics.txt'
 if log.exists():shutil.copyfile(log,OUT/'native-diagnostics.txt')
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
